/* global window, document, fetch, Intl */
/**
 * dsh-liangTime browser half.
 *
 * Plain lazy-CJS bundle: no build step and no imports beyond React from the
 * host module table. The module registers a badge in two possible seats and a
 * Settings page under `settings.section`.
 */
window.__ModuleLoader__.load({
  id: 'dsh-liangtime',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-liangtime'
    const API_STATE = 'api/liangtime.state'
    const API_SETTINGS = 'api/liangtime.settings'
    const API_SYNC = 'api/liangtime.sync'
    const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
    const PRESET_COLORS = ['#000000', '#ffffff', '#16a34a', '#dc2626', '#eab308', '#2563eb', '#9333ea', '#ea580c']
    const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const MAX_INTERVALS = 8
    const FALLBACK_SCHEDULE = Object.freeze({
      days: [1, 2, 3, 4, 5],
      intervals: [{ start: 9 * 60, end: 12 * 60 }, { start: 14 * 60, end: 18 * 60 }],
      source: 'fallback',
      fetchedAt: null,
    })

    const zh = {
      sectionLabel: '梁时',
      pageTitle: '梁时',
      pageIntro: '提示当前是否处于 DeepSeek API 的高峰计价时段。所有时段均按北京时间计算。',
      currentState: '当前状态',
      peak: '高峰',
      low: '低峰',
      clock: '北京时间 {time}',
      peakLabel: '高峰时段',
      lowLabel: '低峰时段',
      syncOk: '官方数据已同步',
      syncSyncing: '正在同步官方数据…',
      syncIdle: '尚未同步官方数据',
      syncError: '本次启动数据同步失败，请检查或手动同步',
      syncDetail: '详情：{error}',
      lastSuccess: '上次成功：{time}（北京时间）',
      manualSync: '手动同步',
      syncing: '同步中…',
      sourceLink: '数据来源：DeepSeek API 定价页',
      positionTitle: '显示位置',
      positionHint: '切换后保存即可。侧边栏位置在用户名按钮上方；标题栏位置在会话标题栏右侧。',
      positionSidebar: '侧边栏',
      positionSidebarHint: '侧边栏底部账号按钮上方',
      positionTitlebar: '标题栏',
      positionTitlebarHint: '会话标题栏右侧（仅会话中显示）',
      appearanceTitle: '文字与颜色',
      appearanceHint: '高峰（上涨）与低峰（下跌）可分别设置。颜色同时作用于图标和文字。',
      highTextLabel: '高峰文字',
      lowTextLabel: '低峰文字',
      textPlaceholder: '留空则只显示图标',
      highColorLabel: '高峰颜色',
      lowColorLabel: '低峰颜色',
      autoTheme: '跟随应用主题自动切换',
      autoThemeHint: '仅在选择黑色或白色时出现；开启后深色模式自动显示浅色，浅色模式自动显示深色。',
      customColor: '自定义',
      scheduleTitle: '时间仪表盘',
      scheduleHint: '官方时段由插件启动时从 DeepSeek API 定价页同步；手动设置优先。',
      sourceAuto: '跟随官方',
      sourceManual: '手动设置',
      officialSynced: '官方时段已同步',
      officialCached: '本次同步失败，仍在使用上次成功同步的官方时段。',
      officialMissing: '还没有官方同步数据，当前使用内置默认时段。',
      officialFallback: '当前使用内置默认时段；手动同步成功后自动替换。',
      scheduleLine: '{days} · {ranges}',
      noActiveDays: '未选择生效日期',
      useOfficial: '使用官方时段',
      editManual: '改为手动设置',
      daysLabel: '生效日期',
      daySun: '日',
      dayMon: '一',
      dayTue: '二',
      dayWed: '三',
      dayThu: '四',
      dayFri: '五',
      daySat: '六',
      intervalsLabel: '高峰时段',
      intervalEmpty: '没有高峰时段：全天按低峰显示。',
      addInterval: '添加时段',
      removeInterval: '删除',
      startTime: '开始',
      endTime: '结束',
      invalidInterval: '时段无效：结束时间必须晚于开始时间，且时段不能重叠。',
      todayTitle: '今日覆盖',
      todayHint: '临时把今天强制为高峰或低峰，次日自动恢复。适合法定节假日或临时调整。',
      todayAuto: '自动判断',
      todayPeak: '今日高峰',
      todayLow: '今日低峰',
      todayActive: '保存后，今天将覆盖为{state}',
      todayDate: '今天 {date}',
      save: '保存设置',
      saving: '保存中…',
      saved: '已保存',
      dirty: '有未保存的更改',
      saveFailed: '保存失败：{message}',
      loadFailed: '无法读取插件状态。',
      retry: '重试',
      loading: '正在加载…',
      ariaPeak: '当前为 DeepSeek 高峰时段：{text}',
      ariaLow: '当前为 DeepSeek 低峰时段：{text}',
      noText: '不显示文字',
      badgeFallback: '内置默认时段',
      countdown: '距离{state}还有{hours}小时{minutes}分',
      noUpcoming: '暂无下一次切换',
      holidaysTitle: '法定节假日',
      holidaysHint: '官方节假日自动同步自中国政府网；非中国用户可切换到手动日历。',
      holidaySourceAuto: '自动同步',
      holidaySourceManual: '手动日历',
      holidaySyncOk: '官方节假日已同步',
      holidaySyncSyncing: '正在同步法定节假日…',
      holidaySyncIdle: '尚未同步法定节假日',
      holidaySyncError: '本次启动法定节假日同步失败，请检查或手动标记',
      holidaySyncedSummary: '已同步 {count} 天（{years}）',
      holidayNoData: '暂无官方节假日数据',
      holidayAutoLegend: '官方节假日',
      holidayManualLegend: '手动标记',
      holidayManualCount: '手动标记 {count} 天',
      holidayManualHint: '点击日期添加或移除手动节假日；自动模式下手动日期作为补充。',
      holidayManualOnlyHint: '手动模式只使用下方标记的日期，不读取官方同步结果。',
      holidayManualClear: '清空手动标记',
      holidayThisMonth: '本月',
      holidayPrevMonth: '上个月',
      holidayNextMonth: '下个月',
      holidayToday: '今天',
      holidayBadge: '法定节假日',
      holidaySourceLink: '数据来源：中国政府网节假日安排',
      sidebarLayoutTitle: '侧边栏布局',
      sidebarLayoutHint: '以下选项只影响侧边栏位置的徽标，不影响标题栏。',
      widthSyncLabel: '每 30 分钟同步侧边栏宽度',
      widthSyncHint: '插件启动后立即读取一次，此后每 30 分钟重新测量，用来调整文字显示宽度。',
      adaptiveWrapLabel: '自适应换行',
      adaptiveWrapHint: '若换行后末行只剩 1–2 个字符，则在前一行提前 2 个字符换行；若时间处被截断，则提前到「还有」后换行，让时间独立一行。',
      iconsTitle: '自定义图标',
      iconsHint: '可选：为高峰、低峰分别导入 SVG。自定义图标按文件自身颜色渲染；徽标文字仍使用设置颜色。',
      highIcon: '高峰图标',
      lowIcon: '低峰图标',
      importSvg: '导入 SVG',
      replaceSvg: '更换 SVG',
      removeIcon: '移除图标',
      svgSpecTitle: '导入 SVG 前请确认规范',
      svgSpecIntro: '确认后才会打开系统文件选择器。',
      svgSpecSize: '仅支持 .svg 文件，UTF-8 编码，单文件不超过 128 KB。',
      svgSpecViewBox: '根节点必须包含 viewBox，推荐 0 0 16 16 或 0 0 24 24。',
      svgSpecShapes: '仅使用 path、circle、rect、line、polyline、polygon、ellipse、g、defs、gradient 等静态图形元素。',
      svgSpecForbidden: '禁止 script、事件属性、foreignObject、image、use、a、style、外部 href 和 javascript: 引用。',
      svgSpecColor: '自定义 SVG 会保留文件自身颜色；内置图标的颜色设置不生效，文字颜色仍有效。',
      cancel: '取消',
      continueImport: '继续导入',
      svgEmpty: '文件为空',
      svgTooLarge: '文件超过 128 KB',
      svgStructure: '不是有效的 SVG 文档',
      svgViewBox: '缺少 viewBox',
      svgForbidden: '包含不允许的标签、属性或外部引用',
      svgUploadFailed: '导入失败：{reason}',
      weekPrefix: '周',
      manualScheduleNote: '手动设置会在保存后替换官方时段。',
      officialCurrent: '官方时段：{days} {ranges}',
      footerHint: '保存后立即更新徽标；离开设置页时会自动保存未提交的更改。',
    }

    const en = {
      sectionLabel: 'LiangTime',
      pageTitle: 'LiangTime',
      pageIntro: 'Shows whether DeepSeek API pricing is currently in its peak window. All times use Beijing time (UTC+8).',
      currentState: 'Current state',
      peak: 'Peak',
      low: 'Off-peak',
      clock: 'Beijing time {time}',
      peakLabel: 'Peak window',
      lowLabel: 'Off-peak window',
      syncOk: 'Official data is synced',
      syncSyncing: 'Syncing official data…',
      syncIdle: 'Official data has not synced yet',
      syncError: 'This startup’s data sync failed. Check the connection or sync manually.',
      syncDetail: 'Details: {error}',
      lastSuccess: 'Last success: {time} (Beijing time)',
      manualSync: 'Sync now',
      syncing: 'Syncing…',
      sourceLink: 'Source: DeepSeek API pricing page',
      positionTitle: 'Position',
      positionHint: 'Save to apply. Sidebar sits above the account button; titlebar sits at the right of the session header.',
      positionSidebar: 'Sidebar',
      positionSidebarHint: 'Above the sidebar-foot account button',
      positionTitlebar: 'Titlebar',
      positionTitlebarHint: 'Right side of the session header (sessions only)',
      appearanceTitle: 'Text and color',
      appearanceHint: 'Configure the rising peak state and the falling off-peak state separately. The color applies to both icon and text.',
      highTextLabel: 'Peak text',
      lowTextLabel: 'Off-peak text',
      textPlaceholder: 'Leave empty for icon only',
      highColorLabel: 'Peak color',
      lowColorLabel: 'Off-peak color',
      autoTheme: 'Follow the app theme automatically',
      autoThemeHint: 'Available for black or white; dark mode shows a light color and light mode shows a dark color.',
      customColor: 'Custom',
      scheduleTitle: 'Time dashboard',
      scheduleHint: 'Official windows sync from the DeepSeek API pricing page at startup. Manual settings take precedence.',
      sourceAuto: 'Follow official',
      sourceManual: 'Manual',
      officialSynced: 'Official windows are synced',
      officialCached: 'This sync failed; the last successfully synced official windows are still in use.',
      officialMissing: 'No official data yet; the built-in default is in use.',
      officialFallback: 'The built-in default is in use; it will be replaced after a successful sync.',
      scheduleLine: '{days} · {ranges}',
      noActiveDays: 'No active days',
      useOfficial: 'Use official windows',
      editManual: 'Edit manually',
      daysLabel: 'Active days',
      daySun: 'Sun',
      dayMon: 'Mon',
      dayTue: 'Tue',
      dayWed: 'Wed',
      dayThu: 'Thu',
      dayFri: 'Fri',
      daySat: 'Sat',
      intervalsLabel: 'Peak windows',
      intervalEmpty: 'No peak windows: the whole day is off-peak.',
      addInterval: 'Add window',
      removeInterval: 'Remove',
      startTime: 'Start',
      endTime: 'End',
      invalidInterval: 'Invalid window: the end must be later than the start, and windows cannot overlap.',
      todayTitle: 'Today override',
      todayHint: 'Force today to be peak or off-peak; it resets tomorrow. Useful for public holidays or temporary changes.',
      todayAuto: 'Automatic',
      todayPeak: 'Peak today',
      todayLow: 'Off-peak today',
      todayActive: 'After saving, today will be {state}',
      todayDate: 'Today {date}',
      save: 'Save settings',
      saving: 'Saving…',
      saved: 'Saved',
      dirty: 'Unsaved changes',
      saveFailed: 'Save failed: {message}',
      loadFailed: 'Could not read the plugin state.',
      retry: 'Retry',
      loading: 'Loading…',
      ariaPeak: 'DeepSeek peak pricing now: {text}',
      ariaLow: 'DeepSeek off-peak pricing now: {text}',
      noText: 'No text',
      badgeFallback: 'built-in fallback',
      countdown: '{hours}h {minutes}m until {state}',
      noUpcoming: 'No upcoming change',
      holidaysTitle: 'Public holidays',
      holidaysHint: 'Chinese public holidays sync from gov.cn automatically. Non-China users can switch to the manual calendar.',
      holidaySourceAuto: 'Auto sync',
      holidaySourceManual: 'Manual calendar',
      holidaySyncOk: 'Official holidays are synced',
      holidaySyncSyncing: 'Syncing official holidays…',
      holidaySyncIdle: 'Official holidays have not synced yet',
      holidaySyncError: 'This startup’s holiday sync failed. Check the connection or mark days manually.',
      holidaySyncedSummary: '{count} days synced ({years})',
      holidayNoData: 'No official holiday data yet',
      holidayAutoLegend: 'Official holiday',
      holidayManualLegend: 'Manual mark',
      holidayManualCount: '{count} manual days',
      holidayManualHint: 'Click a date to add or remove a manual holiday. In auto mode manual dates are additive.',
      holidayManualOnlyHint: 'Manual mode uses only the dates marked below and ignores the official sync.',
      holidayManualClear: 'Clear manual marks',
      holidayThisMonth: 'This month',
      holidayPrevMonth: 'Previous month',
      holidayNextMonth: 'Next month',
      holidayToday: 'Today',
      holidayBadge: 'Public holiday',
      holidaySourceLink: 'Source: gov.cn holiday notices',
      sidebarLayoutTitle: 'Sidebar layout',
      sidebarLayoutHint: 'These options affect the sidebar badge only, not the titlebar.',
      widthSyncLabel: 'Sync sidebar width every 30 minutes',
      widthSyncHint: 'Measures once at startup, then every 30 minutes, and uses the width to adjust the text area.',
      adaptiveWrapLabel: 'Adaptive wrapping',
      adaptiveWrapHint: 'Break 2 characters earlier when the last line would have only 1–2 characters; if the duration would be split, start it on its own line after “还有”.',
      iconsTitle: 'Custom icons',
      iconsHint: 'Optional: import separate SVGs for peak and off-peak. Custom icons keep their own colors; badge text still follows the color setting.',
      highIcon: 'Peak icon',
      lowIcon: 'Off-peak icon',
      importSvg: 'Import SVG',
      replaceSvg: 'Replace SVG',
      removeIcon: 'Remove icon',
      svgSpecTitle: 'Review the SVG rules before importing',
      svgSpecIntro: 'The system file picker opens only after you continue.',
      svgSpecSize: 'SVG only, UTF-8, no larger than 128 KB per file.',
      svgSpecViewBox: 'The root element must include a viewBox; 0 0 16 16 or 0 0 24 24 is recommended.',
      svgSpecShapes: 'Use static shapes only: path, circle, rect, line, polyline, polygon, ellipse, g, defs, gradient.',
      svgSpecForbidden: 'No script, event attributes, foreignObject, image, use, a, style, external href, or javascript: references.',
      svgSpecColor: 'Custom SVGs keep their own colors. The built-in icon color setting does not apply to them; text color still does.',
      cancel: 'Cancel',
      continueImport: 'Continue',
      svgEmpty: 'the file is empty',
      svgTooLarge: 'the file is larger than 128 KB',
      svgStructure: 'the file is not a valid SVG document',
      svgViewBox: 'the SVG has no viewBox',
      svgForbidden: 'the SVG contains a forbidden tag, attribute, or external reference',
      svgUploadFailed: 'Import failed: {reason}',
      weekPrefix: '',
      manualScheduleNote: 'Manual windows replace the official schedule after saving.',
      officialCurrent: 'Official windows: {days} {ranges}',
      footerHint: 'Saves update the badge immediately; leaving Settings saves pending changes.',
    }

    const CSS = `
.lt-badge{position:relative;display:inline-flex;align-items:center;gap:6px;min-width:0;color:inherit;font:inherit;font-size:12px;font-weight:550;line-height:1;white-space:nowrap;user-select:none}
.lt-badge--sidebar{box-sizing:border-box;width:100%;height:32px;min-height:32px;padding:6px 10px;border-radius:7px;overflow:hidden;transition:height .22s cubic-bezier(.22,1,.36,1)}
.lt-badge--sidebar.lt-badge--rail{width:36px;height:36px;min-height:36px;padding:0;justify-content:center;border-radius:7px}
.lt-badge--titlebar{box-sizing:border-box;flex:none;max-width:240px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:transparent;transition:max-width .22s cubic-bezier(.22,1,.36,1)}
.lt-badge__text{min-width:0;overflow:hidden;text-overflow:ellipsis;transition:width .22s cubic-bezier(.22,1,.36,1)}
.lt-badge--titlebar .lt-badge__text{max-width:none;flex:none}
.lt-badge--titlebar.lt-badge--hovered{max-width:min(1000px,calc(100vw - 120px))}
.lt-badge--wrap{align-items:flex-start;white-space:normal}
.lt-badge--sidebar .lt-badge__text{flex:0 1 auto;min-width:0}
.lt-badge--wrap .lt-badge__text{flex:0 1 auto;white-space:normal;overflow-wrap:anywhere;text-overflow:clip;line-height:1.35;padding-block:1px}
.lt-badge--fixed-lines .lt-badge__text{white-space:nowrap}
.lt-badge--wrap .lt-badge__icon{margin-top:1px}
.lt-badge__sizer{position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;width:max-content;max-width:none;font:inherit;font-size:12px;font-weight:550;line-height:1}
.lt-badge--sidebar.lt-badge--hovered .lt-badge__text{animation:none}
.lt-badge--hovered .lt-badge__text{animation:lt-hover-in .14s ease}
.lt-badge--rail .lt-badge__text{display:none}
@keyframes lt-hover-in{from{opacity:.55}to{opacity:1}}
.lt-badge:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:999px}
.lt-badge__icon{display:block;flex:none}
.lt-page{box-sizing:border-box;width:100%;max-width:760px;margin:0 auto;padding:4px 0 28px;display:flex;flex-direction:column;gap:14px;color:var(--dsw-alias-label-primary)}
.lt-page__header{display:flex;flex-direction:column;gap:6px;padding:2px 2px 4px}
.lt-page__title{margin:0;font-size:18px;font-weight:600;letter-spacing:-.01em}
.lt-page__intro{margin:0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.lt-card{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:16px}
.lt-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.lt-card__title{margin:0;font-size:14px;font-weight:600}
.lt-card__hint{margin:0;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.lt-card__body{display:flex;flex-direction:column;gap:12px}
.lt-status{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.lt-status__main{display:flex;align-items:center;gap:12px;min-width:0}
.lt-status__icon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);flex:none}
.lt-status__custom-icon{display:block;width:20px;height:20px;object-fit:contain}
.lt-status__label{display:flex;flex-direction:column;gap:3px;min-width:0}
.lt-status__text{font-size:18px;font-weight:650;line-height:1.2;overflow-wrap:anywhere}
.lt-status__meta{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.4}
.lt-sync{display:flex;flex-direction:column;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1);font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
.lt-sync__row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.lt-sync__state{display:flex;align-items:center;gap:7px;min-width:0}
.lt-sync__dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:none}
.lt-sync__dot--ok{background:var(--dsw-alias-state-success-primary)}
.lt-sync__dot--error{background:var(--dsw-alias-state-error-primary)}
.lt-sync__dot--syncing{background:var(--dsw-alias-state-warn-primary)}
.lt-sync-error{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.lt-sync-detail{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.45;opacity:.85;overflow-wrap:anywhere}
.lt-link{color:var(--dsw-alias-brand-primary);text-decoration:none;font-size:12px}
.lt-link:hover{text-decoration:underline}
.lt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lt-choice{display:flex;align-items:flex-start;gap:10px;box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);text-align:start;font:inherit;cursor:pointer}
.lt-choice:hover{border-color:var(--dsw-alias-border-l2)}
.lt-choice[aria-pressed=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.lt-choice__mark{position:relative;flex:none;width:14px;height:14px;margin-top:1px;border:1.5px solid var(--dsw-alias-border-l2);border-radius:50%;box-sizing:border-box}
.lt-choice[aria-pressed=true] .lt-choice__mark{border-color:var(--dsw-alias-brand-primary)}
.lt-choice[aria-pressed=true] .lt-choice__mark::after{content:"";position:absolute;inset:2px;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.lt-choice__text{display:flex;flex-direction:column;gap:3px;min-width:0}
.lt-choice__label{font-size:13px;font-weight:550}
.lt-choice__hint{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.lt-seg{display:inline-flex;box-sizing:border-box;padding:3px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);gap:2px}
.lt-seg button{appearance:none;border:0;border-radius:6px;padding:5px 9px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1.3;cursor:pointer;white-space:nowrap}
.lt-seg button:hover{color:var(--dsw-alias-label-primary)}
.lt-seg button[aria-pressed=true]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}
.lt-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-height:30px;padding:6px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:1.3;cursor:pointer;white-space:nowrap}
.lt-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.lt-btn:disabled{cursor:default;opacity:.5}
.lt-btn--primary{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}
.lt-btn--primary:hover{background:var(--dsw-alias-brand-primary);opacity:.92}
.lt-btn--quiet{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.lt-btn--quiet:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.lt-btn--danger{color:var(--dsw-alias-state-error-primary)}
.lt-field{display:flex;flex-direction:column;gap:5px;min-width:0}
.lt-field__label{font-size:12px;font-weight:550;color:var(--dsw-alias-label-primary)}
.lt-input{box-sizing:border-box;width:100%;height:32px;padding:5px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}
.lt-input::placeholder{color:var(--dsw-alias-label-secondary)}
.lt-input:focus-visible,.lt-choice:focus-visible,.lt-btn:focus-visible,.lt-seg button:focus-visible,.lt-swatch:focus-visible,.lt-switch:focus-visible,.lt-day:focus-visible,.lt-color-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.lt-input--time{width:110px;font-variant-numeric:tabular-nums}
.lt-tone{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base)}
.lt-tone__top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.lt-tone__label{font-size:12px;font-weight:600}
.lt-preview{display:inline-flex;align-items:center;min-height:24px;padding:3px 9px;border:1px dashed var(--dsw-alias-border-l1);border-radius:999px;font-size:12px}
.lt-colors{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.lt-swatch{appearance:none;box-sizing:border-box;width:22px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:50%;cursor:pointer;flex:none}
.lt-swatch[aria-pressed=true]{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.lt-color-input{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);font-size:11px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.lt-color-input input{width:16px;height:20px;padding:0;border:0;background:transparent;cursor:pointer}
.lt-color-hex{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;color:var(--dsw-alias-label-secondary);text-transform:lowercase}
.lt-switch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.lt-switch-copy{display:flex;flex-direction:column;gap:3px;min-width:0}
.lt-switch-label{font-size:12px;font-weight:550}
.lt-switch-hint{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.lt-switch{appearance:none;position:relative;box-sizing:border-box;width:36px;height:20px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;flex:none}
.lt-switch::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:transform .15s ease,background .15s ease}
.lt-switch[aria-checked=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary)}
.lt-switch[aria-checked=true]::after{transform:translateX(16px);background:var(--dsw-alias-bg-base)}
.lt-schedule-summary{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.55;overflow-wrap:anywhere}
.lt-timeline{display:flex;flex-direction:column;gap:5px}
.lt-timeline__track{position:relative;height:30px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.lt-timeline__band{position:absolute;top:0;bottom:0;background:var(--dsw-alias-brand-primary);opacity:.34;border-radius:4px}
.lt-timeline__now{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--dsw-alias-label-primary);border-radius:1px}
.lt-timeline__now::before{content:"";position:absolute;top:-2px;left:-3px;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-label-primary)}
.lt-timeline__ticks{display:flex;justify-content:space-between;font-size:10px;line-height:1;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.lt-legend{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.lt-legend__chip{width:10px;height:10px;border-radius:3px;background:var(--dsw-alias-brand-primary);opacity:.34}
.lt-schedule-grid{display:flex;flex-direction:column;gap:10px}
.lt-days{display:flex;gap:5px;flex-wrap:wrap}
.lt-day{appearance:none;box-sizing:border-box;min-width:34px;height:30px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.lt-day[aria-pressed=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.lt-intervals{display:flex;flex-direction:column;gap:8px}
.lt-interval{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;padding:9px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base)}
.lt-interval__sep{height:32px;display:flex;align-items:center;color:var(--dsw-alias-label-secondary);font-size:12px}
.lt-interval__actions{margin-inline-start:auto}
.lt-empty{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);padding:7px 0}
.lt-error-text{font-size:12px;line-height:1.5;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.lt-note{font-size:11px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
.lt-footer{position:sticky;bottom:12px;z-index:3;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;width:min(100%,680px);margin:4px auto 0;padding:10px 12px 10px 16px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-overlay);box-shadow:var(--dsw-elevation-prominent)}
.lt-footer__state{display:flex;flex-direction:column;gap:2px;min-width:0;font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.lt-footer__state--error{color:var(--dsw-alias-state-error-primary)}
.lt-loading{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-secondary);padding:18px 2px}
.lt-loading__dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-brand-primary);animation:lt-pulse 1.1s ease-in-out infinite}
.lt-error-card{display:flex;flex-direction:column;align-items:flex-start;gap:10px;font-size:13px;color:var(--dsw-alias-label-primary)}
@keyframes lt-pulse{0%,100%{opacity:.35}50%{opacity:1}}

.lt-badge__custom-icon{display:block;width:14px;height:14px;flex:none;object-fit:contain}
.lt-preview__icon{display:block;width:14px;height:14px;object-fit:contain}
.lt-icon-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.lt-icon-row:first-child{border-top:0;padding-top:0}
.lt-icon-preview{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex:none;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.lt-icon-preview img{display:block;width:22px;height:22px;object-fit:contain}
.lt-icon-row__meta{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.lt-icon-row__title{font-size:12px;font-weight:550}
.lt-icon-row__hint{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.lt-icon-row__actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.lt-cal{display:flex;flex-direction:column;gap:8px}
.lt-cal__head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.lt-cal__title{font-size:13px;font-weight:600}
.lt-cal__nav{display:flex;align-items:center;gap:4px}
.lt-cal__grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.lt-cal__weekday{text-align:center;font-size:10px;line-height:1.2;color:var(--dsw-alias-label-secondary);padding:2px 0}
.lt-cal__cell{display:flex;align-items:center;justify-content:center}
.lt-cal__day{appearance:none;position:relative;box-sizing:border-box;width:100%;aspect-ratio:1;min-height:30px;padding:0;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
.lt-cal__day:hover{background:var(--dsw-alias-bg-layer-2)}
.lt-cal__day--auto::after{content:"";position:absolute;left:50%;bottom:3px;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.lt-cal__day--manual{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}
.lt-cal__day--manual:hover{background:var(--dsw-alias-brand-primary);opacity:.92}
.lt-cal__day--manual::after{background:var(--dsw-alias-bg-base)}
.lt-cal__day--today{box-shadow:inset 0 0 0 1px var(--dsw-alias-label-primary)}
.lt-cal__legend{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.lt-cal__legend-item{display:flex;align-items:center;gap:5px}
.lt-cal__legend-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.lt-cal__legend-swatch{width:10px;height:10px;border-radius:3px;background:var(--dsw-alias-brand-primary)}
.lt-dialog{box-sizing:border-box;width:min(560px,calc(100vw - 32px));max-height:min(80vh,680px);overflow:auto;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-prominent)}
.lt-dialog::backdrop{background:color-mix(in srgb,var(--dsw-alias-bg-base) 58%,transparent);backdrop-filter:blur(2px)}
.lt-dialog__title{margin:0 0 8px;font-size:16px;font-weight:600}
.lt-dialog__intro{margin:0 0 12px;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.lt-dialog__list{margin:0 0 18px;padding-inline-start:18px;display:flex;flex-direction:column;gap:7px;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.lt-dialog__actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
@media (max-width:560px){.lt-grid{grid-template-columns:1fr}.lt-card{padding:14px}.lt-page{padding-bottom:20px}.lt-interval__actions{margin-inline-start:0}.lt-footer{width:100%;bottom:8px;border-radius:14px;padding:9px 11px 9px 14px}}
@media (prefers-reduced-motion:reduce){.lt-loading__dot{animation:none}.lt-switch::after{transition:none}.lt-badge--titlebar,.lt-badge__text{transition:none}.lt-badge--sidebar{transition:none}.lt-badge--hovered .lt-badge__text{animation:none}}
`

    const WEEKDAY_KEYS = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat']
    const BEIJING_CLOCK = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })

    function beijingClock(date = new Date()) {
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

    function normalizeHex(value) {
      if (typeof value !== 'string') return null
      const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value.trim())
      if (match === null) return null
      const digits = match[1].length === 3
        ? match[1].split('').map(part => part + part).join('')
        : match[1]
      return `#${digits.toLowerCase()}`
    }

    function isBlackWhite(value) {
      const color = normalizeHex(value)
      return color === '#000000' || color === '#ffffff'
    }

    function displayColor(config, peak) {
      const selected = normalizeHex(peak ? config.highColor : config.lowColor) ?? '#000000'
      const auto = peak ? config.highAutoTheme : config.lowAutoTheme
      if (auto && isBlackWhite(selected)) return 'var(--dsw-alias-label-primary)'
      return selected
    }

    function peakAtInstant(snapshot, timestamp) {
      if (!snapshot) return false
      const clock = beijingClock(new Date(timestamp))
      const override = snapshot.config.todayOverride
      if (override && override.date === clock.date) return override.mode === 'peak'
      if (Array.isArray(snapshot.holidays?.effective) && snapshot.holidays.effective.includes(clock.date)) return false
      const schedule = snapshot.schedule
      if (!schedule.days.includes(clock.weekday)) return false
      return schedule.intervals.some(interval => clock.minutes >= interval.start && clock.minutes < interval.end)
    }

    function computePeak(snapshot, date = new Date()) {
      return peakAtInstant(snapshot, date.getTime())
    }

    // Asia/Shanghai has no DST; the offset is fixed at UTC+8.
    function beijingInstant(date, minutes) {
      const [year, month, day] = date.split('-').map(Number)
      return Date.UTC(year, month - 1, day) + (minutes - 8 * 60) * 60000
    }

    function nextStateTransition(snapshot, nowMs) {
      if (!snapshot) return null
      const currentPeak = peakAtInstant(snapshot, nowMs)
      const candidates = []
      const today = beijingClock(new Date(nowMs))
      const override = snapshot.config.todayOverride
      if (override && override.date === today.date) {
        const nextDate = beijingClock(new Date(nowMs + 24 * 60 * 60000)).date
        candidates.push(beijingInstant(nextDate, 0))
      }
      const horizon = nowMs + 22 * 24 * 60 * 60000
      const holidays = Array.isArray(snapshot.holidays?.effective) ? snapshot.holidays.effective : []
      for (const holiday of holidays) {
        const start = beijingInstant(holiday, 0)
        if (start > nowMs && start < horizon) candidates.push(start)
        const end = beijingInstant(beijingClock(new Date(start + 24 * 60 * 60000)).date, 0)
        if (end > nowMs && end < horizon) candidates.push(end)
      }
      // One weekly cycle plus a margin catches the next active weekday.
      for (let offset = 0; offset < 22; offset += 1) {
        const day = beijingClock(new Date(nowMs + offset * 24 * 60 * 60000))
        if (!snapshot.schedule.days.includes(day.weekday)) continue
        for (const interval of snapshot.schedule.intervals) {
          const start = beijingInstant(day.date, interval.start)
          const end = beijingInstant(day.date, interval.end)
          if (start > nowMs) candidates.push(start)
          if (end > nowMs) candidates.push(end)
        }
      }
      const unique = [...new Set(candidates)].sort((left, right) => left - right)
      for (const instant of unique) {
        const nextPeak = peakAtInstant(snapshot, instant)
        if (nextPeak !== currentPeak) return { at: instant, nextPeak }
      }
      return null
    }

    function countdownLabel(snapshot, t, nowMs) {
      const next = nextStateTransition(snapshot, nowMs)
      if (next === null) return t('noUpcoming')
      const totalMinutes = Math.max(1, Math.ceil((next.at - nowMs) / 60000))
      const state = (next.nextPeak ? snapshot.config.highText : snapshot.config.lowText)
        || t(next.nextPeak ? 'peak' : 'low')
      return t('countdown', {
        state,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
      })
    }

    function svgDataUrl(svg) {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }

    function customIconSource(config, peak) {
      const svg = peak ? config.highIconSvg : config.lowIconSvg
      return typeof svg === 'string' && svg.trim().length > 0 ? svgDataUrl(svg) : null
    }


    function validateSvgText(text) {
      if (typeof text !== 'string' || text.trim().length === 0) return 'svgEmpty'
      if (new TextEncoder().encode(text).length > 128 * 1024) return 'svgTooLarge'
      const trimmed = text.trim()
      if (!/^(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b/i.test(trimmed)
        || !/<\/svg>\s*$/i.test(trimmed)) return 'svgStructure'
      if (!/\bviewBox\s*=\s*["'][^"']+["']/i.test(trimmed)) return 'svgViewBox'
      if (/<!DOCTYPE|<!ENTITY|<\s*(script|foreignObject|iframe|object|embed|image|use|style|a|animate|set)\b/i.test(trimmed)
        || /\son[a-z]+\s*=/i.test(trimmed)
        || /\sstyle\s*=/i.test(trimmed)
        || /(?:href|xlink:href)\s*=/i.test(trimmed)
        || /javascript:/i.test(trimmed)
        || /url\s*\(\s*["']?(?!#)/i.test(trimmed)) return 'svgForbidden'
      try {
        const parsed = new DOMParser().parseFromString(trimmed, 'image/svg+xml')
        if (parsed.getElementsByTagName('parsererror').length > 0) return 'svgStructure'
        if (parsed.documentElement?.localName?.toLowerCase() !== 'svg') return 'svgStructure'
      } catch {
        return 'svgStructure'
      }
      return null
    }

    function monthParts(value) {
      const match = /^(\d{4})-(\d{2})$/.exec(value ?? '')
      if (match === null) return null
      const year = Number(match[1])
      const month = Number(match[2])
      if (month < 1 || month > 12) return null
      return { year, month }
    }

    function shiftMonth(value, delta) {
      const parts = monthParts(value) ?? monthParts(beijingClock(new Date()).date.slice(0, 7))
      if (parts === null) return value
      const date = new Date(Date.UTC(parts.year, parts.month - 1 + delta, 1))
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`
    }

    function calendarHeading(value, locale) {
      const parts = monthParts(value)
      if (parts === null) return value
      const tag = String(locale?.active ?? '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
      return new Intl.DateTimeFormat(tag, { year: 'numeric', month: 'long' })
        .format(new Date(Date.UTC(parts.year, parts.month - 1, 1)))
    }

    function calendarCells(value) {
      const parts = monthParts(value)
      if (parts === null) return []
      const first = new Date(Date.UTC(parts.year, parts.month - 1, 1))
      const leading = (first.getUTCDay() + 6) % 7
      const days = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate()
      const cells = Array.from({ length: leading }, () => null)
      for (let day = 1; day <= days; day += 1) {
        cells.push({
          day,
          date: `${parts.year}-${pad(parts.month)}-${pad(day)}`,
        })
      }
      while (cells.length % 7 !== 0) cells.push(null)
      return cells
    }

    function formatTimestamp(value, locale) {
      if (typeof value !== 'string' || value.length === 0) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      const tag = String(locale?.active ?? '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
      try {
        return new Intl.DateTimeFormat(tag, {
          timeZone: 'Asia/Shanghai',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(date)
      } catch {
        return value
      }
    }

    function pad(value) {
      return String(value).padStart(2, '0')
    }

    function minutesLabel(minutes) {
      const safe = Math.max(0, Math.min(24 * 60, Number(minutes) || 0))
      if (safe === 24 * 60) return '24:00'
      return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
    }

    function timeInputValue(minutes) {
      const safe = Math.max(0, Math.min(23 * 60 + 59, Number(minutes) || 0))
      return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
    }

    function parseTimeInput(value) {
      const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '')
      if (match === null) return null
      const hour = Number(match[1])
      const minute = Number(match[2])
      if (hour > 23 || minute > 59) return null
      return hour * 60 + minute
    }

    function rangesSummary(intervals, locale) {
      const separator = String(locale?.active ?? '').toLowerCase().startsWith('zh') ? '、' : ', '
      return intervals.map(interval => `${minutesLabel(interval.start)}–${minutesLabel(interval.end)}`).join(separator)
    }

    function validateSchedule(schedule) {
      if (!schedule || !Array.isArray(schedule.intervals)) return false
      const sorted = [...schedule.intervals].sort((left, right) => left.start - right.start)
      let previousEnd = -1
      for (const interval of sorted) {
        if (!Number.isInteger(interval.start) || !Number.isInteger(interval.end)) return false
        if (interval.start < 0 || interval.end > 24 * 60) return false
        if (interval.start >= interval.end) return false
        if (interval.start < previousEnd) return false
        previousEnd = interval.end
      }
      return true
    }

    function nextFreeInterval(intervals) {
      const sorted = [...intervals].sort((left, right) => left.start - right.start)
      const candidates = [[0, 60], [9 * 60, 10 * 60], [12 * 60, 13 * 60], [18 * 60, 19 * 60], [20 * 60, 21 * 60]]
      for (const [start, end] of candidates) {
        if (!sorted.some(interval => start < interval.end && end > interval.start)) return { start, end }
      }
      return { start: 22 * 60, end: 23 * 60 }
    }

    function makeDraft(snapshot) {
      const todayDate = beijingClock(new Date()).date
      const override = snapshot.config.todayOverride
      const activeOverride = override && override.date === todayDate ? override.mode : 'auto'
      return {
        position: snapshot.config.position,
        highText: snapshot.config.highText,
        lowText: snapshot.config.lowText,
        highColor: snapshot.config.highColor,
        lowColor: snapshot.config.lowColor,
        highAutoTheme: snapshot.config.highAutoTheme,
        lowAutoTheme: snapshot.config.lowAutoTheme,
        scheduleSource: snapshot.config.scheduleSource,
        manualSchedule: {
          days: [...snapshot.config.manualSchedule.days],
          intervals: snapshot.config.manualSchedule.intervals.map(interval => ({ ...interval })),
        },
        todayMode: activeOverride,
        todayDate,
        holidaySource: snapshot.config.holidaySource ?? 'auto',
        manualHolidays: [...(snapshot.config.manualHolidays ?? [])],
        highIconSvg: snapshot.config.highIconSvg ?? null,
        lowIconSvg: snapshot.config.lowIconSvg ?? null,
        sidebarWidthSync: snapshot.config.sidebarWidthSync ?? true,
        adaptiveWrap: snapshot.config.adaptiveWrap ?? true,
      }
    }

    function draftSignature(draft) {
      if (!draft) return ''
      return JSON.stringify({
        position: draft.position,
        highText: draft.highText,
        lowText: draft.lowText,
        highColor: draft.highColor,
        lowColor: draft.lowColor,
        highAutoTheme: draft.highAutoTheme,
        lowAutoTheme: draft.lowAutoTheme,
        scheduleSource: draft.scheduleSource,
        manualSchedule: draft.manualSchedule,
        todayMode: draft.todayMode,
        todayDate: draft.todayDate,
        holidaySource: draft.holidaySource,
        manualHolidays: draft.manualHolidays,
        highIconSvg: draft.highIconSvg,
        lowIconSvg: draft.lowIconSvg,
        sidebarWidthSync: draft.sidebarWidthSync,
        adaptiveWrap: draft.adaptiveWrap,
      })
    }

    function createStore() {
      let state = { snapshot: null, instanceId: null, error: null, loading: true, started: false }
      let inflight = null
      const listeners = new Set()
      const emit = () => {
        for (const listener of [...listeners]) {
          try {
            listener()
          } catch {
            // A broken subscriber must not strand the store.
          }
        }
      }
      const accept = snapshot => {
        if (snapshot === null || typeof snapshot !== 'object' || typeof snapshot.revision !== 'number') {
          return state.snapshot
        }
        const incomingInstance = typeof snapshot.instanceId === 'string' ? snapshot.instanceId : null
        // A Host restart restarts the revision sequence at 1. Never compare
        // revisions across two Host instances.
        const newInstance = incomingInstance !== null
          && state.instanceId !== null
          && incomingInstance !== state.instanceId
        if (!newInstance && state.snapshot !== null && snapshot.revision < state.snapshot.revision) {
          return state.snapshot
        }
        state = {
          ...state,
          snapshot,
          instanceId: incomingInstance ?? state.instanceId,
          loading: false,
          error: null,
        }
        emit()
        return snapshot
      }
      const request = async (path, init) => {
        const url = new URL(path, document.baseURI)
        const response = await fetch(url, {
          credentials: 'same-origin',
          cache: 'no-store',
          ...init,
          headers: {
            accept: 'application/json',
            ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
            ...(init?.headers ?? {}),
          },
        })
        let payload = null
        try {
          payload = await response.json()
        } catch {
          payload = null
        }
        if (!response.ok) {
          const message = payload && typeof payload.error === 'string'
            ? payload.error
            : `HTTP ${response.status}`
          throw new Error(message)
        }
        if (payload === null || typeof payload !== 'object') throw new Error('The plugin returned an empty response')
        return payload
      }
      const refresh = async () => {
        if (inflight !== null) return inflight
        state = { ...state, started: true, loading: state.snapshot === null, error: null }
        emit()
        inflight = request(API_STATE, { method: 'GET' })
          .then(snapshot => accept(snapshot))
          .catch(error => {
            state = { ...state, loading: false, error: error instanceof Error ? error.message : String(error) }
            throw error
          })
          .finally(() => {
            state = { ...state, loading: false }
            inflight = null
            emit()
          })
        emit()
        return inflight
      }
      return {
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        get() {
          return state
        },
        ensure() {
          if (!state.started) void refresh().catch(() => {})
          return state
        },
        async refresh() {
          return refresh()
        },
        async save(patch) {
          const snapshot = await request(API_SETTINGS, { method: 'POST', body: JSON.stringify(patch) })
          return accept(snapshot)
        },
        async sync() {
          const snapshot = await request(API_SYNC, { method: 'POST', body: '{}' })
          return accept(snapshot)
        },
      }
    }

    function useStore(store) {
      const [, force] = React.useState(0)
      React.useEffect(() => {
        store.ensure()
        return store.subscribe(() => force(value => value + 1))
      }, [store])
      return store.get()
    }

    function useT(api) {
      const [, force] = React.useState(0)
      React.useEffect(() => api.ctx.locale.subscribe(() => force(value => value + 1)), [api])
      return api.t
    }

    function useClock(interval = 15000) {
      const [now, setNow] = React.useState(() => Date.now())
      React.useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), interval)
        return () => window.clearInterval(timer)
      }, [interval])
      return now
    }

    function TrendIcon({ up, size = 14 }) {
      return h('svg', {
        className: 'lt-badge__icon',
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
      }, h('path', {
        d: up
          ? 'M2.2 11.8 6.2 7.8 9.1 10.7 14 5.8'
          : 'M2.2 4.2 6.2 8.2 9.1 5.3 14 10.2',
        stroke: 'currentColor',
        strokeWidth: '1.7',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }), h('path', {
        d: up ? 'M10.7 5.6H14V8.9' : 'M10.7 10.4H14V7.1',
        stroke: 'currentColor',
        strokeWidth: '1.7',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    function estimateCharWidth(character, fontSize = 12) {
      const code = character.codePointAt(0) ?? 0
      if (code >= 0x2e80) return fontSize
      if (character === ' ') return fontSize * 0.33
      if (/[0-9A-Za-z]/.test(character)) return fontSize * 0.56
      return fontSize * 0.5
    }

    function wrapEstimatedLines(text, maxWidth, fontSize = 12) {
      const lines = []
      let current = ''
      let width = 0
      for (const character of text) {
        const characterWidth = estimateCharWidth(character, fontSize)
        if (current.length > 0 && width + characterWidth > maxWidth) {
          lines.push(current)
          current = ''
          width = 0
        }
        current += character
        width += characterWidth
      }
      if (current.length > 0) lines.push(current)
      return lines
    }

    function balancedTextLines(text, maxWidth, fontSize = 12) {
      if (maxWidth <= 0 || typeof text !== 'string' || text.length === 0) return [text]
      const characters = Array.from(text)
      let lines = wrapEstimatedLines(text, maxWidth, fontSize)
      if (lines.length > 1) {
        // If wrapping cuts into the countdown duration ("还有23小时59分"),
        // start the duration on its own line instead of splitting digits/units.
        let markerEnd = -1
        for (let index = 0; index < characters.length - 1; index += 1) {
          if (characters[index] === '还' && characters[index + 1] === '有') markerEnd = index + 2
        }
        if (markerEnd >= 0 && markerEnd < characters.length) {
          let boundary = 0
          let cutsDuration = false
          for (let index = 0; index < lines.length - 1; index += 1) {
            boundary += Array.from(lines[index]).length
            if (boundary > markerEnd && boundary < characters.length) {
              cutsDuration = true
              break
            }
          }
          if (cutsDuration) {
            const head = characters.slice(0, markerEnd).join('')
            const duration = characters.slice(markerEnd).join('')
            lines = [...wrapEstimatedLines(head, maxWidth, fontSize), ...wrapEstimatedLines(duration, maxWidth, fontSize)]
          }
        }
      }
      if (lines.length > 1) {
        const last = lines[lines.length - 1]
        if (Array.from(last).length <= 2) {
          const previous = Array.from(lines[lines.length - 2])
          if (previous.length > 2) {
            const moved = previous.splice(-2).join('')
            lines[lines.length - 2] = previous.join('')
            lines[lines.length - 1] = moved + last
          }
        }
      }
      return lines
    }

    function badgeIcon(config, peak, className = 'lt-badge__icon lt-badge__custom-icon', size = 14) {
      const source = customIconSource(config, peak)
      if (source === null) return h(TrendIcon, { up: peak, size })
      return h('img', {
        className,
        src: source,
        alt: '',
        'aria-hidden': 'true',
        draggable: 'false',
      })
    }

    function Badge({ api, variant, wide }) {
      const storeState = useStore(api.store)
      const t = useT(api)
      const nowMs = useClock(15000)
      const [hovered, setHovered] = React.useState(false)
      const [showCountdown, setShowCountdown] = React.useState(false)
      const [targetWidth, setTargetWidth] = React.useState(null)
      const [sidebarWidth, setSidebarWidth] = React.useState(0)
      const badgeRef = React.useRef(null)
      const baseSizerRef = React.useRef(null)
      const countdownSizerRef = React.useRef(null)
      const baseWidthRef = React.useRef(0)
      const countdownWidthRef = React.useRef(0)
      const hoverTimer = React.useRef(null)
      const swapTimer = React.useRef(null)
      const snapshot = storeState.snapshot
      React.useEffect(() => {
        const pricing = snapshot?.sync?.phase
        const holidays = snapshot?.holidaySync?.phase
        const waiting = (value) => value === 'syncing' || value === 'idle'
        if (!snapshot || (!waiting(pricing) && !waiting(holidays))) return undefined
        const timer = window.setInterval(() => {
          void api.store.refresh().catch(() => {})
        }, 1500)
        return () => window.clearInterval(timer)
      }, [api, snapshot?.sync?.phase, snapshot?.holidaySync?.phase])
      React.useEffect(() => {
        if (snapshot !== null || !storeState.error) return undefined
        const timer = window.setInterval(() => {
          void api.store.refresh().catch(() => {})
        }, 5000)
        return () => window.clearInterval(timer)
      }, [api, snapshot, storeState.error])
      React.useEffect(() => {
        // A Host restart (including HMR of the linked Host half) reuses the
        // page and its client module; a slow poll lets it pick up the new
        // instance id and revision sequence.
        const timer = window.setInterval(() => {
          void api.store.refresh().catch(() => {})
        }, 60000)
        return () => window.clearInterval(timer)
      }, [api])
      React.useLayoutEffect(() => {
        const baseWidth = baseSizerRef.current === null ? 0 : baseSizerRef.current.offsetWidth
        const countdownWidth = countdownSizerRef.current === null ? baseWidth : countdownSizerRef.current.offsetWidth
        baseWidthRef.current = baseWidth
        countdownWidthRef.current = countdownWidth
        const target = hovered ? countdownWidth : baseWidth
        if (hovered || !showCountdown) {
          setTargetWidth(previous => previous === target ? previous : target)
        }
      })
      React.useLayoutEffect(() => {
        if (variant !== 'sidebar' || wide === false || snapshot?.config.position !== 'sidebar') return undefined
        const readWidth = () => {
          const next = badgeRef.current?.offsetWidth ?? 0
          setSidebarWidth(previous => previous === next ? previous : next)
        }
        readWidth()
        if (!(snapshot?.config.sidebarWidthSync ?? true)) return undefined
        const timer = window.setInterval(readWidth, 30 * 60 * 1000)
        return () => window.clearInterval(timer)
      }, [variant, wide, snapshot?.config.position, snapshot?.config.sidebarWidthSync])
      React.useEffect(() => () => {
        if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
        if (swapTimer.current !== null) window.clearTimeout(swapTimer.current)
      }, [])
      if (!snapshot) return null
      if (snapshot.config.position !== variant) return null
      const peak = computePeak(snapshot, new Date(nowMs))
      const rail = variant === 'sidebar' && wide === false
      const baseText = peak ? snapshot.config.highText : snapshot.config.lowText
      const fallbackText = t(peak ? 'peak' : 'low')
      const countdown = countdownLabel(snapshot, t, nowMs)
      // Keep the countdown string rendered in a hidden sizer even while the
      // badge is collapsed, so its width is already known when hover starts.
      // That lets the content and target width change in one commit instead
      // of flashing through a clipped intermediate frame.
      const text = (hovered || showCountdown) ? countdown : baseText
      const sidebarTextWidth = variant === 'sidebar' && sidebarWidth > 0
        ? Math.max(48, sidebarWidth - 42)
        : null
      const color = displayColor(snapshot.config, peak)
      const aria = t(peak ? 'ariaPeak' : 'ariaLow', { text: baseText || fallbackText })
      const wrap = variant === 'sidebar' && (hovered || showCountdown) && !rail
      const adaptiveLines = wrap
        && (snapshot.config.adaptiveWrap ?? true)
        && sidebarTextWidth !== null
        ? balancedTextLines(text, Math.max(24, sidebarTextWidth - 2))
        : null
      const fixedLines = adaptiveLines !== null
      const displayWidth = variant === 'sidebar'
        && sidebarTextWidth !== null
        && targetWidth !== null
        ? Math.min(targetWidth, sidebarTextWidth)
        : targetWidth
      const renderedText = adaptiveLines !== null && adaptiveLines.length > 1
        ? adaptiveLines.flatMap((line, index) => index === 0 ? [line] : [h('br', { key: `lt-br-${index}` }), line])
        : text
      const classes = [
        'lt-badge',
        `lt-badge--${variant}`,
        rail ? 'lt-badge--rail' : '',
        hovered ? 'lt-badge--hovered' : '',
        wrap ? 'lt-badge--wrap' : '',
        fixedLines ? 'lt-badge--fixed-lines' : '',
      ].filter(Boolean).join(' ')
      const badgeStyle = { color }
      if (variant === 'titlebar' && (hovered || showCountdown) && targetWidth !== null && targetWidth > 0) {
        // Let the titlebar badge size itself from the measured text; a pixel
        // max-width here can round below the text width and clip the last
        // character or two on some fonts.
        badgeStyle.maxWidth = 'none'
      }
      if (variant === 'sidebar' && !rail && sidebarTextWidth !== null) {
        // The sidebar width is fixed by the shell, so animate its height
        // instead of the text width. Text stays laid out at a fixed width and
        // cannot reflow mid-transition.
        const measuredLines = adaptiveLines
          ?? wrapEstimatedLines(countdown, Math.max(24, sidebarTextWidth - 2))
        const expandedHeight = wrap
          ? Math.max(32, Math.ceil(measuredLines.length * 12 * 1.35 + 16))
          : 32
        badgeStyle.height = `${expandedHeight}px`
      }
      const clearHoverTimer = () => {
        if (hoverTimer.current !== null) {
          window.clearTimeout(hoverTimer.current)
          hoverTimer.current = null
        }
      }
      const clearSwapTimer = () => {
        if (swapTimer.current !== null) {
          window.clearTimeout(swapTimer.current)
          swapTimer.current = null
        }
      }
      const startHover = () => {
        clearHoverTimer()
        clearSwapTimer()
        hoverTimer.current = window.setTimeout(() => {
          hoverTimer.current = null
          setTargetWidth(countdownSizerRef.current?.offsetWidth || countdownWidthRef.current || null)
          setShowCountdown(true)
          setHovered(true)
        }, 500)
      }
      const endHover = () => {
        clearHoverTimer()
        if (!hovered) {
          clearSwapTimer()
          setShowCountdown(false)
          return
        }
        setHovered(false)
        setTargetWidth(baseSizerRef.current?.offsetWidth || baseWidthRef.current || null)
        clearSwapTimer()
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
        swapTimer.current = window.setTimeout(() => {
          swapTimer.current = null
          setShowCountdown(false)
        }, reduced ? 0 : 240)
      }
      const focusHover = () => {
        clearHoverTimer()
        clearSwapTimer()
        setTargetWidth(countdownSizerRef.current?.offsetWidth || countdownWidthRef.current || null)
        setShowCountdown(true)
        setHovered(true)
      }
      return h(React.Fragment, null,
        h('style', { key: 'lt-style' }, CSS),
        h('div', {
          ref: badgeRef,
          className: classes,
          style: badgeStyle,
          role: 'status',
          'aria-live': 'polite',
          'aria-label': (hovered || showCountdown) && countdown ? `${aria} · ${countdown}` : aria,
          title: rail && countdown ? `${aria} · ${countdown}` : undefined,
          tabIndex: 0,
          onMouseEnter: startHover,
          onMouseLeave: endHover,
          onFocus: focusHover,
          onBlur: endHover,
          'data-liangtime-badge': variant,
          'data-liangtime-state': peak ? 'peak' : 'low',
          'data-liangtime-expanded': hovered ? 'true' : undefined,
        },
        badgeIcon(snapshot.config, peak),
        h('span', { className: 'lt-badge__sizer', 'aria-hidden': 'true', ref: baseSizerRef }, baseText),
        h('span', { className: 'lt-badge__sizer', 'aria-hidden': 'true', ref: countdownSizerRef }, countdown),
        text
          ? h('span', {
              className: 'lt-badge__text',
              style: displayWidth === null || displayWidth <= 0 ? undefined : { width: `${displayWidth}px` },
            }, renderedText)
          : null))
    }

    function Timeline({ intervals, nowMs, t }) {
      const clock = beijingClock(new Date(nowMs))
      const safe = Array.isArray(intervals) ? intervals.filter(interval =>
        Number.isInteger(interval.start) && Number.isInteger(interval.end)
        && interval.start >= 0 && interval.end <= 24 * 60 && interval.start < interval.end) : []
      return h('div', { className: 'lt-timeline' },
        h('div', { className: 'lt-timeline__track' },
          safe.map((interval, index) => h('div', {
            key: `${interval.start}-${interval.end}-${index}`,
            className: 'lt-timeline__band',
            style: {
              left: `${(interval.start / (24 * 60)) * 100}%`,
              width: `${((interval.end - interval.start) / (24 * 60)) * 100}%`,
            },
            title: `${minutesLabel(interval.start)}–${minutesLabel(interval.end)}`,
          })),
          h('div', {
            className: 'lt-timeline__now',
            style: { left: `${(clock.minutes / (24 * 60)) * 100}%` },
            title: t('clock', { time: clock.timeLabel }),
          })),
        h('div', { className: 'lt-timeline__ticks' },
          ['00:00', '06:00', '12:00', '18:00', '24:00'].map(tick => h('span', { key: tick }, tick))))
    }

    function formatDays(days, t, locale) {
      if (!Array.isArray(days) || days.length === 0) return t('noActiveDays')
      const selected = new Set(days)
      const prefix = t('weekPrefix')
      const names = WEEK_ORDER.filter(day => selected.has(day)).map(day => `${prefix}${t(WEEKDAY_KEYS[day])}`)
      const separator = String(locale?.active ?? '').toLowerCase().startsWith('zh') ? '、' : ', '
      return names.join(separator)
    }

    function ScheduleEditor({
      t, draft, snapshot, official, effective, nowMs, update, updateSchedule, setManualSource, invalid, locale,
    }) {
      const manual = draft.manualSchedule
      const summary = effective.intervals.length === 0
        ? t('intervalEmpty')
        : t('scheduleLine', {
            days: formatDays(effective.days, t, locale),
            ranges: rangesSummary(effective.intervals, locale),
          })
      const sourceNote = effective.source === 'manual'
        ? t('manualScheduleNote')
        : snapshot.sync.phase === 'error'
          ? official
            ? t('officialCached')
            : t('officialFallback')
          : official
            ? t('officialSynced')
            : t('officialMissing')
      return h('section', { className: 'lt-card' },
        h('div', { className: 'lt-card__head' },
          h('div', null,
            h('h3', { className: 'lt-card__title' }, t('scheduleTitle')),
            h('p', { className: 'lt-card__hint' }, t('scheduleHint'))),
          h('div', { className: 'lt-seg', role: 'group', 'aria-label': t('scheduleTitle') },
            h('button', {
              type: 'button',
              'aria-pressed': draft.scheduleSource === 'auto',
              onClick: () => update({ scheduleSource: 'auto' }),
            }, t('sourceAuto')),
            h('button', {
              type: 'button',
              'aria-pressed': draft.scheduleSource === 'manual',
              onClick: setManualSource,
            }, t('sourceManual')))),
        h('div', { className: 'lt-card__body' },
          h(Timeline, { intervals: effective.intervals, nowMs, t }),
          h('div', { className: 'lt-legend' },
            h('span', { className: 'lt-legend__chip' }),
            h('span', null, t('peakLabel'))),
          h('div', { className: 'lt-schedule-summary' }, sourceNote),
          h('div', { className: 'lt-schedule-summary' }, summary),
          draft.scheduleSource === 'manual' && official
            ? h('div', { className: 'lt-schedule-summary' }, t('officialCurrent', {
                days: formatDays(official.days, t, locale),
                ranges: rangesSummary(official.intervals, locale),
              }))
            : null,
          draft.scheduleSource === 'manual'
            ? h('div', { className: 'lt-schedule-grid' },
                h('div', { className: 'lt-field' },
                  h('span', { className: 'lt-field__label' }, t('daysLabel')),
                  h('div', { className: 'lt-days' },
                    WEEK_ORDER.map(day => h('button', {
                      key: `day-${day}`,
                      type: 'button',
                      className: 'lt-day',
                      'aria-pressed': manual.days.includes(day),
                      onClick: () => updateSchedule(schedule => ({
                        ...schedule,
                        days: schedule.days.includes(day)
                          ? schedule.days.filter(item => item !== day)
                          : [...schedule.days, day].sort((left, right) => left - right),
                      })),
                    }, t(WEEKDAY_KEYS[day]))))),
                h('div', { className: 'lt-field' },
                  h('span', { className: 'lt-field__label' }, t('intervalsLabel')),
                  manual.intervals.length === 0
                    ? h('div', { className: 'lt-empty' }, t('intervalEmpty'))
                    : h('div', { className: 'lt-intervals' },
                        manual.intervals.map((interval, index) => h('div', {
                          key: `interval-${index}`,
                          className: 'lt-interval',
                        },
                          h('label', { className: 'lt-field' },
                            h('span', { className: 'lt-field__label' }, t('startTime')),
                            h('input', {
                              type: 'time',
                              className: 'lt-input lt-input--time',
                              value: timeInputValue(interval.start),
                              onChange: event => {
                                const value = parseTimeInput(event.target.value)
                                if (value === null) return
                                updateSchedule(schedule => ({
                                  ...schedule,
                                  intervals: schedule.intervals.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, start: value } : item),
                                }))
                              },
                            })),
                          h('span', { className: 'lt-interval__sep' }, '–'),
                          h('label', { className: 'lt-field' },
                            h('span', { className: 'lt-field__label' }, t('endTime')),
                            h('input', {
                              type: 'time',
                              className: 'lt-input lt-input--time',
                              value: timeInputValue(interval.end),
                              onChange: event => {
                                const value = parseTimeInput(event.target.value)
                                if (value === null) return
                                updateSchedule(schedule => ({
                                  ...schedule,
                                  intervals: schedule.intervals.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, end: value } : item),
                                }))
                              },
                            })),
                          h('span', { className: 'lt-interval__actions' },
                            h('button', {
                              type: 'button',
                              className: 'lt-btn lt-btn--quiet lt-btn--danger',
                              onClick: () => updateSchedule(schedule => ({
                                ...schedule,
                                intervals: schedule.intervals.filter((_, itemIndex) => itemIndex !== index),
                              })),
                            }, t('removeInterval')))))),
                  h('div', null,
                    h('button', {
                      type: 'button',
                      className: 'lt-btn',
                      disabled: manual.intervals.length >= MAX_INTERVALS,
                      onClick: () => updateSchedule(schedule => ({
                        ...schedule,
                        intervals: [...schedule.intervals, nextFreeInterval(schedule.intervals)],
                      })),
                    }, t('addInterval')))))
            : h('div', null,
                h('button', {
                  type: 'button',
                  className: 'lt-btn',
                  onClick: setManualSource,
                }, t('editManual'))),
          invalid
            ? h('div', { className: 'lt-error-text', role: 'alert' }, t('invalidInterval'))
            : null))
    }

    function HolidayCalendar({ t, locale, month, setMonth, draft, update, autoHolidays, todayDate }) {
      const cells = calendarCells(month)
      const auto = new Set(autoHolidays)
      const manual = new Set(draft.manualHolidays)
      const toggle = date => {
        const next = manual.has(date)
          ? draft.manualHolidays.filter(item => item !== date)
          : [...draft.manualHolidays, date].sort()
        update({ manualHolidays: next })
      }
      return h('div', { className: 'lt-cal' },
        h('div', { className: 'lt-cal__head' },
          h('span', { className: 'lt-cal__title' }, calendarHeading(month, locale)),
          h('div', { className: 'lt-cal__nav' },
            h('button', {
              type: 'button',
              className: 'lt-btn lt-btn--quiet',
              'aria-label': t('holidayPrevMonth'),
              onClick: () => setMonth(value => shiftMonth(value, -1)),
            }, '‹'),
            h('button', {
              type: 'button',
              className: 'lt-btn lt-btn--quiet',
              onClick: () => setMonth(beijingClock(new Date()).date.slice(0, 7)),
            }, t('holidayThisMonth')),
            h('button', {
              type: 'button',
              className: 'lt-btn lt-btn--quiet',
              'aria-label': t('holidayNextMonth'),
              onClick: () => setMonth(value => shiftMonth(value, 1)),
            }, '›'))),
        h('div', { className: 'lt-cal__grid' },
          WEEK_ORDER.map(day => h('span', {
            key: `weekday-${day}`,
            className: 'lt-cal__weekday',
          }, t(WEEKDAY_KEYS[day])))),
        h('div', { className: 'lt-cal__grid' },
          cells.map((cell, index) => cell === null
            ? h('span', { key: `empty-${index}`, className: 'lt-cal__cell' })
            : h('span', { key: cell.date, className: 'lt-cal__cell' },
                h('button', {
                  type: 'button',
                  className: [
                    'lt-cal__day',
                    auto.has(cell.date) ? 'lt-cal__day--auto' : '',
                    manual.has(cell.date) ? 'lt-cal__day--manual' : '',
                    cell.date === todayDate ? 'lt-cal__day--today' : '',
                  ].filter(Boolean).join(' '),
                  'aria-pressed': manual.has(cell.date),
                  'aria-label': cell.date,
                  onClick: () => toggle(cell.date),
                }, cell.day)))),
        h('div', { className: 'lt-cal__legend' },
          h('span', { className: 'lt-cal__legend-item' },
            h('span', { className: 'lt-cal__legend-dot' }),
            h('span', null, t('holidayAutoLegend'))),
          h('span', { className: 'lt-cal__legend-item' },
            h('span', { className: 'lt-cal__legend-swatch' }),
            h('span', null, t('holidayManualLegend')))))
    }

    function HolidayCard({
      t, locale, snapshot, draft, update, month, setMonth, clock, syncing, manualSync,
    }) {
      const holidaySync = snapshot.holidaySync ?? { phase: 'idle' }
      const holidays = snapshot.holidays ?? { auto: [], notices: [] }
      const auto = Array.isArray(holidays.auto) ? holidays.auto : []
      const notices = Array.isArray(holidays.notices) ? holidays.notices : []
      const separator = locale?.active?.startsWith('zh') ? '、' : ', '
      const noticeYears = [...new Set(notices.map(notice => notice.year))]
      const years = (noticeYears.length > 0
        ? noticeYears
        : [...new Set(auto.map(day => day.slice(0, 4)))])
        .join(separator)
      const syncMessage = holidaySync.phase === 'ok'
        ? t('holidaySyncOk')
        : holidaySync.phase === 'syncing'
          ? t('holidaySyncSyncing')
          : holidaySync.phase === 'error'
            ? t('holidaySyncError')
            : t('holidaySyncIdle')
      const dotClass = holidaySync.phase === 'ok'
        ? 'lt-sync__dot lt-sync__dot--ok'
        : holidaySync.phase === 'error'
          ? 'lt-sync__dot lt-sync__dot--error'
          : holidaySync.phase === 'syncing'
            ? 'lt-sync__dot lt-sync__dot--syncing'
            : 'lt-sync__dot'
      return h('section', { className: 'lt-card' },
        h('div', { className: 'lt-card__head' },
          h('div', null,
            h('h3', { className: 'lt-card__title' }, t('holidaysTitle')),
            h('p', { className: 'lt-card__hint' }, t('holidaysHint')))),
        h('div', { className: 'lt-card__body' },
          h('div', { className: 'lt-sync__row' },
            h('div', { className: 'lt-sync__state' },
              h('span', { className: dotClass }),
              h('span', { className: holidaySync.phase === 'error' ? 'lt-sync-error' : '' }, syncMessage)),
            h('button', {
              type: 'button',
              className: 'lt-btn lt-btn--quiet',
              disabled: syncing || holidaySync.phase === 'syncing' || snapshot.sync?.phase === 'syncing',
              onClick: () => { void manualSync() },
            }, syncing || holidaySync.phase === 'syncing' || snapshot.sync?.phase === 'syncing'
              ? t('syncing')
              : t('manualSync'))),
          holidaySync.phase === 'error' && holidaySync.error
            ? h('div', { className: 'lt-sync-detail' }, t('syncDetail', { error: holidaySync.error }))
            : null,
          h('div', { className: 'lt-seg', role: 'group', 'aria-label': t('holidaysTitle') },
            h('button', {
              type: 'button',
              'aria-pressed': draft.holidaySource === 'auto',
              onClick: () => update({ holidaySource: 'auto' }),
            }, t('holidaySourceAuto')),
            h('button', {
              type: 'button',
              'aria-pressed': draft.holidaySource === 'manual',
              onClick: () => update({ holidaySource: 'manual' }),
            }, t('holidaySourceManual'))),
          h('div', { className: 'lt-schedule-summary' },
            draft.holidaySource === 'auto' ? t('holidayManualHint') : t('holidayManualOnlyHint')),
          auto.length > 0
            ? h('div', { className: 'lt-schedule-summary' },
                t('holidaySyncedSummary', { count: auto.length, years: years || '—' }))
            : h('div', { className: 'lt-schedule-summary' }, t('holidayNoData')),
          h('div', null,
            h('a', {
              className: 'lt-link',
              href: notices[0]?.url ?? holidaySync.sourceUrl ?? 'https://www.gov.cn/zhengce/zhengceku/',
              target: '_blank',
              rel: 'noreferrer',
            }, t('holidaySourceLink'))),
          h(HolidayCalendar, {
            t,
            locale,
            month,
            setMonth,
            draft,
            update,
            autoHolidays: auto,
            todayDate: clock.date,
          }),
          h('div', { className: 'lt-sync__row' },
            h('span', { className: 'lt-note' }, t('holidayManualCount', { count: draft.manualHolidays.length })),
            h('button', {
              type: 'button',
              className: 'lt-btn lt-btn--quiet',
              disabled: draft.manualHolidays.length === 0,
              onClick: () => update({ manualHolidays: [] }),
            }, t('holidayManualClear')))))
    }

    function SvgSpecDialog({ t, dialogRef, onCancel, onContinue }) {
      return h('dialog', {
        ref: dialogRef,
        className: 'lt-dialog',
        onCancel: event => {
          event.preventDefault()
          onCancel()
        },
        onClose: onCancel,
      },
      h('h3', { className: 'lt-dialog__title' }, t('svgSpecTitle')),
      h('p', { className: 'lt-dialog__intro' }, t('svgSpecIntro')),
      h('ul', { className: 'lt-dialog__list' },
        ['svgSpecSize', 'svgSpecViewBox', 'svgSpecShapes', 'svgSpecForbidden', 'svgSpecColor']
          .map(key => h('li', { key }, t(key)))),
      h('div', { className: 'lt-dialog__actions' },
        h('button', { type: 'button', className: 'lt-btn', onClick: onCancel }, t('cancel')),
        h('button', { type: 'button', className: 'lt-btn lt-btn--primary', onClick: onContinue }, t('continueImport'))))
    }

    function SettingsIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      }, h('path', {
        d: 'M4 16.5 9 11.5 13.2 15 20 7.6',
        stroke: 'currentColor',
        strokeWidth: '1.8',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }), h('path', {
        d: 'M15.7 7.3H20V11.6',
        stroke: 'currentColor',
        strokeWidth: '1.8',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }), h('circle', { cx: 5, cy: 19.5, r: 1.3, fill: 'currentColor' }))
    }

    function ToneEditor({ tone, t, draft, update }) {
      const isPeak = tone === 'high'
      const text = isPeak ? draft.highText : draft.lowText
      const color = normalizeHex(isPeak ? draft.highColor : draft.lowColor) ?? '#000000'
      const auto = isPeak ? draft.highAutoTheme : draft.lowAutoTheme
      const label = isPeak ? t('highTextLabel') : t('lowTextLabel')
      const colorLabel = isPeak ? t('highColorLabel') : t('lowColorLabel')
      const previewText = text || t('noText')
      const previewColor = displayColor({
        highColor: draft.highColor,
        lowColor: draft.lowColor,
        highAutoTheme: draft.highAutoTheme,
        lowAutoTheme: draft.lowAutoTheme,
      }, isPeak)
      const setText = value => update(isPeak ? { highText: value } : { lowText: value })
      const setColor = value => update(isPeak ? { highColor: value } : { lowColor: value })
      const setAuto = value => update(isPeak ? { highAutoTheme: value } : { lowAutoTheme: value })
      return h('div', { className: 'lt-tone' },
        h('div', { className: 'lt-tone__top' },
          h('span', { className: 'lt-tone__label' }, isPeak ? t('peakLabel') : t('lowLabel')),
          h('span', { className: 'lt-preview', style: { color: previewColor } },
            badgeIcon(draft, isPeak, 'lt-preview__icon'),
            h('span', null, previewText))),
        h('label', { className: 'lt-field' },
          h('span', { className: 'lt-field__label' }, label),
          h('input', {
            className: 'lt-input',
            type: 'text',
            value: text,
            maxLength: 40,
            placeholder: t('textPlaceholder'),
            onChange: event => setText(event.target.value),
          })),
        h('div', { className: 'lt-field' },
          h('span', { className: 'lt-field__label' }, colorLabel),
          h('div', { className: 'lt-colors' },
            PRESET_COLORS.map(preset => h('button', {
              key: `${tone}-${preset}`,
              type: 'button',
              className: 'lt-swatch',
              style: { background: preset },
              'aria-label': `${colorLabel} ${preset}`,
              'aria-pressed': color === preset,
              onClick: () => setColor(preset),
            })),
            h('label', { className: 'lt-color-input', title: t('customColor') },
              h('input', {
                type: 'color',
                value: color,
                'aria-label': t('customColor'),
                onChange: event => setColor(event.target.value),
              }),
              h('span', null, t('customColor'))),
            h('span', { className: 'lt-color-hex' }, color))),
        isBlackWhite(color)
          ? h('div', { className: 'lt-switch-row' },
              h('div', { className: 'lt-switch-copy' },
                h('span', { className: 'lt-switch-label' }, t('autoTheme')),
                h('span', { className: 'lt-switch-hint' }, t('autoThemeHint'))),
              h('button', {
                type: 'button',
                className: 'lt-switch',
                role: 'switch',
                'aria-checked': auto,
                'aria-label': `${isPeak ? t('peakLabel') : t('lowLabel')} · ${t('autoTheme')}`,
                onClick: () => setAuto(!auto),
              }))
          : null)
    }

    function ToggleRow({ label, hint, checked, onChange }) {
      return h('div', { className: 'lt-switch-row' },
        h('div', { className: 'lt-switch-copy' },
          h('span', { className: 'lt-switch-label' }, label),
          h('span', { className: 'lt-switch-hint' }, hint)),
        h('button', {
          type: 'button',
          className: 'lt-switch',
          role: 'switch',
          'aria-checked': checked,
          'aria-label': label,
          onClick: () => onChange(!checked),
        }))
    }

    function SettingsPage({ api }) {
      const storeState = useStore(api.store)
      const t = useT(api)
      const nowMs = useClock(15000)
      const [draft, setDraft] = React.useState(null)
      const [saving, setSaving] = React.useState(false)
      const [syncing, setSyncing] = React.useState(false)
      const [saved, setSaved] = React.useState(false)
      const [saveError, setSaveError] = React.useState(null)
      const [syncError, setSyncError] = React.useState(null)
      const [uploadTone, setUploadTone] = React.useState(null)
      const [uploadError, setUploadError] = React.useState(null)
      const [calendarMonth, setCalendarMonth] = React.useState(() => beijingClock(new Date()).date.slice(0, 7))
      const savedTimer = React.useRef(null)
      const latest = React.useRef(null)
      const fileInputRef = React.useRef(null)
      const pendingToneRef = React.useRef(null)
      const dialogRef = React.useRef(null)
      const snapshot = storeState.snapshot

      React.useEffect(() => {
        if (snapshot !== null && draft === null) setDraft(makeDraft(snapshot))
      }, [snapshot, draft])

      React.useEffect(() => {
        if (draft === null) return
        const currentDate = beijingClock(new Date(nowMs)).date
        if (draft.todayDate === currentDate) return
        setDraft(previous => previous === null
          ? previous
          : { ...previous, todayDate: currentDate, todayMode: 'auto' })
      }, [draft, nowMs])

      React.useEffect(() => () => {
        if (savedTimer.current !== null) window.clearTimeout(savedTimer.current)
      }, [])

      React.useEffect(() => {
        const pricing = snapshot?.sync?.phase
        const holidays = snapshot?.holidaySync?.phase
        const waiting = (value) => value === 'syncing' || value === 'idle'
        if (!waiting(pricing) && !waiting(holidays)) return undefined
        const timer = window.setInterval(() => {
          void api.store.refresh().catch(() => {})
        }, 1500)
        return () => window.clearInterval(timer)
      }, [api, snapshot?.sync?.phase, snapshot?.holidaySync?.phase])

      React.useEffect(() => {
        if (snapshot?.sync?.phase === 'ok') setSyncError(null)
      }, [snapshot?.sync?.phase])

      React.useEffect(() => {
        const dialog = dialogRef.current
        if (uploadTone === null || dialog === null) return
        try {
          if (!dialog.open) dialog.showModal()
        } catch {
          dialog.setAttribute('open', '')
        }
      }, [uploadTone])

      React.useEffect(() => () => {
        const current = latest.current
        if (current === null || current.draft === null) return
        if (!current.dirty || current.invalid || current.saving) return
        void api.store.save(buildPatch(current.draft)).catch(error => {
          console.error('dsh-liangtime: failed to save pending settings on unmount', error)
        })
      }, [api])

      if (storeState.loading && snapshot === null) {
        return h(React.Fragment, null,
          h('style', null, CSS),
          h('div', { className: 'lt-page' },
            h('div', { className: 'lt-loading' },
              h('span', { className: 'lt-loading__dot' }),
              t('loading'))))
      }

      if (snapshot === null) {
        return h(React.Fragment, null,
          h('style', null, CSS),
          h('div', { className: 'lt-page' },
            h('div', { className: 'lt-card' },
              h('div', { className: 'lt-error-card' },
                h('strong', null, t('loadFailed')),
                storeState.error ? h('span', { className: 'lt-error-text' }, storeState.error) : null,
                h('button', {
                  type: 'button',
                  className: 'lt-btn',
                  onClick: () => { void api.store.refresh().catch(() => {}) },
                }, t('retry'))))))
      }

      if (draft === null) {
        return h(React.Fragment, null,
          h('style', null, CSS),
          h('div', { className: 'lt-page' }, h('div', { className: 'lt-loading' }, t('loading'))))
      }

      const clock = beijingClock(new Date(nowMs))
      const peak = computePeak(snapshot, new Date(nowMs))
      const officialSchedule = snapshot.official
        ? {
            days: [...snapshot.official.days],
            intervals: snapshot.official.intervals.map(interval => ({ ...interval })),
            source: 'official',
            fetchedAt: snapshot.official.fetchedAt,
          }
        : {
            days: [...FALLBACK_SCHEDULE.days],
            intervals: FALLBACK_SCHEDULE.intervals.map(interval => ({ ...interval })),
            source: 'fallback',
            fetchedAt: null,
          }
      const effective = draft.scheduleSource === 'manual'
        ? { ...draft.manualSchedule, source: 'manual', fetchedAt: null }
        : officialSchedule
      const invalid = !validateSchedule(draft.manualSchedule)
      const dirty = draftSignature(draft) !== draftSignature(makeDraft(snapshot))
      const statusColor = displayColor(draft, peak)
      const statusText = peak ? draft.highText : draft.lowText
      const official = snapshot.official
      const locale = api.ctx.locale.getLocale()

      function buildPatch(source) {
        const currentDate = beijingClock(new Date()).date
        const todayMode = source.todayDate === currentDate ? source.todayMode : 'auto'
        const todayOverride = todayMode === 'auto'
          ? null
          : { date: currentDate, mode: todayMode }
        return {
          position: source.position,
          highText: source.highText,
          lowText: source.lowText,
          highColor: source.highColor,
          lowColor: source.lowColor,
          highAutoTheme: source.highAutoTheme,
          lowAutoTheme: source.lowAutoTheme,
          scheduleSource: source.scheduleSource,
          manualSchedule: source.manualSchedule,
          todayOverride,
          holidaySource: source.holidaySource,
          manualHolidays: source.manualHolidays,
          highIconSvg: source.highIconSvg,
          lowIconSvg: source.lowIconSvg,
          sidebarWidthSync: source.sidebarWidthSync,
          adaptiveWrap: source.adaptiveWrap,
        }
      }

      latest.current = { draft, dirty, invalid, saving }

      const update = patch => {
        setSaveError(null)
        setSaved(false)
        setDraft(previous => previous === null ? previous : { ...previous, ...patch })
      }

      const updateSchedule = updater => {
        setSaveError(null)
        setSaved(false)
        setDraft(previous => {
          if (previous === null) return previous
          return { ...previous, manualSchedule: updater(previous.manualSchedule) }
        })
      }

      const openUpload = tone => {
        setUploadError(null)
        setUploadTone(tone)
      }

      const closeUpload = () => {
        setUploadTone(null)
      }

      const continueUpload = () => {
        if (uploadTone === null) return
        pendingToneRef.current = uploadTone
        fileInputRef.current?.click()
        setUploadTone(null)
      }

      const handleFilePicked = async event => {
        const file = event.target.files?.[0]
        event.target.value = ''
        const tone = pendingToneRef.current
        pendingToneRef.current = null
        if (file === undefined || tone === null) return
        if (file.size > 128 * 1024) {
          setUploadError(t('svgUploadFailed', { reason: t('svgTooLarge') }))
          return
        }
        try {
          const text = await file.text()
          const reason = validateSvgText(text)
          if (reason !== null) {
            setUploadError(t('svgUploadFailed', { reason: t(reason) }))
            return
          }
          update(tone === 'high' ? { highIconSvg: text.trim() } : { lowIconSvg: text.trim() })
          setUploadError(null)
        } catch {
          setUploadError(t('svgUploadFailed', { reason: t('svgStructure') }))
        }
      }

      const manualSync = async () => {
        setSyncing(true)
        setSyncError(null)
        try {
          const next = await api.store.sync()
          if (draft === null) setDraft(makeDraft(next))
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : String(error))
        } finally {
          setSyncing(false)
        }
      }

      const save = async () => {
        if (invalid) {
          setSaveError(t('invalidInterval'))
          return
        }
        setSaving(true)
        setSaveError(null)
        setSaved(false)
        try {
          const next = await api.store.save(buildPatch(draft))
          setDraft(makeDraft(next))
          setSaved(true)
          if (savedTimer.current !== null) window.clearTimeout(savedTimer.current)
          savedTimer.current = window.setTimeout(() => setSaved(false), 2400)
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : String(error))
          // The Host may have rejected the write after a concurrent state read
          // observed the candidate; pull the committed snapshot back.
          void api.store.refresh().catch(() => {})
        } finally {
          setSaving(false)
        }
      }

      const setManualSource = () => {
        if (draft.scheduleSource === 'manual') return
        update({
          scheduleSource: 'manual',
          manualSchedule: {
            days: draft.manualSchedule.days.length > 0 ? [...draft.manualSchedule.days] : [...snapshot.schedule.days],
            intervals: draft.manualSchedule.intervals.length > 0
              ? draft.manualSchedule.intervals.map(interval => ({ ...interval }))
              : snapshot.schedule.intervals.map(interval => ({ ...interval })),
          },
        })
      }

      const syncMessage = snapshot.sync.phase === 'ok'
        ? t('syncOk')
        : snapshot.sync.phase === 'syncing'
          ? t('syncSyncing')
          : snapshot.sync.phase === 'error'
            ? t('syncError')
            : t('syncIdle')

      const syncDotClass = snapshot.sync.phase === 'ok'
        ? 'lt-sync__dot lt-sync__dot--ok'
        : snapshot.sync.phase === 'error'
          ? 'lt-sync__dot lt-sync__dot--error'
          : snapshot.sync.phase === 'syncing'
            ? 'lt-sync__dot lt-sync__dot--syncing'
            : 'lt-sync__dot'


      return h(React.Fragment, null,
        h('style', null, CSS),
        h('div', { className: 'lt-page' },
          h('header', { className: 'lt-page__header' },
            h('h2', { className: 'lt-page__title' }, t('pageTitle')),
            h('p', { className: 'lt-page__intro' }, t('pageIntro'))),

          h('section', { className: 'lt-card', 'aria-labelledby': 'lt-current-title' },
            h('div', { className: 'lt-card__head' },
              h('h3', { className: 'lt-card__title', id: 'lt-current-title' }, t('currentState'))),
            h('div', { className: 'lt-status' },
              h('div', { className: 'lt-status__main' },
                h('span', { className: 'lt-status__icon', style: { color: statusColor } },
                  badgeIcon(snapshot.config, peak, 'lt-status__custom-icon', 20)),
                h('div', { className: 'lt-status__label' },
                  h('span', { className: 'lt-status__text', style: { color: statusColor } },
                    statusText || t(peak ? 'peak' : 'low')),
                  h('span', { className: 'lt-status__meta' },
                    `${t('clock', { time: clock.timeLabel })} · ${peak ? t('peakLabel') : t('lowLabel')}${snapshot.now?.holiday ? ` · ${t('holidayBadge')}` : ''}`))),
              null),
            h('div', { className: 'lt-sync' },
              h('div', { className: 'lt-sync__row' },
                h('div', { className: 'lt-sync__state' },
                  h('span', { className: syncDotClass }),
                  h('span', { className: snapshot.sync.phase === 'error' ? 'lt-sync-error' : '' }, syncMessage)),
                h('button', {
                  type: 'button',
                  className: 'lt-btn lt-btn--quiet',
                  disabled: syncing || snapshot.sync.phase === 'syncing' || snapshot.holidaySync?.phase === 'syncing',
                  onClick: () => { void manualSync() },
                }, syncing || snapshot.sync.phase === 'syncing' || snapshot.holidaySync?.phase === 'syncing'
                  ? t('syncing')
                  : t('manualSync'))),
              syncError
                ? h('div', { className: 'lt-sync-detail' }, t('syncDetail', { error: syncError }))
                : snapshot.sync.phase === 'error' && snapshot.sync.error
                  ? h('div', { className: 'lt-sync-detail' }, t('syncDetail', { error: snapshot.sync.error }))
                  : null,
              snapshot.sync.lastSuccess
                ? h('div', null, t('lastSuccess', { time: formatTimestamp(snapshot.sync.lastSuccess, locale) }))
                : null,
              h('div', null,
                h('a', {
                  className: 'lt-link',
                  href: snapshot.sync.sourceUrl ?? 'https://api-docs.deepseek.com/quick_start/pricing',
                  target: '_blank',
                  rel: 'noreferrer',
                }, t('sourceLink'))))),

          h('section', { className: 'lt-card' },
            h('div', { className: 'lt-card__head' },
              h('div', null,
                h('h3', { className: 'lt-card__title' }, t('positionTitle')),
                h('p', { className: 'lt-card__hint' }, t('positionHint')))),
            h('div', { className: 'lt-grid' },
              [
                ['sidebar', t('positionSidebar'), t('positionSidebarHint')],
                ['titlebar', t('positionTitlebar'), t('positionTitlebarHint')],
              ].map(([value, label, hint]) => h('button', {
                key: value,
                type: 'button',
                className: 'lt-choice',
                'aria-pressed': draft.position === value,
                onClick: () => update({ position: value }),
              }, h('span', { className: 'lt-choice__mark' }),
                h('span', { className: 'lt-choice__text' },
                  h('span', { className: 'lt-choice__label' }, label),
                  h('span', { className: 'lt-choice__hint' }, hint)))))),

          h('section', { className: 'lt-card' },
            h('div', { className: 'lt-card__head' },
              h('div', null,
                h('h3', { className: 'lt-card__title' }, t('sidebarLayoutTitle')),
                h('p', { className: 'lt-card__hint' }, t('sidebarLayoutHint')))),
            h('div', { className: 'lt-card__body' },
              h(ToggleRow, {
                label: t('widthSyncLabel'),
                hint: t('widthSyncHint'),
                checked: draft.sidebarWidthSync,
                onChange: value => update({ sidebarWidthSync: value }),
              }),
              h(ToggleRow, {
                label: t('adaptiveWrapLabel'),
                hint: t('adaptiveWrapHint'),
                checked: draft.adaptiveWrap,
                onChange: value => update({ adaptiveWrap: value }),
              }))),

          h('section', { className: 'lt-card' },
            h('div', { className: 'lt-card__head' },
              h('div', null,
                h('h3', { className: 'lt-card__title' }, t('appearanceTitle')),
                h('p', { className: 'lt-card__hint' }, t('appearanceHint')))),
            h('div', { className: 'lt-card__body' },
              h(ToneEditor, { tone: 'high', t, draft, update }),
              h(ToneEditor, { tone: 'low', t, draft, update }))),

          h('section', { className: 'lt-card' },
            h('div', { className: 'lt-card__head' },
              h('div', null,
                h('h3', { className: 'lt-card__title' }, t('iconsTitle')),
                h('p', { className: 'lt-card__hint' }, t('iconsHint')))),
            h('div', { className: 'lt-card__body' },
              uploadError
                ? h('div', { className: 'lt-error-text', role: 'alert' }, uploadError)
                : null,
              h('div', { className: 'lt-icon-row' },
                h('span', { className: 'lt-icon-preview' },
                  draft.highIconSvg
                    ? h('img', { src: svgDataUrl(draft.highIconSvg), alt: '' })
                    : h(TrendIcon, { up: true, size: 18 })),
                h('div', { className: 'lt-icon-row__meta' },
                  h('span', { className: 'lt-icon-row__title' }, t('highIcon')),
                  h('span', { className: 'lt-icon-row__hint' }, draft.highIconSvg ? t('svgSpecColor') : t('iconsHint'))),
                h('div', { className: 'lt-icon-row__actions' },
                  h('button', {
                    type: 'button',
                    className: 'lt-btn',
                    onClick: () => openUpload('high'),
                  }, draft.highIconSvg ? t('replaceSvg') : t('importSvg')),
                  draft.highIconSvg
                    ? h('button', {
                        type: 'button',
                        className: 'lt-btn lt-btn--quiet lt-btn--danger',
                        onClick: () => update({ highIconSvg: null }),
                      }, t('removeIcon'))
                    : null)),
              h('div', { className: 'lt-icon-row' },
                h('span', { className: 'lt-icon-preview' },
                  draft.lowIconSvg
                    ? h('img', { src: svgDataUrl(draft.lowIconSvg), alt: '' })
                    : h(TrendIcon, { up: false, size: 18 })),
                h('div', { className: 'lt-icon-row__meta' },
                  h('span', { className: 'lt-icon-row__title' }, t('lowIcon')),
                  h('span', { className: 'lt-icon-row__hint' }, draft.lowIconSvg ? t('svgSpecColor') : t('iconsHint'))),
                h('div', { className: 'lt-icon-row__actions' },
                  h('button', {
                    type: 'button',
                    className: 'lt-btn',
                    onClick: () => openUpload('low'),
                  }, draft.lowIconSvg ? t('replaceSvg') : t('importSvg')),
                  draft.lowIconSvg
                    ? h('button', {
                        type: 'button',
                        className: 'lt-btn lt-btn--quiet lt-btn--danger',
                        onClick: () => update({ lowIconSvg: null }),
                      }, t('removeIcon'))
                    : null)))),

          h(ScheduleEditor, {
            t,
            draft,
            snapshot,
            official,
            effective,
            nowMs,
            update,
            updateSchedule,
            setManualSource,
            invalid,
            locale,
          }),

          h(HolidayCard, {
            t,
            locale,
            snapshot,
            draft,
            update,
            month: calendarMonth,
            setMonth: setCalendarMonth,
            clock,
            syncing,
            manualSync,
          }),

          h('section', { className: 'lt-card' },
            h('div', { className: 'lt-card__head' },
              h('div', null,
                h('h3', { className: 'lt-card__title' }, t('todayTitle')),
                h('p', { className: 'lt-card__hint' }, t('todayHint')))),
            h('div', { className: 'lt-card__body' },
              h('div', { className: 'lt-sync__row' },
                h('span', { className: 'lt-note' }, t('todayDate', { date: clock.date })),
                h('div', { className: 'lt-seg', role: 'group', 'aria-label': t('todayTitle') },
                  [
                    ['auto', t('todayAuto')],
                    ['peak', t('todayPeak')],
                    ['low', t('todayLow')],
                  ].map(([value, label]) => h('button', {
                    key: value,
                    type: 'button',
                    'aria-pressed': draft.todayMode === value,
                    onClick: () => update({ todayMode: value }),
                  }, label)))),
              draft.todayMode === 'auto'
                ? null
                : h('div', { className: 'lt-note' },
                    t('todayActive', { state: draft.todayMode === 'peak' ? t('peakLabel') : t('lowLabel') })))),

          h('input', {
            ref: fileInputRef,
            type: 'file',
            accept: '.svg,image/svg+xml',
            style: { display: 'none' },
            onChange: event => { void handleFilePicked(event) },
          }),
          uploadTone !== null
            ? h(SvgSpecDialog, {
                t,
                dialogRef,
                onCancel: closeUpload,
                onContinue: continueUpload,
              })
            : null,

          h('footer', { className: 'lt-footer' },
            h('div', { className: 'lt-footer__state' },
              saveError
                ? h('span', { className: 'lt-footer__state--error', role: 'alert' }, t('saveFailed', { message: saveError }))
                : invalid
                  ? h('span', { className: 'lt-footer__state--error', role: 'alert' }, t('invalidInterval'))
                  : saved
                    ? h('span', null, t('saved'))
                    : dirty
                      ? h('span', null, t('dirty'))
                      : h('span', null, t('footerHint'))),
            h('button', {
              type: 'button',
              className: 'lt-btn lt-btn--primary',
              disabled: saving || !dirty || invalid,
              onClick: () => { void save() },
            }, saving ? t('saving') : t('save')))))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const api = {
          ctx,
          t: ctx.locale.bind(NS),
          store: createStore(),
        }
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-liangtime: dictionaries')

        const SidebarBadge = props => h(Badge, { ...props, api, variant: 'sidebar' })
        const TitlebarBadge = props => h(Badge, { ...props, api, variant: 'titlebar' })
        const Page = props => h(SettingsPage, { ...props, api })
        const Icon = props => h(SettingsIcon, props)

        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'liang-time',
          order: 20,
        }, SidebarBadge))

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'liang-time',
          order: 20,
        }, TitlebarBadge))

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'liang-time',
          order: 30,
          label: () => api.t('sectionLabel'),
        }, Page))

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'liang-time',
          order: 30,
        }, Icon))
      },
    }
  },
})
