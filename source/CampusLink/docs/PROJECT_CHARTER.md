# 福帮帮（CampusLink）项目总说明 · Single Source of Truth

> 2026-10-30 新版交接：请优先阅读 HANDOFF_20261030.md、ACCEPTANCE_20261030.md、PROJECT_PROGRESS_REPORT.md 和 AUDIT_LOG 第 20 节。固定公网已上线，新增消息中心与商品和帖子点赞；专业工具原型及“我参与的讨论”仍待完成。下方早期统计及未完成项属于历史记录。

> 2026-10-29 最新更新（优先于下方历史记录）：论坛已接真实帖子和评论接口，支持搜索分类、发帖、封面、本人内容管理和本机草稿。14 个视图、17 条业务路由。老 PostgreSQL 库用 `npm run upgrade:postgres` 先备份再新增表；不在正式启动时自动改表。功能对照与演示见 `ACCEPTANCE_AND_DEMO.md`，本轮验证见 AUDIT_LOG 第 17 节。旧文中的论坛示例及早期测试数量不代表当前状态。

> 最新进度（2026-10-28，覆盖下方历史说明）：PostgreSQL 17.11 已在工作区内运行；SQLite 原数据经快照、指纹与序列验证复制到 PostgreSQL，原文件不改动。20 项 PostgreSQL 后端测试、开发与部署构建两套浏览器验收、数据库/图片备份恢复均通过。部署入口为 `npm run start:release` / `run-production.bat`，本机 8080 端口。后端配套提交 `364e556`；源码与构建打包排除真实环境文件和数据库。公开服务器与 Docker 上线未运行。最新证据见 AUDIT_LOG 第 16 节。

> 2026-10-28 当前状态：真实交易流程已在 SQLite 上完成联调，13 个视图、14 条业务路由。注册使用平台用户名、邮箱、密码；不再模拟发送验证码或伪造登录。商品、用户、收藏、交易均走 API，论坛明确为示例内容。新增单张封面持久化、商品编辑/管理、个人资料；12 项后端测试和双账号浏览器验收通过。PostgreSQL 与正式部署未验收。下文保留历史交接内容，旧缺口结论不要直接执行；当前证据见根目录 README 和 AUDIT_LOG 第 15 节。

### 当前新增的路由与接口

| 路由 | 视图 | 导航 | 需要登录 |
| --- | --- | --- | --- |
| `/product/:id/edit` | Publish.vue（编辑模式） | 隐藏 | 是 |
| `/my-products` | MyProducts.vue | 显示 | 是 |
| `/favorites` | Favorites.vue | 显示 | 是 |
| `/transactions` | Transactions.vue | 显示 | 是 |
| `/settings` | AccountSettings.vue | 显示 | 是 |

`/profile`、`/publish` 同样需要登录。其他已有路由继续保留，登录后返回原目标页。
图片由 `POST /api/uploads` 上传，返回可持久化的 `image_url`，`GET /api/uploads/{filename}` 读取；单张最大 5 MB，仅支持 JPEG/PNG/WebP。
设计新增 `--color-dialog-backdrop` 遮罩 Token；375/390/440px 使用设备宽度，桌面继续保留 440×956 等比例预览。

> 版本：v2.0（UI 组交接版）
> 基准日期：2026-10-21
> 适用对象：UI 组、前端组、执行支持组，以及自动化 agent
> 本文与 `docs/AUDIT_LOG.md` 配套：**本文件写「是什么、要什么、到哪了」，审计日志写「怎么验证出来的」**

---

## 0. 给 agent / 新成员的三分钟速读

| 问题 | 一句话答案 |
| :--- | :--- |
| 这是什么项目 | 福州大学（EE308FZ 软件工程）课程项目，面向福大学生的校园二手交易 + 校园攻略分享互助平台 |
| 代码在哪 | 仓库根目录 `/`，Vue 3 + TypeScript + Vite 6，纯前端工程 |
| 怎么跑起来 | `npm run dev`（或直接双击 `一键启动(源码开发版).bat`） |
| 现在到哪一步了 | 第二次作业（需求分析 + 高保真原型）已交付；**Phase 1 真实开发未开始**：数据全是本地 mock，后端未联调 |
| 最大的坑 | `src/api/` 整个接口层**没有任何页面引用**；`.vue` 文件**不做类型检查**；项目**没有自己的 git 仓库** |
| 下一步先做什么 | 见 [`UI_GAP_ANALYSIS.md`](./UI_GAP_ANALYSIS.md) 的 P0 清单：补「登录/注册页」「发布商品页」，并把 mock 换成 API |

**动手前必读顺序**：本文件 → `UI_GAP_ANALYSIS.md` → `AGENT_ONBOARDING.md`（含命令、目录约定、禁止事项）。

---

## 1. 项目定位

### 1.1 一句话定义

「福帮帮」（英文代号 CampusLink）是**面向福州大学学生的校园资源互助与生活服务平台**，核心双模块为：

1. **校园闲置物品交易**（教材、数码、生活用品、毕业季物品）
2. **校园攻略分享社区**（选课、复习、保研、食堂、宿舍、新生指南）

### 1.2 解决的四个痛点（来自 `resource/[ 福帮帮 ] 项目内部说明文档_初版.docx`）

| 痛点 | 现状 | 福帮帮的解法 |
| :--- | :--- | :--- |
| 信息分散 | 二手与攻略散落在 QQ 群、小红书 | 校内统一入口，双模块同源 |
| 时效模糊 | 商品是否在售、攻略是否过时无法确认 | 商品四态管理（`AVAILABLE`/`RESERVED`/`SOLD`/`OFFLINE`） |
| 资源割裂 | 看完备考攻略还要另搜教材 | 攻略与闲置通过标签弱关联 |
| 流程断裂 | 找信息 → 联系卖家 → 面交跨多个平台 | 站内闭环，含校内面交点指引 |

### 1.3 与通用平台的差异

不做「闲鱼第二」：主打**校园垂直场景 + 资源联动**，强调「福州大学旗山校区」地理约束、「福大学子认证」身份感、「生活一区/图书馆一楼」面交点指引。

---

## 2. 范围界定（Scope）—— 这是全项目最容易吵架的地方，先钉死

### 2.1 课程里程碑与当前坐标

| 阶段 | 周次 | 核心产出 | 状态 |
| :--- | :--- | :--- | :--- |
| 立项 | W6 | 项目说明、原型、分工 | ✅ 完成 |
| **第二次作业：需求分析** | — | **SRS + 界面原型 + 需求分析 PPT + CSDN 博客** | ✅ **本次交付** |
| 核心开发 | W7–W10 | 注册登录、闲置交易核心流程 | ⬜ 未开始 |
| 拓展联调 | W11–W12 | 攻略模块、标签关联、整体联调 | ⬜ 未开始 |
| 测试优化 | W13–W14 | 功能测试、内容与演示准备 | ⬜ 未开始 |
| 收尾答辩 | W15–W16 | 最终交付、答辩 PPT、结题博客 | ⬜ 未开始 |

**判定：当前处于「第二次作业交付完成 → W7 核心开发启动前夜」。** 现有工程是**高保真可交互原型**，不是可上线系统。

### 2.2 Phase 1 功能边界（来自 `resource/README.docx`）

**做**：
- 用户模块：注册、登录、用户信息管理
- 商品模块（核心）：发布、列表、详情、搜索、分类筛选、修改、状态变更、删除
- 交易模块：查看卖家联系方式、发起交易请求、收藏商品

**明确不做**（第一版）：
- ❌ 接入学校数据库 / 学号认证（采用平台独立账号）
- ❌ 站内即时通讯（用「展示联系方式 + 线下面交」替代）
- ❌ 在线支付与资金托管
- ❌ 论坛点赞/评论后端接口（Phase 1 规范未定义，UI 可保留原型）

### 2.3 Phase 1 验收标准（来自 `resource/README.docx` 第 15 节）

一条主链路，缺一环就不算通过：

```
注册 → 登录 → 浏览商品 → 搜索商品 → 查看详情 → 发布商品 → 联系卖家 → 修改商品状态
```

系统级要求：前后端分离、REST API 规范、PostgreSQL、GitHub 协作记录、自动化测试、可部署运行。

> **当前进度对照**：这条链路上「注册」「登录」「发布商品」三个 UI 环节**完全没有页面**。见缺口分析 P0-1、P0-2。

---

## 3. 技术架构

### 3.1 技术栈（实测版本）

| 层 | 选型 | 实际版本 | 备注 |
| :--- | :--- | :--- | :--- |
| 框架 | Vue 3（Composition API + `<script setup>`） | 3.5.x | 全量 SFC |
| 语言 | TypeScript | 5.7.x | ⚠️ 仅覆盖 8 个 `.ts`，`.vue` 不参与类型检查 |
| 构建 | Vite | **6.4.4** | 冷启动 611ms，生产构建 2.53s |
| 路由 | Vue Router | 4.5.x | History 模式，6 条业务路由 |
| 样式 | 原生 CSS Variables + scoped | — | 未引入 UI 组件库 |
| 状态 | **无** | — | 未装 Pinia，跨页状态靠路由传参 |
| 后端 | FastAPI + PostgreSQL | 未接入 | 契约已定义，代码未连 |

### 3.2 分层结构（现状）

```
用户浏览器
   │
   ▼
Vue 3 SPA（6 个 view / 15 个 .vue / 4,144 行）
   │
   ├── 直接 import ──► src/mock/index.ts（17 条内存数据）   ← 当前唯一数据源
   │
   └── （已建好但无人调用）src/api/ ──✗──► FastAPI :8000   ← 契约存在，线路未接
```

### 3.3 目录结构（实际）

```
UI/
├── src/
│   ├── api/             request.ts / auth.ts / product.ts   ← ⚠️ 死代码，无引用
│   ├── components/      common(3) / home(3) / product(1) / forum(1)  = 8 个
│   ├── views/           Home / IdleMarket / ForumList / ProductDetail / PostDetail / Profile
│   ├── mock/            index.ts（17 条数据 + 当前用户）
│   ├── router/          index.ts（6 路由 + 通配重定向）
│   ├── styles/          variables.css（设计 Token）/ main.css
│   ├── types/           index.ts（Product / ForumPost / SellerInfo …）
│   ├── App.vue          根组件 + 桌面/移动双模预览壳
│   └── main.ts
├── public/assets/       avatars(5) / images(12)
├── scripts/             server.ps1 / take_screenshots.js / repack_zips.py / generate_bat_files.py
├── docs/                ← 本次新增：项目说明 / 缺口分析 / agent 手册 / 审计日志
├── resource/            4 份 .docx 需求规格（原始输入，勿改）
├── dist/                生产构建产物（会被 build 覆写）
└── *.bat / *.zip / *.png  交付物与截图（待归档，见工程卫生）
```

### 3.4 路由清单

| 路径 | 视图 | 底部导航 | 规格来源 |
| :--- | :--- | :---: | :--- |
| `/` | Home.vue | 显示 | UI 任务说明 §4.2 首页 |
| `/idle` | IdleMarket.vue | 显示 | §4.3 二手交易首页 |
| `/forum` | ForumList.vue | 显示 | §4.6 攻略首页 |
| `/profile` | Profile.vue | 显示 | §4.8 个人中心 |
| `/product/:id` | ProductDetail.vue | 隐藏 | §4.4 商品详情页 |
| `/forum/:id` | PostDetail.vue | 隐藏 | §4.7 攻略详情页 |
| `/:pathMatch(.*)*` | → 重定向 `/` | — | — |

**缺失路由**：`/login`、`/register`、`/publish`（或 `/idle/publish`）。

---

## 4. UI 设计体系（简述，完整版见缺口分析）

### 4.1 视觉基调

「清朗校园、活力互助、温润极简」——刻意规避二手电商的高饱和促销红。

### 4.2 核心色板

| 语义 | Token | 值 |
| :--- | :--- | :--- |
| 品牌主绿 | `--color-primary` | `#10B958` |
| 辅助论坛蓝 | `--color-secondary` | `#4DA5FA` |
| 价格强调红 | `--color-price` | `#FF2442` |
| 页面底色 / 卡片底 | `--color-bg-page` / `--color-bg-card` | `#F7F9FA` / `#FFFFFF` |
| 文字三级灰 | `--color-text-main/regular/muted` | `#1E293B` / `#475569` / `#94A3B8` |

### 4.3 基准与适配

- 设计基准：**390 × 844（iPhone 12/13/14）**，向下兼容 375px，向上 414/430px
- 桌面预览：`App.vue` 右上角切换「📱 iPhone 390px（带机身外框）」与「🖥️ 自适应」
- 4 个 Tab：首页 / 闲置 / 论坛 / 我的

### 4.4 ⚠️ 已知设计债

`variables.css` 定义了完整 Token，但 **`.vue` 里仍有 186 处硬编码十六进制色值**（TOP：`PostDetail.vue` 38 处、`ProductDetail.vue` 28 处、`Profile.vue` 26 处、`Home.vue` 20 处）。新页面请**只引用 Token，禁止新增硬编码**。

---

## 5. API 契约（Phase 1，后端 FastAPI）

### 5.1 通用约定

- Base URL：`http://localhost:8000/api`
- 响应包装：`{ "code": 200, "message": "success", "data": ... }`
- 鉴权：`Authorization: Bearer <token>`，token 存 `localStorage`

### 5.2 端点清单

| 模块 | 方法 | 路径 | 说明 |
| :--- | :--- | :--- | :--- |
| 用户 | POST | `/auth/register` | `{username, email, password}` |
| 用户 | POST | `/auth/login` | `{username, password}` → `{token}` |
| 商品 | GET | `/products` | `keyword` / `category` / `status` / `page` |
| 商品 | GET | `/products/{id}` | 详情 |
| 商品 | POST | `/products` | `{title, description, price, category, location}` |
| 商品 | PUT | `/products/{id}` | 修改 |
| 商品 | DELETE | `/products/{id}` | 删除 |

### 5.3 数据模型

**products**：`id` / `seller_id` / `title` / `description` / `price` / `category` / `image_url` / `status` / `location` / `created_at`
**users**：`id` / `username` / `email` / `password_hash` / `avatar` / `created_at`
**favorites**：`id` / `user_id` / `product_id`

**商品状态机**：`AVAILABLE`（在售）→ `RESERVED`（预约中）→ `SOLD`（已售）；`OFFLINE`（下架）可从任意态进入。

> **前端现状**：`src/api/*.ts` 已按上表写好函数签名，但**没有任何视图调用它**；`vite.config.ts` 也**未配置 `server.proxy`**，一旦联调会直接撞 CORS。

---

## 6. 团队与分工

| 组 | 负责人 | 成员 | 职责 |
| :--- | :--- | :--- | :--- |
| 总负责 | 陈嘉源 | — | 需求把控、进度管理、对外对接 |
| 后端组（3） | 陈浩洋 | 陈嘉源、陈俊洁 | 数据库、API、业务逻辑、联调支持 |
| 前端组（3） | 朱朝阳 | 周祺粲、朱鸣谦 | 闲置模块 / 攻略模块 / 公共组件与联调 |
| **UI & 汇报组（4）** | **叶嘉辉** | **张溯昉、陈致均、吴思凡** | 视觉风格、界面设计、交互规范、答辩 PPT、博客与答辩稿 |
| 执行支持组（3） | 陈墨涵 | 陈唯、曾文涵 | 测试（2）、文档与演示物料（1） |

> ⚠️ **结构性事实**：本仓库（`UI/`）虽名为 UI 组目录，实际内容是**「UI 设计 + 前端完整实现」的合体交付物**——6 个高保真页面是前端组可以直接接手的生产级代码底子。因此缺口必须按「UI 补设计」与「前端补逻辑」两条线分别认领，见缺口分析第 4 节。

---

## 7. 本次交付物清单

### 7.1 已交付（第二次作业）

| 产物 | 位置 | 状态 |
| :--- | :--- | :--- |
| 6 个高保真页面 | `src/views/` | ✅ 可运行 |
| 8 个复用组件 | `src/components/` | ✅ 可运行 |
| 设计 Token | `src/styles/variables.css` | ✅ 80+ 项 |
| 页面截图（7 张） | `screenshot_*.png` | ✅ |
| 免安装体验包 | `福帮帮-免安装即用体验包(...).zip` | ✅ 39 项，双击即看 |
| 源码开发包 | `福帮帮-完整前端源码开发包(...).zip` | ⚠️ 108 项，混入了截图杂物 |
| UI 交接文档 | `UI_HANDOFF.md` | ⚠️ 部分描述与代码不符 |
| 技术汇报 | `UI与前端第二次汇报客观技术报告.md` | ⚠️ 体积/体积占比等数字与实测不符 |

### 7.2 本次新增（交接补强）

| 文档 | 作用 |
| :--- | :--- |
| `README.md` | 仓库入口，新成员第一站 |
| `docs/PROJECT_CHARTER.md` | 本文件，项目唯一事实来源 |
| `docs/UI_GAP_ANALYSIS.md` | **成熟软件还缺哪些 UI** + P0/P1/P2 优先级 |
| `docs/AGENT_ONBOARDING.md` | 交给 agent 快速接手的执行手册（含命令、约定、禁区） |
| `docs/AUDIT_LOG.md` | 全部实测证据（构建、类型检查、git、硬编码统计） |
| `.gitignore` / `.env.example` | 缺失的工程地基 |

---

## 8. 名词表

| 词 | 含义 |
| :--- | :--- |
| Phase 1 | 第一版范围：仅基础交易闭环，不做论坛后端 |
| 高保真原型 | 像素级、可点击、可路由跳转，但数据来自 mock |
| 攻略 / 帖子 / Forum | 同一事物的三种叫法：论坛社区里的经验分享内容 |
| 闲置 / 商品 / Product | 二手交易模块的内容实体 |
| 面交点 | 校内线下交易地点，如「旗山校区生活一区」 |
| UI & 汇报组 | 本项目同时承担视觉设计、答辩 PPT、博客与现场汇报的小组 |

---

## 9. 变更记录

| 版本 | 日期 | 变更 |
| :--- | :--- | :--- |
| v1.0 | 2026-10 | 初版（项目内部说明文档） |
| v2.0 | 2026-10-21 | UI 组交接版：补全架构现状、API 契约、团队分工、交付清单、审计索引 |
