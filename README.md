# dsh-liangTime

在 DeepSeek Harness 的侧边栏用户名按钮上方或会话标题栏右侧显示当前是否处于 DeepSeek API 的高峰计价时段。

## 功能

- 高峰显示上涨折线箭头，低峰显示下跌折线箭头；箭头无背景，图标与文字同色。
- 鼠标悬停约 0.5 秒（防误触）或键盘聚焦时展开倒计时：显示「距离梁文峰时间/梁文谷时间还有 xx小时 xx分」，颜色沿用当前峰谷配色；宽度随文字自适应，侧边栏空间不足时自动换行；移开后收回。
- 高峰/低峰文字、颜色分别可配；默认高峰绿、低峰红，默认文字为「梁文峰时间」和「梁文谷时间」。
- 颜色可选黑、白、绿、红、黄、蓝、紫、橙，也可通过系统调色盘自定义。
- 选择黑色或白色时出现「跟随应用主题自动切换」开关，默认开启。
- 显示位置可选：侧边栏用户名按钮上方，或会话标题栏右侧。
- 设置页「梁时」提供 24 小时时间仪表盘、官方同步状态、手动峰谷时段、生效日期和今日临时覆盖。
- 自动同步中国法定节假日：通过中国政府网搜索接口定位当前年份和最新年份的放假通知，抓取通知页并解析假期日期；法定节假日全天按低峰处理。
- 提供法定节假日手动日历：自动同步失败或非中国用户可切换到手动模式，逐日标记，或保留自动模式把手动日期作为补充。
- 支持为高峰/低峰分别导入自定义 SVG 图标；导入前会弹出规范确认，确认后调用系统文件选择器。
- 插件每次启动时在后台静默调用 `scripts/fetch_pricing.py` 与 `scripts/fetch_holidays.py`，分别同步峰谷时间和法定节假日；失败时设置页以灰色文字提示，并可手动重试。

## 数据与边界

- 官方时段按北京时间（UTC+8）理解。当前官方规则：周一至周五 09:00–12:00、14:00–18:00 为高峰（不含中国法定节假日）。
- 节假日来源为中国政府网放假通知（`sousuo.www.gov.cn/search-gov/data`），手工日历可覆盖自动结果的空白。
- 同步失败时优先沿用上一次成功缓存；没有缓存时使用内置默认时段，不影响徽标显示。
- 设置与图标保存在 `$DSH_HOME/plugin-data/dsh-liangtime/settings.json`，不使用会话日志。
- 插件不读取会话内容，不调用模型，不发送遥测。
- 依赖 Python 3（`python3` 或 `python`）执行定价页和节假日页抓取；缺少 Python 时同步会失败并显示提示，也可以手动设置时段与节假日。
- 自定义 SVG 图标：≤128 KB、UTF-8、必须含 `viewBox`；禁止 script、事件属性、`foreignObject`、`image`、`use`、`a`、`style`、外部 `href` 和 `javascript:` 引用。图标按文件自身颜色渲染，文字颜色仍跟随设置。


## English

`dsh-liangTime` shows whether DeepSeek API pricing is currently in its peak window, either above the sidebar account button or on the right of the session header. The peak state uses an upward SVG trend arrow and the off-peak state uses a downward one; both are transparent and inherit the configured color. Hover for about 0.5s (to avoid accidental triggers) or focus the badge to expand a countdown to the next peak/off-peak switch, e.g. "2h 15m until LiangWenfeng time". The width follows the text, and the sidebar wraps instead of truncating.

- Configure the position, texts, colors, and 24-hour schedule in **Settings > LiangTime**.
- Peak/off-peak times sync from the official DeepSeek API pricing page at every plugin startup; a failed sync is reported in gray on that page and can be retried manually.
- Chinese public holidays sync automatically from the gov.cn holiday notices. A manual calendar is available for failed syncs and non-China users; in auto mode manual dates are additive, in manual mode only manual dates apply.
- Import separate custom SVGs for peak and off-peak from Settings. The confirmation dialog lists the rules before the system file picker opens. Custom SVGs keep their own colors; badge text still follows the color setting.
- Black/white colors offer a secondary "follow app theme" switch, on by default.
- Manual intervals, active weekdays, and a one-day peak/off-peak override are available on the time dashboard.
- Hours are interpreted in Asia/Shanghai. Requires Python 3 (`python3` or `python`). The plugin never reads session content, calls a model, or sends telemetry.
