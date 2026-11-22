# dsh-liangTime

在 DeepSeek Harness 的侧边栏用户名按钮上方或会话标题栏右侧显示当前是否处于 DeepSeek API 的高峰计价时段。

## 功能

- 高峰显示上涨折线箭头，低峰显示下跌折线箭头；箭头无背景，图标与文字同色。
- 鼠标悬停约 0.5 秒（防误触）或键盘聚焦时展开倒计时：显示「距离梁文峰时间/梁文谷时间还有 xx小时 xx分」，颜色沿用当前峰谷配色；移开后平滑收回。
- 高峰/低峰文字、颜色分别可配；默认高峰绿、低峰红，默认文字为「梁文峰时间」和「梁文谷时间」。
- 颜色可选黑、白、绿、红、黄、蓝、紫、橙，也可通过系统调色盘自定义。
- 选择黑色或白色时出现「跟随应用主题自动切换」开关，默认开启。
- 显示位置可选：侧边栏用户名按钮上方，或会话标题栏右侧。
- 设置页「梁时」提供 24 小时时间仪表盘、官方同步状态、手动峰谷时段、生效日期和今日临时覆盖。
- 插件每次启动时在后台静默调用 `scripts/fetch_pricing.py`，从 DeepSeek API 定价页同步峰谷时间；失败时设置页以灰色文字提示，并可手动重试。

## 数据与边界

- 官方时段按北京时间（UTC+8）理解。当前官方规则：周一至周五 09:00–12:00、14:00–18:00 为高峰（不含中国法定节假日）。
- 插件只自动同步时段，不内置中国法定节假日表；遇到节假日可在「今日覆盖」中把今天强制为低峰。
- 同步失败时优先沿用上一次成功缓存；没有缓存时使用内置默认时段，不影响徽标显示。
- 设置保存在 `$DSH_HOME/plugin-data/dsh-liangtime/settings.json`，不使用会话日志。
- 插件不读取会话内容，不调用模型，不发送遥测。
- 依赖 Python 3（`python3` 或 `python`）执行定价页抓取；缺少 Python 时同步会失败并显示提示，也可以手动设置时段。


## English

`dsh-liangTime` shows whether DeepSeek API pricing is currently in its peak window, either above the sidebar account button or on the right of the session header. The peak state uses an upward SVG trend arrow and the off-peak state uses a downward one; both are transparent and inherit the configured color. Hover for about 0.5s (to avoid accidental triggers) or focus the badge to smoothly expand a countdown to the next peak/off-peak switch, e.g. "2h 15m until LiangWenfeng time".

- Configure the position, texts, colors, and 24-hour schedule in **Settings > LiangTime**.
- Peak/off-peak times sync from the official DeepSeek API pricing page at every plugin startup; a failed sync is reported in gray on that page and can be retried manually.
- Black/white colors offer a secondary "follow app theme" switch, on by default.
- Manual intervals, active weekdays, and a one-day peak/off-peak override are available on the time dashboard.
- Hours are interpreted in Asia/Shanghai. Chinese public holidays are not synced automatically; use the one-day override for a holiday.
- Requires Python 3 (`python3` or `python`). The plugin never reads session content, calls a model, or sends telemetry.
