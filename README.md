# VocabProfiler

[English README](./docs/README.en.md)

VocabProfiler 是一个可自行部署的词汇学习工具。它把“先记下以后要学的词”和“现在开始背的词”分开，让笔记本中的待学数量更清楚。

## 功能

- **笔记本**：录入词汇，按 Active（正反向）或 Passive（正向）学习和复习；支持多义词、词汇编辑与词包导入。
- **便签**：独立暂存词汇，不计入待学习或待复习数量；需要学习时，可将整张便签复制到指定笔记本，自动跳过目标笔记本已有的相同词汇。
- **记忆队列**：区分新词与到期复习，提供记住、模糊和遗忘等操作；Active 词汇同时考虑正反向的结果。
- **桌面和手机**：支持响应式界面；桌面录词时可在左上角查看快捷键。

记忆安排的简要说明见 [记忆设计](./docs/memory-design.md)，数据库表结构见 [数据库设计](./docs/database.md)。

## 技术结构

前端使用 Vue 3、Vuetify 和 Vite；后端使用 Node.js、Express 和 MySQL。浏览器向同源的 `/api` 发请求，后端实际路由为 `/user`、`/word`、`/notebook`、`/notes` 和 `/wordpack`。

## 本地运行

需要 Node.js、npm 和 MySQL。以下命令在克隆仓库后执行。

1. 创建名为 `vocab_profiler_db` 的数据库，按 [数据库设计](./docs/database.md) 中的顺序建表。当前服务端路由使用这个数据库名，单独修改 YAML 中的 `db.database` 还不够。
2. 将 `codes/server/.env.example` 复制为 `codes/server/.env`，填写 `DB_PASSWORD`、随机生成的 `JWT_SECRET` 和 `JWT_EXPIRES_IN`。真实 `.env` 不要提交到仓库。
3. 检查 [服务端配置](./codes/server/config/config.yaml) 中的数据库主机、端口、用户名以及服务端监听地址。配置文件可以提交；密码和 JWT 密钥从 `.env` 读取。
4. 分别启动后端和前端：

```sh
cd codes/server
npm ci # 安装项目依赖
npm start
```

在另一个终端，从仓库根目录运行：

```sh
cd codes/client
npm ci # 安装项目依赖
npm run dev
```

开发页面默认使用 `http://localhost:8443`，Vite 会把 `/api` 转发至 `http://127.0.0.1:3000`。这里的 8443 是开发端口，当前配置使用 HTTP。若端口被占用，Vite 可能选择其他端口，以终端输出为准。

## 自行部署

一种简单的方式是先安装 PM2，再用它运行后端，并用 Nginx 托管前端构建结果；其他能实现相同路由的方式也可以。

```sh
cd codes/client
npm ci # 安装项目依赖
npm run build

cd ../server
npm ci --omit=dev # 安装项目依赖
pm2 start bin/www --name vocab-profiler # 以pm2为例
```

后端从 `codes/server` 工作目录启动，以便读取该目录下的 `.env`。前端静态文件位于 `codes/client/dist`。下面是 Nginx 的路由示意，将 `root` 换成实际绝对路径：

```nginx
server {
    listen 80;
    server_name example.com;
    root /absolute/path/to/VocabProfiler/codes/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

| 用途 | 当前默认端口 | 建议访问范围 |
| --- | --- | --- |
| MySQL | 3306 | 仅后端可达，无需公网开放 |
| Express API | 3000 | 当前默认监听 `127.0.0.1`，供本机反向代理访问 |
| Vite 开发服务 | 8443 | 仅开发时使用 |
| Nginx 网页入口 | 80 / 443 | 对访问者开放 |

如果反向代理或数据库在另一台机器上，请按实际网络修改 [服务端配置](./codes/server/config/config.yaml) 和防火墙规则。
同源部署无需单独调用 CORS；若前端与 API 分属不同源，还需修改 `cors.origin` 并检查 Cookie 设置。

## 仓库中的配置与数据

`codes/server/config/config.yaml` 包含可公开的主机、端口等设置，敏感值通过环境变量引用。
`codes/server/logs/Winston.js` 和不含真实密钥的 `.env.example`。
