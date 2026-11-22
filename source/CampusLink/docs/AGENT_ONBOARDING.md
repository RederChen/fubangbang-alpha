# Agent 快速接手手册 · 福帮帮前端

> 2026-10-30 新版交接：请优先阅读 HANDOFF_20261030.md、ACCEPTANCE_20261030.md、PROJECT_PROGRESS_REPORT.md 和 AUDIT_LOG 第 20 节。固定公网已上线，新增消息中心与商品和帖子点赞；专业工具原型及“我参与的讨论”仍待完成。下方早期统计及未完成项属于历史记录。

> 2026-10-29 最新更新（优先于下方历史记录）：论坛已接真实帖子和评论接口，支持搜索分类、发帖、封面、本人内容管理和本机草稿。14 个视图、17 条业务路由。老 PostgreSQL 库用 `npm run upgrade:postgres` 先备份再新增表；不在正式启动时自动改表。功能对照与演示见 `ACCEPTANCE_AND_DEMO.md`，本轮验证见 AUDIT_LOG 第 17 节。旧文中的论坛示例及早期测试数量不代表当前状态。

> 最新执行入口：`npm run start:release` 为 PostgreSQL + 构建页面的本地部署入口（8080）；`npm run start:postgres` 为 PostgreSQL 开发入口；`npm start` 仍是 SQLite 开发入口。私密数据在 `.local/`，不是缓存，禁止删除或提交。验收用 `npm run build:release` 后 `npm run test:postgres`；备份/恢复命令见根 README。后端版本需 `364e556` 或更新，最新证据见 AUDIT_LOG 第 16 节。

> 2026-10-28：项目现位于 `D:\CodexProject\CampusLink`。前端分支 `work/phase1`，后端独立目录 `backend/`、分支 `work/integration`；均已有原始版本标签 `handoff-20261028`。已完成真实交易联调，启动用 `npm start`，类型检查用 `npm run typecheck`，浏览器验收用 `npm run test:e2e`（自动隔离数据库与端口）。后端需本地提交 `11a5e38` 或更新版本，远程旧 main 未包含上传接口。下文旧路径、缺页、无 Git 及仅 Mock 等描述属于历史记录，执行任务前以根目录 README 和 AUDIT_LOG 第 15 节为准。禁止将 `backend/.git` 或后端源码作为前端提交的一部分。

> 目标读者：接手下一步研发的**小组成员**，以及他们驱动的 **AI agent**
> 前提：已读完 `PROJECT_CHARTER.md` 与 `UI_GAP_ANALYSIS.md`
> 用法：把本文件整份作为 agent 的初始上下文，即可让 agent 独立开工而不跑偏

---

## 0. 30 秒开工

```powershell
# 1) 进入项目
cd "C:\Users\Fate永恒\Desktop\UI"

# 2) 装依赖（首次）
npm install

# 3) 起开发服务器（按需）
npm run dev            # → http://localhost:5173

# 4) 生产构建自检（改动后必跑）
npm run build          # 必须 exit 0

# 5) 类型检查（当前只覆盖 .ts，见 §6 已知坑）
.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.json
```

**零安装演示**：双击 `双击直接预览(免装环境).bat`（走 `scripts/server.ps1`，无需 Node）。

---

## 1. 项目心智模型（agent 必须建立的四条认知）

1. **这是原型，不是产品。** 所有数据来自 `src/mock/index.ts`（17 条），刷新即重置。
2. **API 层是「已写好但未接线」的死代码。** `src/api/{request,auth,product}.ts` 函数签名齐全、契约正确，但**没有任何视图 import 它**。接线是本阶段最核心的工程任务。
3. **视觉已完成，逻辑未完成。** 不要重画页面，要补「状态」与「行为」。详情页/论坛/个人中心里的 `showToast(...)` 全是待替换的假交互。
4. **`UI/` 同时是设计交付物和前端代码库。** 改代码前先确认改的是逻辑还是视觉：视觉改动必须同步 `docs/` 里的设计说明。

---

## 2. 目录约定（新文件必须放对位置）

```
src/
├── api/            接口函数。新增业务接口放这里，一模块一文件
├── components/
│   ├── common/     跨页面通用：AppToast、AppModal、EmptyState、ErrorState、Skeleton…
│   ├── home/       仅首页用
│   ├── product/    商品域通用（ProductCard…）
│   └── forum/      论坛域通用（ForumPostCard…）
├── views/          一个路由一个页面，命名 PascalCase.vue
├── stores/         ⚠️ 待建：Pinia store，首建 user.ts
├── mock/           假数据。新增实体请同步 types/index.ts
├── router/         index.ts 统一注册；新增页面必须写 meta.title 与 meta.showNav
├── styles/         variables.css（Token）/ main.css（全局重置）
└── types/          index.ts 全局类型
```

**命名规则**：组件 `PascalCase.vue`；组合式函数 `useXxx.ts`；类型 `PascalCase`；CSS 类名 `kebab-case`。

---

## 3. 代码规范（可机器校验的硬规则）

### 3.1 必须

| 规则 | 原因 |
| :--- | :--- |
| 所有 `<script>` 用 `<script setup lang="ts">` | 全项目统一 |
| 颜色**只**用 CSS 变量：`var(--color-*)` | 现有 186 处硬编码是历史债，**禁止新增** |
| 间距优先 `var(--space-*)`，圆角 `var(--radius-*)` | Token 制度 |
| 页面根元素加 `padding-bottom: 76px` | 为 58px 底部导航留位（见 `Home.vue`） |
| 新路由必须写 `meta: { title, showNav }` | `App.vue` 靠它决定导航栏显隐 |
| 图片必须带 `alt`，功能性图标按钮必须带 `aria-label` | 无障碍基线 |
| 交互元素命中区 ≥ 44 × 44px | 移动端基线 |

### 3.2 禁止

- ❌ 引入 Element Plus / Vant / Ant Design 等 UI 库（项目刻意零依赖，见技术报告 §3.1）
- ❌ 在组件里直接 `import { mockProducts } from '../mock'`（**这是当前最大的技术债**，请改成走 `api/`）
- ❌ 用 `alert()` / `confirm()`（用统一的 `AppToast` / `AppModal`）
- ❌ 改 `variables.css` 里既有 Token 的值（会全局变色；新增 Token 可以）
- ❌ 提交 `node_modules/`、`dist/`、`*.zip`
- ❌ 直接改 `resource/*.docx`（原始需求输入，只读）

---

## 4. 任务模板（直接复制给 agent）

### 模板 A：抽公共 Toast（最适合第一个上手）

```
在 C:\Users\Fate永恒\Desktop\UI 中：
1. 新建 src/components/common/AppToast.vue，对外暴露 show(message, options?) 方法，
   支持 type: 'info' | 'success' | 'error'，默认 2200ms 自动消失，
   样式沿用现有 .prototype-toast（深色胶囊、bottom:85px、居中、z-index:300、backdrop-filter）。
2. 用 defineExpose 暴露方法，并在 App.vue 中全局挂载一次。
3. 删除 Home.vue / IdleMarket.vue / ForumList.vue / ProductDetail.vue / PostDetail.vue / Profile.vue
   六个文件里各自的 toastMessage ref、showToast 函数与 .prototype-toast 样式，改为调用新组件。
4. 验收：npm run build 退出码 0；六个页面原有提示行为不变；
   grep "prototype-toast" 在 src 下只应剩 AppToast.vue 一处。
```

### 模板 B：接 Pinia + 用户态

```
在 C:\Users\Fate永恒\Desktop\UI 中：
1. npm install pinia，在 src/main.ts 注册。
2. 新建 src/stores/user.ts：state { token, profile }，getters isLoggedIn，
   actions login/logout/restore（从 localStorage 'token' 恢复）。
3. 新建 src/api/auth.ts 已有 login/register 函数，确认签名后接入 store。
4. 修改 src/api/request.ts：遇 401 时清 token 并跳 /login（当前只 console.warn）。
5. 在 src/router/index.ts 增加全局前置守卫：访问 /profile 未登录则跳 /login。
6. 验收：npm run build 通过；手写 token 进 localStorage 后刷新，isLoggedIn 为 true。
```

### 模板 C：补两页（登录/注册 + 发布商品）

```
在 C:\Users\Fate永恒\Desktop\UI 中，新增两个页面（设计规格见 docs/UI_GAP_ANALYSIS.md §2.1）：
1. src/views/Login.vue → 路由 /login，含用户名/密码/显示密码/登录按钮/去注册。
2. src/views/Register.vue → 路由 /register，含用户名/邮箱/密码/确认密码/协议勾选。
3. src/views/PublishProduct.vue → 路由 /publish，含 title/description/price/category/
   image/location/成色 七字段 + 吸底"立即发布"按钮。
要求：
- 复用 variables.css Token，不新增硬编码色值
- 必须有行内校验错误提示（不是 Toast）
- 提交中按钮显示 loading 且禁用
- 发布成功后跳转 /idle 并 AppToast 提示
- 页面根元素 padding-bottom: 76px
验收：npm run build 通过；三页路由可直达；空表单提交被拦截。
```

### 模板 D：补状态 UI

```
在 C:\Users\Fate永恒\Desktop\UI 中：
1. 新建 src/components/common/EmptyState.vue（插画/图标 + 主文案 + 可选行动按钮）
2. 新建 src/components/common/ErrorState.vue（错误图标 + 文案 + "重试"按钮）
3. 新建 src/components/common/SkeletonCard.vue（商品卡片骨架，shimmer 动画）
4. 在 IdleMarket.vue 与 ForumList.vue 接入三态：loading / error / empty。
5. 验收：把 VITE_API_BASE_URL 指向一个不存在的端口，闲置页应显示 ErrorState
   并可点"重试"，不得白屏。
```

---

## 5. 验收清单（每次提交前逐项打勾）

- [ ] `npm run build` 退出码 0，无新增 warning
- [ ] `tsc --noEmit` 退出码 0
- [ ] 新增颜色 0 处硬编码（`grep -c "#[0-9A-Fa-f]\{6\}" 新文件` 应为 0）
- [ ] 新页面在 390px / 375px / 414px 三档无横向滚动
- [ ] 新页面底部不被导航栏遮挡
- [ ] 新增交互元素点击热区 ≥ 44px
- [ ] 图片有 `alt`，图标按钮有 `aria-label`
- [ ] 浏览器 Console 0 报错（可用 `scripts/take_screenshots.js` 巡检）
- [ ] 路由 meta.title / showNav 已填
- [ ] 未提交 `node_modules` / `dist` / `*.zip`

---

## 6. 已知坑（血泪清单，agent 必读）

| # | 坑 | 现象 | 绕过方式 |
| :-: | :--- | :--- | :--- |
| 1 | **项目没有自己的 git 仓库** | 在 `UI/` 里跑 `git status` 会列出你整个用户目录（`.android`、`.cache`…），因为 git 锚定在 `C:/Users/Fate永恒` | 先按 `docs/AUDIT_LOG.md` §4 的清单在 `UI/` 内 `git init` + 写 `.gitignore` |
| 2 | **`.vue` 不做类型检查** | `tsc --noEmit` 显示通过，但实际只查了 8 个 `.ts`；`vue-tsc` 未安装 | 装 `vue-tsc`：`npm i -D vue-tsc`，加 script `"typecheck": "vue-tsc --noEmit"` |
| 3 | **PowerShell 控制台中文乱码** | `Get-Content Home.vue` 显示「绂忓府甯?」 | 文件本身是正常 UTF-8，**只是控制台编码问题**。读文件用编辑器/read 工具，勿「修复」成 GBK |
| 4 | **`npm run build` 会覆写 `dist/`** | `福帮帮-免安装即用体验包.zip` 依赖 `dist/` | 构建后需重新打包体验包，否则交付包与源码不一致 |
| 5 | **未配 `server.proxy`** | 联调时前端 5173 → 后端 8000 必撞 CORS | 在 `vite.config.ts` 加 `server.proxy`，或让后端开 `CORSMiddleware` |
| 6 | **`user-scalable=no`** | `index.html:5` 禁止用户缩放，无障碍不合规 | 改前先确认产品意图；答辩前建议放开 |
| 7 | **mock 数据只有 17 条** | 列表看起来「刚好」满，容易误判分页无需求 | 长列表能力需自带分页/虚拟滚动 |
| 8 | **`dist/` 与源码可能不同步** | 交付包里的 JS 可能是旧构建 | 以 `npm run build` 为准 |
| 9 | **`.ps1` 必须带 UTF-8 BOM** | 无 BOM 时 `powershell.exe`（5.1）按 GBK 读取，中文注释会让脚本语法解析失败。`scripts/server.ps1` 曾因此让整个免安装体验包无法运行（已修复） | 新建/修改 `.ps1` 后保存为 **UTF-8 with BOM**，并实跑一次 |

---

## 7. 联调准备（后端起来之后）

1. 建 `.env`（模板见根目录 `.env.example`）：
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
2. `vite.config.ts` 加代理（推荐，可绕过 CORS）：
   ```ts
   server: { port: 5173, host: '0.0.0.0',
     proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } }
   ```
3. 把 6 个 view 里的 `import { mockProducts } from '../mock'` 换成 `api/product.ts` 的调用。
4. 后端 `uvicorn src.main:app --reload`，按 `PROJECT_CHARTER.md` §5 逐条对接口。
5. 联调顺序：注册 → 登录 → 商品列表 → 搜索 → 详情 → 发布 → 改状态（即 Phase 1 验收链路）。

---

## 8. 交给 agent 的启动 prompt（可直接复用）

```
你是「福帮帮（CampusLink）」前端项目的开发 agent。
项目根目录：C:\Users\Fate永恒\Desktop\UI
技术栈：Vue 3 + TypeScript + Vite，零 UI 库，移动端 390px 基准。

开工前必须先完整阅读：
1. docs/PROJECT_CHARTER.md       — 项目是什么、边界在哪
2. docs/UI_GAP_ANALYSIS.md       — 还缺什么、优先级
3. docs/AGENT_ONBOARDING.md      — 本文件：约定、禁止事项、坑

铁律：
- 只改 src/ 下与任务相关的文件，不重构无关代码
- 颜色只用 var(--color-*)，禁止新增硬编码 hex
- 禁止引入任何 UI 组件库
- 每完成一个任务必须跑 npm run build 并贴出退出码
- 不确定的设计问题，先写进文档提问，不要自己发明规范

当前推荐任务：<从第 4 节模板 A/B/C/D 中选一个>
```

---

## 9. 文档维护约定

| 改了什么 | 必须同步更新 |
| :--- | :--- |
| 新增/删除页面 | `PROJECT_CHARTER.md` §3.4 路由清单 + `UI_GAP_ANALYSIS.md` 覆盖度表 |
| 新增 Token | `variables.css` 注释 + `PROJECT_CHARTER.md` §4.2 |
| 新增组件 | `UI_GAP_ANALYSIS.md` §7 组件库完整度 |
| 接口变更 | `PROJECT_CHARTER.md` §5 + 后端 `Backend/docs/API.md` |
| 完成一个 P0/P1 项 | `UI_GAP_ANALYSIS.md` 对应行状态 |

> 文档与代码不同步，比没有文档更糟。改代码时顺手改这三份 docs。
