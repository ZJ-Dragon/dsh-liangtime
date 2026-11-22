/** Settings defaults and server-side validation for dsh-liangTime. */

export const DEFAULT_SCHEDULE = Object.freeze({
  days: Object.freeze([1, 2, 3, 4, 5]),
  intervals: Object.freeze([
    Object.freeze({ start: 9 * 60, end: 12 * 60 }),
    Object.freeze({ start: 14 * 60, end: 18 * 60 }),
  ]),
})

export const DEFAULT_SETTINGS = Object.freeze({
  version: 1,
  position: 'sidebar',
  highText: '梁文峰时间',
  lowText: '梁文谷时间',
  highColor: '#16a34a',
  lowColor: '#dc2626',
  highAutoTheme: true,
  lowAutoTheme: true,
  scheduleSource: 'auto',
  manualSchedule: DEFAULT_SCHEDULE,
  todayOverride: null,
  cachedAuto: null,
})

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_TEXT_LENGTH = 40
const MAX_INTERVALS = 8

export function normalizeHex(value) {
  if (typeof value !== 'string') return undefined
  const match = HEX.exec(value.trim())
  if (match === null) return undefined
  const digits = match[1].length === 3
    ? match[1].split('').map(part => part + part).join('')
    : match[1]
  return `#${digits.toLowerCase()}`
}

function normalizeText(value) {
  if (typeof value !== 'string') return undefined
  // Control characters cannot render inside a one-line badge; strip them.
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return text.length <= MAX_TEXT_LENGTH ? text : undefined
}

function normalizeDay(value) {
  return Number.isInteger(value) && value >= 0 && value <= 6 ? value : undefined
}

export function normalizeSchedule(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return undefined
  const rawDays = input.days
  const rawIntervals = input.intervals
  if (!Array.isArray(rawDays) || !Array.isArray(rawIntervals)) return undefined
  if (rawDays.length > 7 || rawIntervals.length > MAX_INTERVALS) return undefined
  const days = []
  for (const raw of rawDays) {
    const day = normalizeDay(raw)
    if (day === undefined) return undefined
    if (!days.includes(day)) days.push(day)
  }
  const intervals = []
  for (const raw of rawIntervals) {
    if (raw === null || typeof raw !== 'object') return undefined
    const start = raw.start
    const end = raw.end
    if (!Number.isInteger(start) || !Number.isInteger(end)) return undefined
    if (start < 0 || end > 24 * 60 || start >= end) return undefined
    intervals.push({ start, end })
  }
  intervals.sort((left, right) => left.start - right.start)
  for (let index = 1; index < intervals.length; index += 1) {
    if (intervals[index].start < intervals[index - 1].end) return undefined
  }
  return { days: days.sort((left, right) => left - right), intervals }
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

function normalizeOverride(input) {
  if (input === null || input === undefined) return null
  if (typeof input !== 'object' || Array.isArray(input)) return undefined
  if (!isCalendarDate(input.date)) return undefined
  if (input.mode !== 'peak' && input.mode !== 'low') return undefined
  return { date: input.date, mode: input.mode }
}

/**
 * Merge a client patch into the stored settings.
 * @param {unknown} patch - client fields to apply.
 * @param {typeof DEFAULT_SETTINGS} current - current stored settings.
 * @returns {{ok: true, settings: object} | {ok: false, error: string}}
 */
export function applySettingsPatch(patch, current) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return { ok: false, error: 'settings must be a JSON object' }
  }
  const next = {
    ...DEFAULT_SETTINGS,
    ...current,
    manualSchedule: current.manualSchedule ?? DEFAULT_SETTINGS.manualSchedule,
    cachedAuto: current.cachedAuto ?? null,
  }

  if ('position' in patch) {
    if (patch.position !== 'sidebar' && patch.position !== 'titlebar') {
      return { ok: false, error: 'position must be "sidebar" or "titlebar"' }
    }
    next.position = patch.position
  }
  if ('highText' in patch) {
    const value = normalizeText(patch.highText)
    if (value === undefined) return { ok: false, error: `highText must be a string of at most ${MAX_TEXT_LENGTH} characters` }
    next.highText = value
  }
  if ('lowText' in patch) {
    const value = normalizeText(patch.lowText)
    if (value === undefined) return { ok: false, error: `lowText must be a string of at most ${MAX_TEXT_LENGTH} characters` }
    next.lowText = value
  }
  if ('highColor' in patch) {
    const value = normalizeHex(patch.highColor)
    if (value === undefined) return { ok: false, error: 'highColor must be a 3- or 6-digit hex color' }
    next.highColor = value
  }
  if ('lowColor' in patch) {
    const value = normalizeHex(patch.lowColor)
    if (value === undefined) return { ok: false, error: 'lowColor must be a 3- or 6-digit hex color' }
    next.lowColor = value
  }
  if ('highAutoTheme' in patch) {
    if (typeof patch.highAutoTheme !== 'boolean') return { ok: false, error: 'highAutoTheme must be a boolean' }
    next.highAutoTheme = patch.highAutoTheme
  }
  if ('lowAutoTheme' in patch) {
    if (typeof patch.lowAutoTheme !== 'boolean') return { ok: false, error: 'lowAutoTheme must be a boolean' }
    next.lowAutoTheme = patch.lowAutoTheme
  }
  if ('scheduleSource' in patch) {
    if (patch.scheduleSource !== 'auto' && patch.scheduleSource !== 'manual') {
      return { ok: false, error: 'scheduleSource must be "auto" or "manual"' }
    }
    next.scheduleSource = patch.scheduleSource
  }
  if ('manualSchedule' in patch) {
    const value = normalizeSchedule(patch.manualSchedule)
    if (value === undefined) return { ok: false, error: 'manualSchedule has invalid days or intervals' }
    next.manualSchedule = value
  }
  if ('todayOverride' in patch) {
    const value = normalizeOverride(patch.todayOverride)
    if (value === undefined) return { ok: false, error: 'todayOverride must be null or a dated peak/low choice' }
    next.todayOverride = value
  }
  next.version = 1
  return { ok: true, settings: next }
}

/**
 * Read persisted settings, tolerating truncated or older files.
 * @param {unknown} raw - parsed JSON from the settings file.
 * @returns {typeof DEFAULT_SETTINGS} a complete, valid settings object.
 */
export function readSettings(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return structuredClone(DEFAULT_SETTINGS)
  let settings = structuredClone(DEFAULT_SETTINGS)
  // Salvage valid fields one by one: one bad hand-edit must not discard the
  // rest of the user's preferences or the last synced official schedule.
  const fields = [
    'position', 'highText', 'lowText', 'highColor', 'lowColor',
    'highAutoTheme', 'lowAutoTheme', 'scheduleSource', 'manualSchedule', 'todayOverride',
  ]
  for (const field of fields) {
    if (!(field in raw)) continue
    const candidate = applySettingsPatch({ [field]: raw[field] }, settings)
    if (candidate.ok) settings = candidate.settings
  }
  const cachedAuto = raw.cachedAuto
  if (cachedAuto !== null && typeof cachedAuto === 'object') {
    const schedule = normalizeSchedule(cachedAuto)
    if (schedule !== undefined) {
      settings.cachedAuto = {
        ...schedule,
        source: typeof cachedAuto.source === 'string' ? cachedAuto.source : '',
        fetchedAt: typeof cachedAuto.fetchedAt === 'string' ? cachedAuto.fetchedAt : '',
        language: typeof cachedAuto.language === 'string' ? cachedAuto.language : '',
      }
    }
  }
  return settings
}
