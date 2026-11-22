# CampusLink Backend

> 2026-10-29 论坛拓展：新增帖子与评论的持久化接口、搜索分类、分页和本人管理。原 Phase 1 功能保留。旧库需先备份并增加缺失表，配套前端命令 `npm run upgrade:postgres`；完整接口见 `docs/API.md`，最新验收证据见前端 `docs/AUDIT_LOG.md` 第 17 节。以下 10 月 28 日测试数量为上一版本记录。

> 2026-10-28 当前状态：已在 PostgreSQL 17.11 上完成 20 项后端测试、开发模式和构建部署模式的双账号浏览器验收、数据库与图片的备份恢复。SQLite 兼容性为 19 项通过、1 项 PostgreSQL 并发检查跳过。源码位于本地 `work/integration`；容器和公开服务器部署尚未实跑。

福帮帮校园二手资源流转平台 Phase 1 后端。项目使用 FastAPI、SQLAlchemy 2、JWT 和 PostgreSQL，接口统一挂载在 `/api` 下。

## 功能

- 用户注册、登录、JWT 鉴权和个人信息维护
- 商品发布、查询、筛选、详情、修改、状态变更和删除
- 卖家联系方式（登录后查看）
- 商品收藏与收藏列表
- 交易请求及状态流转
- 统一响应结构、参数校验、CORS、自动化测试和 OpenAPI 文档

## 本地启动

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.lock.txt
Copy-Item .env.example .env
uvicorn src.main:app --reload
```

默认使用本地 SQLite，便于直接联调。若使用项目要求的 PostgreSQL，请修改 `.env`：

```env
CAMPUSLINK_DATABASE_URL=postgresql+psycopg://campuslink:campuslink@localhost:5432/campuslink
```

也可以直接启动 PostgreSQL 和 API：

```powershell
docker compose up --build
```

接口地址：

- API：`http://localhost:8000/api`
- Swagger：`http://localhost:8000/docs`
- 健康检查：`http://localhost:8000/api/health`

演示数据默认开启，演示账号密码均为 `123456`，例如用户名 `数学小佬`。

## 前端联调

在前端目录创建 `.env`：

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

后端允许 `http://localhost:5173` 和 `http://127.0.0.1:5173` 跨域访问。登录成功后，将返回的 `data.token` 保存到 `localStorage.token`，前端现有请求封装会自动发送 `Authorization: Bearer <token>`。

## 测试

```powershell
pytest
```

测试使用独立 SQLite 数据库，不依赖本机 PostgreSQL。

完整接口说明见 [docs/API.md](docs/API.md)。

## 与配套前端一起运行

在上一级 CampusLink 前端根目录运行 `npm run setup:backend`，然后 `npm start`。
启动脚本只在 `.env` 不存在时生成本机随机 JWT 密钥，不会覆盖已有配置。
数据库与上传文件默认保存在 `data/` 下，均不纳入 Git。

上传接口需要本次 `work/integration` 的配套提交；远程旧 `main` 不包含该接口。
端到端测试由前端 `npm run test:e2e` 执行，自动使用独立临时数据库、上传目录和端口。

## PostgreSQL、迁移与备份恢复

配套前端根目录提供 Windows 项目内运行环境，不注册系统服务：

```powershell
npm run setup:postgres
npm run migrate:postgres  # 仅将旧 SQLite 复制到空的 PostgreSQL，目标非空会拒绝
npm run build:release
npm run test:postgres
npm run start:release    # 构建后的前端和 API 同源，http://127.0.0.1:8080
```

迁移前使用 SQLite backup API 生成一致性快照。复制后核对全部四张表的内容指纹，保留 ID、密码哈希、金额和 UTC 时间；重置 PostgreSQL 序列以避免新记录 ID 冲突。原 SQLite 不修改。

```powershell
npm run backup:postgres
npm run restore:postgres -- --backup .handoff-backups/<备份目录>
```

备份使用 `pg_dump` custom 格式及导出的同一事务快照，并复制上传目录、记录 SHA-256。恢复只写入新数据库及新上传目录，拒绝已有表或已存在的目标目录，随后核对数据和文件。恢复命令会返回新数据库标识，可由 `npm run start:release -- --restore <标识>` 检查；可通过 `CAMPUSLINK_RELEASE_PORT` 选择独立端口。备份恢复后的库时使用 `npm run backup:postgres -- --restore <标识>`。

`backend/tools/db_admin.py` 同样可独立用于已配置的服务器：

```powershell
python -m tools.db_admin init
python -m tools.db_admin backup --output <全新备份目录>
python -m tools.db_admin restore --backup <备份目录>
python -m tools.db_admin verify --backup <备份目录>
```

这些命令从环境或私有 `.env` 读取连接信息，不在命令行或输出中打印密码。服务器端需提供 PostgreSQL 17 客户端工具，可用 `CAMPUSLINK_PG_BIN` 指定目录。

## 构建后的同源部署

设置 `CAMPUSLINK_FRONTEND_DIST` 为 Vite 构建输出的绝对路径，API 即可同时服务页面、静态文件与 SPA 路由。未知 `/api/*` 和缺失静态文件继续返回 404，不会伪装为 HTML 成功响应。

正式模式设置：`CAMPUSLINK_APP_ENV=production`、PostgreSQL 连接、至少 32 字符的随机 JWT 密钥，并将 `DEBUG`、`SEED_DEMO_DATA`、`AUTO_CREATE_TABLES` 关闭。先执行 `tools.db_admin init` 初始化空库，再启动 API。配置不符合要求会在启动时拒绝运行。后续表结构变更需要单独迁移，`init` 不会升级已有表。

本轮验证的是本机回环地址的部署构建。公开服务器还需目标主机、域名、HTTPS 反向代理、进程管理和备份保留方案；不应把现有开发 Compose 模板视为已验收的公网部署。

参考：[PostgreSQL Windows ZIP](https://www.postgresql.org/download/windows/)、[pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html)、[pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)。

