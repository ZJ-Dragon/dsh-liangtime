/** DeepSeek peak-window math. All official times are interpreted in Asia/Shanghai. */

import { DEFAULT_SCHEDULE, normalizeSchedule } from './settings.js'

export const OFFICIAL_TIMEZONE = 'Asia/Shanghai'
export const DEFAULT_OFFICIAL_SOURCE = 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing'

const WEEKDAY_INDEX = Object.freeze({
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
})

const BEIJING_CLOCK = new Intl.DateTimeFormat('en-US', {
  timeZone: OFFICIAL_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * Read the wall clock in the timezone the official schedule uses.
 * @param {Date} [date] - instant to inspect.
 * @returns {{date: string, weekday: number, minutes: number, timeLabel: string}}
 */
export function beijingClock(date = new Date()) {
  const parts = Object.fromEntries(BEIJING_CLOCK.formatToParts(date).map(part => [part.type, part.value]))
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
    minutes: hour * 60 + minute,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  }
}

/**
 * Convert one scraper result into a stored official schedule.
 * @param {unknown} parsed - JSON emitted by scripts/fetch_pricing.py.
 * @returns {object | null} the schedule, or null when the payload is unusable.
 */
export function officialFromSync(parsed) {
  if (parsed === null || typeof parsed !== 'object' || parsed.ok !== true) return null
  const normalized = normalizeSchedule(parsed)
  if (normalized === undefined) return null
  return {
    ...normalized,
    source: typeof parsed.source === 'string' ? parsed.source : DEFAULT_OFFICIAL_SOURCE,
    fetchedAt: typeof parsed.fetchedAt === 'string' ? parsed.fetchedAt : new Date().toISOString(),
    language: typeof parsed.language === 'string' ? parsed.language : '',
    timezone: OFFICIAL_TIMEZONE,
  }
}

/**
 * The schedule the badge currently follows.
 * @param {object} settings - persisted plugin settings.
 * @returns {{days: number[], intervals: {start: number, end: number}[], source: 'manual'|'official'|'fallback', fetchedAt: string|null}}
 */
export function effectiveSchedule(settings) {
  if (settings.scheduleSource === 'manual') {
    const manual = normalizeSchedule(settings.manualSchedule) ?? DEFAULT_SCHEDULE
    return { ...manual, source: 'manual', fetchedAt: null }
  }
  if (settings.cachedAuto !== null && settings.cachedAuto !== undefined) {
    const official = normalizeSchedule(settings.cachedAuto)
    if (official !== undefined) {
      return {
        ...official,
        source: 'official',
        fetchedAt: typeof settings.cachedAuto.fetchedAt === 'string' ? settings.cachedAuto.fetchedAt : null,
      }
    }
  }
  return { ...DEFAULT_SCHEDULE, source: 'fallback', fetchedAt: null }
}

/**
 * Decide whether a clock reading falls in the peak window.
 * @param {object} settings - persisted plugin settings.
 * @param {{days: number[], intervals: {start: number, end: number}[]}} schedule - effective schedule.
 * @param {{date: string, weekday: number, minutes: number}} clock - Beijing wall clock.
 * @returns {boolean}
 */
export function isPeakAt(settings, schedule, clock) {
  const override = settings.todayOverride
  if (override !== null && override !== undefined && override.date === clock.date) {
    return override.mode === 'peak'
  }
  if (!schedule.days.includes(clock.weekday)) return false
  return schedule.intervals.some(interval => clock.minutes >= interval.start && clock.minutes < interval.end)
}

/**
 * Build the JSON the browser renders.
 * @param {object} settings - persisted plugin settings.
 * @param {object} sync - current sync status.
 * @param {number} revision - monotonic snapshot revision.
 * @param {Date} [now] - instant to evaluate; defaults to now.
 * @returns {object}
 */
export function buildSnapshot(settings, sync, revision, now = new Date()) {
  const schedule = effectiveSchedule(settings)
  const clock = beijingClock(now)
  return {
    revision,
    timezone: OFFICIAL_TIMEZONE,
    config: {
      position: settings.position,
      highText: settings.highText,
      lowText: settings.lowText,
      highColor: settings.highColor,
      lowColor: settings.lowColor,
      highAutoTheme: settings.highAutoTheme,
      lowAutoTheme: settings.lowAutoTheme,
      scheduleSource: settings.scheduleSource,
      manualSchedule: settings.manualSchedule,
      todayOverride: settings.todayOverride,
    },
    schedule,
    official: settings.cachedAuto === null || settings.cachedAuto === undefined
      ? null
      : {
          days: settings.cachedAuto.days,
          intervals: settings.cachedAuto.intervals,
          source: settings.cachedAuto.source ?? DEFAULT_OFFICIAL_SOURCE,
          fetchedAt: settings.cachedAuto.fetchedAt ?? null,
          language: settings.cachedAuto.language ?? '',
        },
    now: {
      peak: isPeakAt(settings, schedule, clock),
      date: clock.date,
      weekday: clock.weekday,
      minutes: clock.minutes,
      timeLabel: clock.timeLabel,
    },
    sync,
    serverTime: now.toISOString(),
  }
}
