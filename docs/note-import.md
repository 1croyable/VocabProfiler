# 从其他产品导入便签

以下路径相对于后端地址；当前前端代理下应加 `/api` 前缀。

1. `POST /user/login`，JSON 请求体：

   ```json
   { "username": "你的用户名", "password": "你的密码", "return_token": true }
   ```

   验证成功后响应包含 `user` 和 `token`。只有显式设置 `return_token: true` 才会返回令牌，原有 Cookie 登录继续可用。

2. `POST /notes/import`，请求头 `Content-Type: application/json` 和 `Authorization: Bearer <token>`，请求体直接使用数组：

   ```json
   [
     { "front": "bonjour", "back": "你好", "type": "active" },
     { "front": "au revoir", "back": "再见", "type": "passive" }
   ]
   ```

   必须提供 `type`（`active` 或 `passive`），不接收外部 `user_id`。用户由现有鉴权中间件验证的令牌决定。每次调用创建一张新的、以时间命名的便签，并通过与手动添加相同的内部函数写入词汇；全部成功后才提交事务。

   成功响应为 HTTP 201，例如：

   ```json
   { "id": 12, "name": "2026-10-04 12:00:00", "word_count": 2, "active_count": 1, "passive_count": 1, "skipped": 0 }
   ```

   数组长度为 1–1000；正面非空且不超过 255 字符，背面非空。无效项返回 HTTP 400 和从 0 开始的 `index`，不会创建便签。当前服务器 JSON 请求体限制为 Express 默认的 100 KB。同一类型、相同正反面的重复项（忽略首尾空白、大小写和 CRLF/LF 差异）合并，`skipped` 表示排除数；同正面不同背面作为多义词保留。

外部前端跨域调用时，需要将其实际来源地址加入后端 `cors.origin` 配置；已有配置允许 `Authorization` 请求头。使用 HTTPS 传输账号密码和令牌。

# 便签应用与词包共用预览

`components/WordImportReview.vue` 通过 `sourceWords` 和 `existingWords` props 接收词汇，不依赖 Pinia。编辑、交换正反面、选择类型、排除和恢复都在预览副本上进行，便签原内容保留。词包传入当前笔记本的 Pinia 数组；便签应用先请求 `/word/list?notebook_id=...` 读取所选笔记本，再传给组件。

重复判断维持原词包的类型分组规则：同类型同正面提示冲突；不同背面可查看后明确确认保留，完全相同的正反面只能修改或跳过。比较范围包括目标词汇及本批所有已选词汇；修改正面、背面、类型或冲突词汇后重新检查。便签提交 `/notes/:id/apply` 时携带 `{ notebook_id, words }`，后端再次检查批内及目标笔记本中的完全重复，返回 409 时保留编辑并刷新目标词汇。

# iPhone 主屏幕启动

添加了 `manifest.webmanifest`（`display: standalone`、站内 scope）、Apple 启动 meta 和由原应用图标生成的 PNG 图标。部署后建议移除旧的主屏幕快捷方式，从 Safari 重新“添加到主屏幕”；如果有“作为 Web App 打开”选项，将其开启。然后从主屏幕图标启动，以验证无 Safari 地址栏和底部工具栏。

此配置控制主屏幕启动模式；直接在 Safari 浏览网页仍由 Safari 显示工具栏，跳转到外部网站也由系统决定打开方式。不添加离线缓存或 Service Worker。真实 iPhone 上的启动效果需要设备验证。
