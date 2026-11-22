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
 * Resolve the holiday dates the badge follows.
 * @param {object} settings - persisted plugin settings.
 * @returns {{dates: string[], auto: string[], manual: string[], source: 'auto'|'manual'|'none', fetchedAt: string|null}}
 */
export function effectiveHolidays(settings) {
  const auto = Array.isArray(settings.cachedHolidays) ? settings.cachedHolidays : []
  const manual = Array.isArray(settings.manualHolidays) ? settings.manualHolidays : []
  if (settings.holidaySource === 'manual') {
    return { dates: [...manual], auto, manual, source: 'manual', fetchedAt: settings.holidayFetchedAt ?? null }
  }
  const dates = [...new Set([...auto, ...manual])].sort()
  return {
    dates,
    auto,
    manual,
    source: auto.length > 0 ? 'auto' : manual.length > 0 ? 'manual' : 'none',
    fetchedAt: settings.holidayFetchedAt ?? null,
  }
}

/**
 * Decide whether a clock reading falls in the peak window.
 * @param {object} settings - persisted plugin settings.
 * @param {{days: number[], intervals: {start: number, end: number}[]}} schedule - effective schedule.
 * @param {{date: string, weekday: number, minutes: number}} clock - Beijing wall clock.
 * @param {Set<string>} [holidaySet] - effective holiday dates.
 * @returns {boolean}
 */
export function isPeakAt(settings, schedule, clock, holidaySet) {
  const override = settings.todayOverride
  if (override !== null && override !== undefined && override.date === clock.date) {
    return override.mode === 'peak'
  }
  const holidays = holidaySet ?? new Set(effectiveHolidays(settings).dates)
  if (holidays.has(clock.date)) return false
  if (!schedule.days.includes(clock.weekday)) return false
  return schedule.intervals.some(interval => clock.minutes >= interval.start && clock.minutes < interval.end)
}

/**
 * Build the JSON the browser renders.
 * @param {object} settings - persisted plugin settings.
 * @param {object} sync - current pricing sync status.
 * @param {object} holidaySync - current holiday sync status.
 * @param {number} revision - monotonic snapshot revision.
 * @param {Date} [now] - instant to evaluate; defaults to now.
 * @returns {object}
 */
export function buildSnapshot(settings, sync, holidaySync, revision, now = new Date()) {
  const schedule = effectiveSchedule(settings)
  const holidays = effectiveHolidays(settings)
  const holidaySet = new Set(holidays.dates)
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
      holidaySource: settings.holidaySource,
      manualHolidays: settings.manualHolidays,
      highIconSvg: settings.highIconSvg,
      lowIconSvg: settings.lowIconSvg,
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
    holidays: {
      source: holidays.source,
      auto: holidays.auto,
      manual: holidays.manual,
      effective: holidays.dates,
      fetchedAt: holidays.fetchedAt,
      notices: Array.isArray(settings.holidayNotices) ? settings.holidayNotices : [],
    },
    now: {
      peak: isPeakAt(settings, schedule, clock, holidaySet),
      holiday: holidaySet.has(clock.date),
      date: clock.date,
      weekday: clock.weekday,
      minutes: clock.minutes,
      timeLabel: clock.timeLabel,
    },
    sync,
    holidaySync,
    serverTime: now.toISOString(),
  }
}
