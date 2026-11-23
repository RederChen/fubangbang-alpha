# 福帮帮 (CampusLink) · 校园互助与闲置交易平台 · 前端

> Alpha coursework repository: both frontend and backend are tracked here under `source/CampusLink/`. Use the current [source setup guide](../README.md) and [Sprint 2 handoff](../../docs/sprints/sprint-2/TEAM-HANDOFF.md). The separate-repository instructions and compiled releases below describe the original handoff history.

> 2026-10-30 新版交接入口：[交接说明](docs/HANDOFF_20261030.md)、[项目进展报告](docs/PROJECT_PROGRESS_REPORT.md)、[验收与演示](docs/ACCEPTANCE_20261030.md)。Word 报告随外层交接 ZIP 提供。专业工具原型继续待办。

> 福州大学 EE308FZ 软件工程课程项目 · UI & 汇报组 / 前端组
> 当前阶段：真实交易与论坛已接入 PostgreSQL，固定公网网站已上线；消息与点赞更新说明见下方及对应文档。
> 技术栈：Vue 3 + TypeScript + Vite 6 · 当前演示视口 440 × 956 · 零 UI 组件库

临时公网体验已验证：双击 `start-public-demo.bat`，先备份并复制数据，再为独立副本生成临时 HTTPS 地址。本机需保持开机联网，公网与本机数据不自动同步。详见 [临时公网演示说明](docs/PUBLIC_DEMO.md)；这不等于长期服务器托管。

2026-10-30：Render + Supabase 固定网站已上线：[福帮帮](https://campuslink-deploy.onrender.com)。Linux Docker 构建、私有图片存储初始化、数据库连接和表初始化成功；用户与组员已初步体验。公网与本机是不同数据库。部署源码位于 `Mikorchara/campuslink-deploy`，说明见 [部署指南](deploy/README.md)。

本轮新增站内消息中心（预订、交易状态、评论和收到的赞），以及商品/帖子详情页点赞和取消。支持未读数量、已读管理及详情跳转。只新增数据表，保留已有账号和内容；旧事件不补发提醒。范围、升级和验收见 [消息与点赞说明](docs/MESSAGES_AND_LIKES.md)。专业工具原型仍未交付。

## 2026-10-29 论坛拓展

- 新增真实帖子分类、标题/正文搜索、分页、发布、封面、本人编辑删除和“我的帖子”。首页分享与搜索同步读取真实论坛接口。
- 新增持久化评论及本人修改、删除；越权操作由后端拒绝，删除帖子须确认并级联删除评论。
- 保留本机草稿，失败时保留输入；正文和评论按纯文本展示。没有模拟点赞或关注。
- 老版 PostgreSQL 库先执行 `npm run upgrade:postgres`：成功备份后仅创建缺少的表，再构建并启动新版；旧的四表备份仍支持恢复，恢复副本可带 `--restore <标识>` 升级。
- 论坛不预填样例，初始列表为空；测试内容只存隔离测试库。
- 本轮后端配套提交为 `9b19adc`，需与本次前端一同交接；原后端 `main` 或上一版部署代码不包含论坛写入接口。
- 验收与演示流程：[docs/ACCEPTANCE_AND_DEMO.md](docs/ACCEPTANCE_AND_DEMO.md)。本轮证据见审计日志第 17 节，以下 10 月 28 日内容为上一阶段记录。

## 2026-10-28 接手状态（历史）

- 前端 Git：本目录独立仓库，开发分支 `work/phase1`，远程 `Aurowisp/Frontend`。
- 后端 Git：`backend/` 是独立仓库，开发分支 `work/integration`，远程 `Aurowisp/Backend`；不纳入前端提交。
- 两个仓库都保留 `handoff-20261028` 标签；原始文件备份位于本地 `.handoff-backups/`。
- 本地修改按功能提交；当前没有向远程推送或合并变更。
- 部署构建输出到 `.releases/<release>/site`，保留原有 `dist/` 交付物。
- `npm run typecheck` 已接入 `vue-tsc`。后端使用自己的 `.venv/`，测试强制使用隔离 SQLite 数据库。
- 已联调：用户名/邮箱注册登录、登录恢复、首页与商品列表、搜索分类、详情、封面上传、草稿、发布、编辑、删除、状态管理、收藏、联系方式、个人资料、预订到面交完成。
- 登录、注册、发布与商品读取均不再失败后回退为模拟成功。用户与商品数据来自后端；论坛内容明确标记为示例。
- 验证：PostgreSQL 上 20 项后端测试通过；开发和部署构建两个模式均通过真实双账号浏览器验收；备份恢复的数据和图片指纹一致。
- SQLite 兼容检查为 19 项通过、1 项 PostgreSQL 并发检查跳过。现有 SQLite 已备份并复制到 PostgreSQL，原文件未改动。
- 当前边界：每件商品一张封面；真实论坛、多图、孤立上传清理、公开服务器与 HTTPS 上线仍待安排。Docker 模板尚未实跑。
- 后端配套版本为 `364e556` 或更新版本；需与本次前端工作分支一同交接。

执行证据见 `docs/AUDIT_LOG.md` 第 16 节。旧文档中的历史统计不代表当前状态。

---

## 🚀 快速开始

```bash
npm install          # 首次安装依赖
npm run setup:backend # 安装 backend/ 内的独立 Python 环境（需 Python 3.11+）
npm start            # 同时启动前后端 → http://127.0.0.1:5173
npm run dev          # 只启动前端，适合后端已独立启动的情况
npm run build        # 生产构建 → dist/
npm run preview      # 预览构建产物
npm run typecheck    # TypeScript 与 Vue 单文件组件类型检查
npm run test:e2e     # 独立端口/数据库运行真实浏览器验收（默认使用 Windows Edge）
```

**本机查看 PostgreSQL 部署版：** 双击 `run-production.bat`，打开 `http://127.0.0.1:8080/`。已生成部署构建，无需运行 Vite 开发服务器。`start-postgres.bat` 可启动 PostgreSQL 开发模式；`start-local.bat` / `npm start` 保留为 SQLite 开发入口。

`双击直接预览(免装环境).bat` 和原有 `dist/` 保留的是收到的历史原型，不能用于验收本次真实业务。若从其他机器获取代码，需要前端和后端两个配套工作分支；`backend/` 不随前端 Git 提交。

当前本地部署构建由 FastAPI 同时提供前端页面和 `/api`。公开服务器仍需主机、域名、HTTPS 反向代理和进程管理；数据库与封面目录都需持久保存。当前回环地址服务不是公网发布。

## PostgreSQL 与部署交付操作

已验证环境：64 位 Windows、Node 24.16.0、Python 3.12.10、PostgreSQL 17.11。PostgreSQL 使用[官网链接的 EDB ZIP](https://www.postgresql.org/download/windows/)放在项目内，不注册系统服务；首次准备需下载约 381 MB。

```powershell
npm ci
npm run setup:backend
npm run setup:postgres      # 程序在 .cache，数据与私密配置在 .local/postgres
npm run migrate:postgres    # 仅在需要复制旧 SQLite 且目标库为空时执行
npm run build:release       # 生成构建、源码提交号和资源 SHA-256 清单
npm run test:postgres       # PostgreSQL 后端、开发/部署浏览器流程、备份恢复
npm run start:release       # http://127.0.0.1:8080/
```

新机器没有旧 SQLite 时跳过 `migrate:postgres`，自行注册账号。迁移不会覆盖已有 PostgreSQL 数据，也不删除原 SQLite。`setup:postgres` 创建空表，不灌入演示账号。

| 内容 | 本地位置 |
| --- | --- |
| PostgreSQL 持久数据 | `.local/postgres/data/` |
| 本机数据库私密配置 | `.local/postgres/credentials.json`（不提交、不打包） |
| 上传封面 | `backend/data/uploads/` |
| 旧 SQLite | `backend/data/campuslink.db`（保留） |
| 私有数据与 Git 备份 | `.handoff-backups/`（不提交、不打包） |
| 构建、交付 ZIP 与校验文件 | `.releases/` |

停止网页服务用 Ctrl+C；需要停止项目 PostgreSQL 时执行 `npm run postgres:stop`。不要把 `.local/` 当作可丢弃缓存。

## 备份与恢复

```powershell
npm run backup:postgres
npm run restore:postgres -- --backup .handoff-backups/<返回的备份目录>
```

备份同时包含数据库、上传图片和 SHA-256 清单。恢复命令只写入新库和新图片目录，并核对备份中全部表与图片内容；不会替换当前库。检查恢复结果时，可在独立端口启动：

```powershell
$env:CAMPUSLINK_RELEASE_PORT='8081'
npm run start:release -- --restore <恢复命令返回的数据库标识>
```

确认恢复结果后，可在停止旧网页服务后用相同标识启动到正式本地端口。备份该恢复库时使用 `npm run backup:postgres -- --restore <标识>`。备份含账号密码哈希与用户数据，请留在私有存储，不随源码分享。

## 交接包与演示

代码提交后运行 `npm run build:release`、`npm run package:release`，生成配套前后端源码、编译后的页面、版本清单和 ZIP SHA-256。打包会拒绝未提交源码和过期构建；排除数据库、实际 `.env`、私密配置、缓存和依赖。交接到新机器仍需安装运行环境并配置数据库。

建议课堂演示：账号 A 注册登录 → 上传封面并发布 → 刷新确认保存 → 搜索商品 → 账号 B 收藏、查看联系方式并申请预订 → A 接受并确认面交完成 → B 刷新看到已完成。再演示 A 发布校园经验 → B 搜索并评论 → A 刷新看到评论 → B 编辑本人评论。完整清单见 `docs/ACCEPTANCE_AND_DEMO.md`，最新证据见审计日志第 17 节。

---

## 📚 文档导航（新成员请按顺序读）

| 文档 | 内容 | 什么时候读 |
| :--- | :--- | :--- |
| **[docs/PROJECT_CHARTER.md](docs/PROJECT_CHARTER.md)** | 项目定位、范围边界、架构、API 契约、团队分工 | 第一天必读 |
| **[docs/UI_GAP_ANALYSIS.md](docs/UI_GAP_ANALYSIS.md)** | 距离成熟软件还缺什么 UI、P0/P1/P2 优先级 | 动手前必读 |
| **[docs/AGENT_ONBOARDING.md](docs/AGENT_ONBOARDING.md)** | 目录约定、代码铁律、任务模板、已知坑 | 写代码前必读 |
| **[docs/AUDIT_LOG.md](docs/AUDIT_LOG.md)** | 构建/类型检查/git 的实测证据 | 质疑某结论时读 |
| [UI_HANDOFF.md](UI_HANDOFF.md) | 第一版 UI 交接说明（部分内容已过时，见审计日志） | 参考 |

---

## 📦 当前完成度

| 维度 | 状态 |
| :--- | :--- |
| 页面 | 14 个视图、17 条业务路由；帖子与商品编辑复用各自发布视图 |
| 复用组件 | 原有 8 个业务组件，新增 RequestState 与 AppDialog |
| 设计 Token | 新组件使用 Token；历史硬编码数量尚未重新统计 |
| 数据来源 | 用户、商品、交易、帖子和评论均使用真实 API；页面不依赖 Mock |
| 类型检查 | `vue-tsc` 已安装，`npm run typecheck` 可检查 `.ts` 和 `.vue` |
| 生产构建 | 114 个模块，`.releases/` 中有版本与资源校验清单；本地同源部署验收通过 |
| 版本控制 | 前端、后端各自使用独立 Git 仓库，工作分支开发 |

> 详细缺口与修复路径见 [docs/UI_GAP_ANALYSIS.md](docs/UI_GAP_ANALYSIS.md)。

---

## 🗂 目录结构

```
├── docs/                 # 项目文档（本次交接新增）
├── src/
│   ├── api/              # auth / product / trade / forum 真实 API
│   ├── components/       # common / home / product / forum
│   ├── views/            # 14 个页面视图
│   ├── stores/           # Pinia 用户态
│   ├── mock/             # 保留原始演示素材，业务页面不再导入
│   ├── router/           # 路由表
│   ├── styles/           # variables.css（设计 Token）
│   └── types/            # TS 类型定义
├── public/assets/        # 静态图片与头像
├── scripts/              # 本地静态服务器、截图巡检、打包脚本
├── resource/             # 原始需求文档（.docx，只读）
├── backend/              # 独立克隆的后端仓库，忽略于前端 Git
└── dist/                 # 构建产物（会被 build 覆写）
```

---

## ⛔ 开发铁律

1. 颜色**只**用 `var(--color-*)`，禁止新增硬编码 hex
2. 禁止引入 Element Plus / Vant / Ant Design 等 UI 库
3. 禁止在组件里直接 `import ... from '../mock'`（应走 `api/`）
4. 新路由必须写 `meta: { title, showNav }`
5. 页面根元素 `padding-bottom: 76px`（避开底部导航）
6. 改动后必须 `npm run build` 通过

---

## 👥 团队

- **总负责**：陈嘉源
- **后端组**（陈浩洋 / 陈嘉源 / 陈俊洁）
- **前端组**（朱朝阳 / 周祺粲 / 朱鸣谦）
- **UI & 汇报组**（叶嘉辉 / 张溯昉 / 陈致均 / 吴思凡）
- **执行支持组**（陈墨涵 / 陈唯 / 曾文涵）

---

## 🔗 相关仓库

- Backend：`git@github.com:Aurowisp/Backend.git`
- Frontend：`https://github.com/Aurowisp/Frontend.git`（本目录已关联）

---

## 📄 许可

课程项目，仅用于福州大学 EE308FZ 软件工程教学。
