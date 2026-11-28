/**
 * dsh-liangTime Host half.
 *
 * Owns startup pricing/holiday sync, persisted preferences, update checks,
 * and the authenticated JSON routes the browser half reads. No model-facing
 * tools or session data are involved.
 */

import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import {
  applySettingsPatch, DEFAULT_SETTINGS, normalizeHolidayList, readSettings,
} from './lib/settings.js'
import { buildSnapshot, DEFAULT_OFFICIAL_SOURCE, officialFromSync } from './lib/schedule.js'

const execFileAsync = promisify(execFile)
const PRICING_SCRIPT_PATH = fileURLToPath(new URL('./scripts/fetch_pricing.py', import.meta.url))
const HOLIDAY_SCRIPT_PATH = fileURLToPath(new URL('./scripts/fetch_holidays.py', import.meta.url))
const DEFAULT_HOLIDAY_SOURCE = 'https://sousuo.www.gov.cn/search-gov/data'
const STATE_PATH = '/api/liangtime.state'
const SETTINGS_PATH = '/api/liangtime.settings'
const SYNC_PATH = '/api/liangtime.sync'
const UPDATE_CHECK_PATH = '/api/liangtime.update-check'
const UPDATE_INSTALL_PATH = '/api/liangtime.update-install'
const MAX_BODY_BYTES = 1_500_000
const SYNC_TIMEOUT_MS = 28_000
const PACKAGE_NAME = 'dsh-liangtime'
const CURRENT_VERSION = (() => {
  try {
    const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'))
    return typeof manifest.version === 'string' ? manifest.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
})()
const UPDATE_TIMEOUT_MS = 8_000
// Ordered fallbacks. The first answer wins; every channel is tried before the
// settings page reports that update checking is unavailable.
const UPDATE_CHANNELS = Object.freeze([
  {
    id: 'npm',
    url: 'https://registry.npmjs.org/dsh-liangtime/latest',
    registry: 'https://registry.npmjs.org/',
  },
  {
    id: 'npmmirror',
    url: 'https://registry.npmmirror.com/dsh-liangtime/latest',
    registry: 'https://registry.npmmirror.com/',
  },
  {
    id: 'jsdelivr',
    url: 'https://cdn.jsdelivr.net/npm/dsh-liangtime@latest/package.json',
    registry: null,
  },
])

function noStoreJson(value, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

function failure(message, status = 500) {
  return noStoreJson({ error: message }, status)
}

async function readJson(request) {
  const type = request.headers.get('content-type') ?? ''
  if (!type.toLowerCase().includes('application/json')) {
    return { ok: false, response: failure('content-type must be application/json', 415) }
  }
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { ok: false, response: failure('request body is too large', 413) }
  }
  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, response: failure('request body is too large', 413) }
  }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, response: failure('request body is not valid JSON', 400) }
  }
}

function compareVersions(left, right) {
  const parse = value => String(value)
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .slice(0, 3)
    .map(part => Number.parseInt(part, 10) || 0)
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return 0
}

async function fetchJson(url, signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPDATE_TIMEOUT_MS)
  const abort = () => controller.abort()
  signal.addEventListener('abort', abort, { once: true })
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': `dsh-liangtime/${CURRENT_VERSION}`,
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', abort)
  }
}

/**
 * Resolve a writable plugin-data directory without assuming a profile exists.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @returns {string}
 */
function resolveDataDirectory(ctx) {
  const profile = ctx.get('profileContext')
  const home = typeof profile?.home === 'string'
    ? profile.home
    : process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'plugin-data', 'dsh-liangtime')
}

/**
 * The Host half.
 * @param {import('@deepseek-ai/cordis').Context} ctx - owning context.
 */
export function apply(ctx) {
  const dataDirectory = resolveDataDirectory(ctx)
  const settingsFile = join(dataDirectory, 'settings.json')
  const lifetime = new AbortController()
  // Client stores use this to discard revision comparisons across Host
  // restarts, where the per-apply revision sequence starts over at 1.
  const instanceId = randomUUID()

  let settings = structuredClone(DEFAULT_SETTINGS)
  let syncState = {
    phase: 'idle',
    error: null,
    lastSuccess: null,
    lastAttempt: null,
    sourceUrl: DEFAULT_OFFICIAL_SOURCE,
    language: null,
  }
  let holidaySyncState = {
    phase: 'idle',
    error: null,
    lastSuccess: null,
    lastAttempt: null,
    sourceUrl: DEFAULT_HOLIDAY_SOURCE,
    notices: [],
  }
  let updateState = {
    phase: 'idle',
    currentVersion: CURRENT_VERSION,
    latestVersion: null,
    installedVersion: null,
    channel: null,
    error: null,
    lastCheck: null,
    available: false,
    canInstall: false,
  }
  let revision = 1
  let disposed = false
  let syncPromise = null
  let holidaySyncPromise = null
  let updateCheckPromise = null
  let updateInstallPromise = null
  let writeChain = Promise.resolve()

  const logWarning = (message, error) => {
    try {
      ctx.logger?.warn?.(`dsh-liangtime: ${message}`, error instanceof Error ? error.message : error)
    } catch {
      // Logging must never change plugin behavior.
    }
  }

  const persist = () => {
    const operation = writeChain.then(async () => {
      const payload = JSON.stringify(settings, null, 2)
      const temporary = `${settingsFile}.tmp-${process.pid}`
      await mkdir(dataDirectory, { recursive: true })
      await writeFile(temporary, `${payload}\n`, 'utf8')
      await rename(temporary, settingsFile)
    })
    writeChain = operation.catch(error => {
      logWarning('failed to save settings', error)
    })
    return operation
  }

  const snapshot = () => ({
    ...buildSnapshot(settings, syncState, holidaySyncState, revision),
    instanceId,
    update: { ...updateState },
  })

  const setUpdateState = patch => {
    updateState = { ...updateState, ...patch }
    revision += 1
  }

  const updateTargetSupport = async () => {
    const manager = ctx.get('pluginManager')
    if (!manager || typeof manager.updateBundle !== 'function' || typeof manager.listBundles !== 'function') {
      return { canInstall: false, reason: 'Plugin Manager is unavailable.' }
    }
    try {
      const bundles = await manager.listBundles()
      const installed = Array.isArray(bundles)
        ? bundles.find(bundle => bundle?.name === PACKAGE_NAME)
        : null
      if (installed?.update === 'registry') return { canInstall: true, reason: null }
      return {
        canInstall: false,
        reason: 'This copy was not installed from a registry; update it from Plugin Manager.',
      }
    } catch (error) {
      return {
        canInstall: false,
        reason: `Could not inspect the installed copy: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  const installUpdate = async () => {
    if (updateInstallPromise !== null) return updateInstallPromise
    updateInstallPromise = (async () => {
      if (disposed) return
      if (!updateState.canInstall || typeof updateState.latestVersion !== 'string') {
        setUpdateState({ phase: 'error', error: 'No installable update is available.' })
        return
      }
      const manager = ctx.get('pluginManager')
      if (!manager || typeof manager.updateBundle !== 'function') {
        setUpdateState({ phase: 'error', error: 'Plugin Manager is unavailable.' })
        return
      }
      const version = updateState.latestVersion
      const channel = UPDATE_CHANNELS.find(item => item.id === updateState.channel)
      setUpdateState({ phase: 'installing', error: null })
      let outcome
      try {
        outcome = await manager.updateBundle(PACKAGE_NAME, version, channel?.registry
          ? { registry: channel.registry }
          : {})
      } catch (error) {
        setUpdateState({
          phase: 'error',
          available: false,
          canInstall: false,
          error: error instanceof Error ? error.message : String(error),
        })
        return
      }
      const result = outcome?.result
      const application = result?.application
      if (application === 'failed' || application === 'cancelled') {
        const detail = result?.error?.diagnostic ?? result?.error?.code ?? 'the installer refused the update'
        setUpdateState({
          phase: 'error',
          available: false,
          canInstall: false,
          error: typeof detail === 'string' ? detail : JSON.stringify(detail),
        })
        return
      }
      setUpdateState({
        phase: application === 'restart-required' ? 'restart-required' : 'installed',
        installedVersion: version,
        available: false,
        canInstall: false,
        error: null,
      })
    })().finally(() => {
      updateInstallPromise = null
    })
    return updateInstallPromise
  }

  const checkForUpdate = async ({ autoInstall = false } = {}) => {
    if (updateCheckPromise !== null) return updateCheckPromise
    updateCheckPromise = (async () => {
      if (disposed) return
      setUpdateState({
        phase: 'checking',
        error: null,
        lastCheck: new Date().toISOString(),
        available: false,
        canInstall: false,
      })
      const attempts = []
      let found = null
      for (const channel of UPDATE_CHANNELS) {
        if (disposed) return
        try {
          const payload = await fetchJson(channel.url, lifetime.signal)
          const version = typeof payload?.version === 'string'
            ? payload.version
            : payload?.['dist-tags']?.latest
          if (typeof version !== 'string' || version.length === 0) throw new Error('the response did not name a version')
          found = { channel, version }
          break
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          attempts.push(`${channel.id}: ${message}`)
        }
      }
      if (found === null) {
        setUpdateState({
          phase: 'error',
          latestVersion: null,
          channel: null,
          available: false,
          canInstall: false,
          error: `All update channels failed (${attempts.join('; ')})`,
        })
        return
      }
      const newer = compareVersions(found.version, CURRENT_VERSION) > 0
      if (!newer) {
        setUpdateState({
          phase: 'idle',
          latestVersion: null,
          channel: found.channel.id,
          available: false,
          canInstall: false,
          error: null,
          lastCheck: new Date().toISOString(),
        })
        return
      }
      const support = await updateTargetSupport()
      setUpdateState({
        phase: support.canInstall ? 'available' : 'blocked',
        latestVersion: found.version,
        channel: found.channel.id,
        available: support.canInstall,
        canInstall: support.canInstall,
        error: support.canInstall ? null : support.reason,
        lastCheck: new Date().toISOString(),
      })
      if (support.canInstall && autoInstall) await installUpdate()
    })().catch(error => {
      if (disposed) return
      setUpdateState({
        phase: 'error',
        available: false,
        canInstall: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }).finally(() => {
      updateCheckPromise = null
    })
    return updateCheckPromise
  }

  const load = async () => {
    await mkdir(dataDirectory, { recursive: true }).catch(error => {
      logWarning('failed to create settings directory', error)
    })
    try {
      const raw = JSON.parse(await readFile(settingsFile, 'utf8'))
      settings = readSettings(raw)
    } catch (error) {
      if (error?.code !== 'ENOENT') logWarning('failed to read settings; using defaults', error)
      settings = structuredClone(DEFAULT_SETTINGS)
    }
    syncState = {
      ...syncState,
      lastSuccess: typeof settings.cachedAuto?.fetchedAt === 'string' ? settings.cachedAuto.fetchedAt : null,
    }
    if (settings.cachedAuto !== null && settings.cachedAuto !== undefined) {
      syncState.sourceUrl = settings.cachedAuto.source ?? DEFAULT_OFFICIAL_SOURCE
      syncState.language = settings.cachedAuto.language ?? null
    }
    holidaySyncState = {
      ...holidaySyncState,
      lastSuccess: typeof settings.holidayFetchedAt === 'string' ? settings.holidayFetchedAt : null,
      notices: Array.isArray(settings.holidayNotices) ? settings.holidayNotices : [],
    }
  }

  const runPython = async (executable, scriptPath) => {
    const result = await execFileAsync(executable, [scriptPath], {
      timeout: SYNC_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      signal: lifetime.signal,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    return result.stdout.trim()
  }

  const runScript = async scriptPath => {
    const interpreters = [process.env.DSH_LIANGTIME_PYTHON, 'python3', 'python']
      .filter((value, index, list) => typeof value === 'string' && value.length > 0 && list.indexOf(value) === index)
    let raw
    let lastError
    for (const executable of interpreters) {
      try {
        raw = await runPython(executable, scriptPath)
        break
      } catch (error) {
        lastError = error
        if (error?.code !== 'ENOENT' && error?.code !== 'EACCES') break
      }
    }
    if (raw === undefined) {
      throw new Error(lastError?.code === 'ENOENT'
        ? 'python3 was not found on PATH'
        : lastError?.message ?? 'the sync command failed')
    }
    try {
      return JSON.parse(raw)
    } catch {
      throw new Error('the sync script returned invalid JSON')
    }
  }

  const syncOfficial = async () => {
    if (syncPromise !== null) return syncPromise
    syncPromise = (async () => {
      syncState = {
        ...syncState,
        phase: 'syncing',
        error: null,
        lastAttempt: new Date().toISOString(),
      }
      revision += 1
      const parsed = await runScript(PRICING_SCRIPT_PATH)
      if (parsed?.ok !== true) {
        throw new Error(typeof parsed?.error === 'string' ? parsed.error : 'the pricing page did not match the expected expression')
      }
      const official = officialFromSync(parsed)
      if (official === null) throw new Error('the pricing page returned an unusable schedule')
      if (disposed) return
      const previousCached = settings.cachedAuto
      settings = { ...settings, cachedAuto: official }
      try {
        await persist()
      } catch (error) {
        settings = { ...settings, cachedAuto: previousCached }
        throw error
      }
      if (disposed) return
      syncState = {
        phase: 'ok',
        error: null,
        lastSuccess: official.fetchedAt,
        lastAttempt: new Date().toISOString(),
        sourceUrl: official.source,
        language: official.language,
      }
      revision += 1
    })().catch(error => {
      if (disposed || lifetime.signal.aborted) return
      syncState = {
        ...syncState,
        phase: 'error',
        error: error instanceof Error ? error.message : String(error),
        lastAttempt: new Date().toISOString(),
      }
      revision += 1
    }).finally(() => {
      syncPromise = null
    })
    return syncPromise
  }

  const syncHolidays = async () => {
    if (holidaySyncPromise !== null) return holidaySyncPromise
    holidaySyncPromise = (async () => {
      holidaySyncState = {
        ...holidaySyncState,
        phase: 'syncing',
        error: null,
        lastAttempt: new Date().toISOString(),
      }
      revision += 1
      const parsed = await runScript(HOLIDAY_SCRIPT_PATH)
      if (parsed?.ok !== true) {
        const detail = Array.isArray(parsed?.errors) && parsed.errors.length > 0
          ? parsed.errors.join('; ')
          : typeof parsed?.error === 'string' ? parsed.error : 'the holiday notice did not match the expected expression'
        throw new Error(detail)
      }
      const holidays = normalizeHolidayList(parsed.holidays)
      if (holidays === undefined || holidays.length === 0) {
        throw new Error('the holiday notice returned no usable dates')
      }
      const notices = Array.isArray(parsed.notices)
        ? parsed.notices
            .filter(notice => notice !== null && typeof notice === 'object' && Number.isInteger(notice.year))
            .map(notice => ({
              year: notice.year,
              title: typeof notice.title === 'string' ? notice.title : '',
              url: typeof notice.url === 'string' ? notice.url : '',
              holidayCount: Number.isInteger(notice.holidayCount) ? notice.holidayCount : 0,
            }))
        : []
      if (disposed) return
      const previous = {
        cachedHolidays: settings.cachedHolidays,
        holidayFetchedAt: settings.holidayFetchedAt,
        holidayNotices: settings.holidayNotices,
      }
      settings = {
        ...settings,
        cachedHolidays: holidays,
        holidayFetchedAt: typeof parsed.fetchedAt === 'string' ? parsed.fetchedAt : new Date().toISOString(),
        holidayNotices: notices,
      }
      try {
        await persist()
      } catch (error) {
        settings = { ...settings, ...previous }
        throw error
      }
      if (disposed) return
      holidaySyncState = {
        phase: 'ok',
        error: null,
        lastSuccess: settings.holidayFetchedAt,
        lastAttempt: new Date().toISOString(),
        sourceUrl: DEFAULT_HOLIDAY_SOURCE,
        notices,
      }
      revision += 1
    })().catch(error => {
      if (disposed || lifetime.signal.aborted) return
      holidaySyncState = {
        ...holidaySyncState,
        phase: 'error',
        error: error instanceof Error ? error.message : String(error),
        lastAttempt: new Date().toISOString(),
      }
      revision += 1
    }).finally(() => {
      holidaySyncPromise = null
    })
    return holidaySyncPromise
  }

  const syncAll = async () => {
    await Promise.all([syncOfficial(), syncHolidays()])
  }

  const ready = load().catch(error => {
    logWarning('initialization failed', error)
  })

  ctx.effect(() => {
    void ready.then(() => {
      if (disposed) return
      const mode = settings.updateMode ?? 'notify'
      if (mode !== 'manual') {
        void checkForUpdate({ autoInstall: mode === 'silent' })
      }
      if (!disposed) void syncAll()
    })
    return async () => {
      disposed = true
      lifetime.abort()
      await Promise.all([
        syncPromise === null ? undefined : syncPromise.catch(() => {}),
        holidaySyncPromise === null ? undefined : holidaySyncPromise.catch(() => {}),
      ])
      await writeChain.catch(() => {})
    }
  }, 'dsh-liangtime: lifetime')

  ctx.inject(['connection'], (scope) => {
    scope.effect(() => scope.connection.fetch.register({
      path: STATE_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async () => {
        await ready
        return noStoreJson(snapshot())
      },
    }), 'dsh-liangtime: state route')

    scope.effect(() => scope.connection.fetch.register({
      path: SETTINGS_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async request => {
        await ready
        const body = await readJson(request)
        if (!body.ok) return body.response
        const result = applySettingsPatch(body.value, settings)
        if (!result.ok) return failure(result.error, 400)
        const previous = settings
        settings = result.settings
        revision += 1
        try {
          await persist()
        } catch (error) {
          settings = previous
          // Keep the revision monotonic: a GET that observed the candidate
          // during the write must be superseded by this rollback snapshot.
          revision += 1
          return failure(error instanceof Error ? error.message : 'could not save settings', 500)
        }
        return noStoreJson(snapshot())
      },
    }), 'dsh-liangtime: settings route')

    scope.effect(() => scope.connection.fetch.register({
      path: SYNC_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async () => {
        await ready
        await syncAll()
        return noStoreJson(snapshot())
      },
    }), 'dsh-liangtime: sync route')

    scope.effect(() => scope.connection.fetch.register({
      path: UPDATE_CHECK_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async () => {
        await ready
        await checkForUpdate({ autoInstall: false })
        return noStoreJson(snapshot())
      },
    }), 'dsh-liangtime: update check route')

    scope.effect(() => scope.connection.fetch.register({
      path: UPDATE_INSTALL_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async () => {
        await ready
        await installUpdate()
        return noStoreJson(snapshot())
      },
    }), 'dsh-liangtime: update install route')
  })
}
