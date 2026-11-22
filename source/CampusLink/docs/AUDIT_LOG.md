# 审计日志 · 证据留痕

> 记录本报告全部结论的**原始命令与输出**，便于任何人复现验证。
> 执行时间：2026-10-21　执行环境：Windows / Node v24.21.0 / Vite 6.4.4
> 原则：**只记录真实执行过的命令；未执行的一律标注「未执行」**

---

## 1. 生产构建实测

**命令**
```powershell
cd "C:\Users\Fate永恒\Desktop\UI"
.\node_modules\.bin\vite.cmd build
```

**结果**：退出码 `0`，耗时 `2.53s`（wall clock 5.05s，含进程启动），73 modules transformed。

**产物（37 个文件，合计 1070.1 KB）**

| 产物 | 体积 | gzip |
| :--- | ---: | ---: |
| `index-BSjNjxGy.js`（核心） | **110.66 kB** | **43.26 kB** |
| `Home-DETuyJpB.js` | 13.78 kB | 4.70 kB |
| `index-xBtKJDfG.js` | 6.42 kB | 3.15 kB |
| `PostDetail-DdSRtM2j.js` | 5.39 kB | 2.61 kB |
| `ProductDetail-C4HrVFKG.js` | 5.35 kB | 2.50 kB |
| `Profile-CrTetrGh.js` | 5.17 kB | 1.68 kB |
| `IdleMarket-CVyjoo_P.js` | 2.75 kB | 1.51 kB |
| `ForumList-BpfNi22V.js` | 2.36 kB | 1.39 kB |
| `ForumPostCard-CYqoH9Xl.js` | 1.60 kB | 0.83 kB |
| `ProductCard-CBy3JUmg.js` | 1.58 kB | 0.85 kB |
| `Home-BnyUvjQc.css` | 11.63 kB | 2.82 kB |
| `index-CzpunzpN.css` | 5.83 kB | 1.99 kB |
| `index.html` | 0.86 kB | 0.51 kB |

> ⚠️ 本次构建**已覆写 `dist/`**。

### 1.1 与团队自述的比对

| 指标 | 自述（技术报告 §6.2） | 实测 | 结论 |
| :--- | :--- | :--- | :--- |
| 核心 JS `index-BSjNjxGy.js` | 46.21 kB / gzip 15.38 kB | **110.66 kB / gzip 43.26 kB** | ❌ **不符，差 2.4 倍** |
| `Home-DETuyJpB.js` | 10.74 kB | 13.78 kB | ❌ 不符 |
| `IdleMarket-CVyjoo_P.js` | 6.12 kB | 2.75 kB | ❌ 不符 |
| `ForumList-BpfNi22V.js` | 4.89 kB | 2.36 kB | ❌ 不符 |
| `ProductDetail-C4HrVFKG.js` | 9.81 kB | 5.35 kB | ❌ 不符 |
| 产物总体积 | 425 KB | **1070.1 KB** | ❌ 不符，差 2.5 倍 |
| 构建耗时 | 1.1 秒 | 2.53 秒 | 🟡 接近但偏慢 |
| 构建报错/警告 | 0 / 0 | 0 / 0 | ✅ 一致 |

> 说明：文件名哈希（如 `index-BSjNjxGy.js`）与自述完全一致，但体积相差 2.4 倍。内容哈希相同的文件体积不可能不同，故**技术报告 §6.2 的体积表不可信**——疑为手工填写或取自更早版本。**结论：构建本身健康，但报告数字需要更正。**

---

## 2. TypeScript 类型检查实测

**命令**
```powershell
cd "C:\Users\Fate永恒\Desktop\UI"
.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.json
```
**结果**：退出码 `0`，无任何输出（通过）。

**但必须看「到底检查了什么」**：
```powershell
.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.json --listFiles
```
实际被检查的 `src/` 文件（共 **8 个**）：

```
src/router/index.ts
src/main.ts
src/vite-env.d.ts
src/api/request.ts
src/api/auth.ts
src/types/index.ts
src/mock/index.ts
src/api/product.ts
```

其中 `.vue` 文件命中数：**0**。`node_modules/.bin` 下**不存在 `vue-tsc`**（`Test-Path node_modules\vue-tsc` → `False`）。

### 结论

`tsconfig.json` 的 `include` 写了 `"src/**/*.vue"`，但原生 `tsc` 无法解析 `.vue` 单文件组件，会**静默跳过**。因此：

- ✅ 8 个 `.ts`（493 行）**确实**通过 `strict` + `noUnusedLocals` 检查
- ❌ **15 个 `.vue`（4,144 行）从未被类型检查**
- ❌ 技术报告「TypeScript 5.7 全面强类型推导」「100% 覆盖核心实体」的表述**在 UI 层不成立**

**代码行数实测**
```
vue files=15  lines=4144
ts  files=8   lines=493
views=6
mock 条目=17
```

---

## 3. 开发服务器实测

```powershell
.\node_modules\.bin\vite.cmd --port 5199 --strictPort
```
输出：
```
VITE v6.4.4  ready in 611 ms
➜  Local:   http://localhost:5199/
```

HTTP 校验：
```powershell
Invoke-WebRequest -Uri "http://localhost:5199/" -UseBasicParsing
# STATUS=200  LEN=815
```
返回内容含 `<div id="app"></div>` 与 `/@vite/client`，**dev server 正常**。验证后已关闭该后台进程。

> 控制台中标题显示为乱码（`ç¦å¸®å¸®`）是 `Invoke-WebRequest` 按 ISO-8859-1 解码所致；源文件 `index.html:6` 为正常 UTF-8「福帮帮 - 福州大学校园互助平台」，**非缺陷**。

---

## 4. Git 与工程卫生实测

```powershell
cd "C:\Users\Fate永恒\Desktop\UI"
git rev-parse --show-toplevel   # → C:/Users/Fate永恒
git rev-parse --git-dir         # → C:/Users/Fate永恒/.git
git remote -v                   # → （空）
git rev-list --count HEAD       # → fatal: ambiguous argument 'HEAD'
Test-Path .gitignore            # → False
```

### 结论

| 项 | 状态 |
| :--- | :--- |
| `UI/` 有独立仓库 | ❌ **没有**，git 锚定在用户主目录 |
| 有提交历史 | ❌ 无（HEAD 不存在，零提交） |
| 有远程仓库 | ❌ 无（`README.docx` §4.2 要求 `git@github.com:Aurowisp/Frontend.git`） |
| 有 `.gitignore` | ❌ 无 |

**后果**：当前 `UI/` 下任何文件**都不在版本控制中**；若在主目录执行 `git add .`，会把 `.android`、`.cache`、`.cargo`、`.dsh` 等数十个无关目录一并纳入。这是**最严重、且修复成本最低**的交接阻塞点。

### 建议的修复命令（**尚未执行**，需团队决策后由负责人执行）

```powershell
cd "C:\Users\Fate永恒\Desktop\UI"
git init
git add .
git commit -m "chore: init frontend repo from UI handoff"
git remote add origin git@github.com:Aurowisp/Frontend.git
git branch -M main
git push -u origin main
```
> 前提：`.gitignore` 已就位（本次已创建），否则 `node_modules/`（数万文件）会被提交。

---

## 5. 缺失的工程规范文件

```powershell
@('.env.example','.env','README.md','.gitignore','LICENSE','CONTRIBUTING.md',
  'CHANGELOG.md','.eslintrc.cjs','eslint.config.js','.prettierrc','.editorconfig','tests')
| ForEach-Object { "{0,-22} {1}" -f $_, (Test-Path $_) }
```

**全部为 `False`**（审计时刻）。即：无 `README.md`、无 `.env.example`、无 `.gitignore`、无 LICENSE、无 ESLint/Prettier、无 `.editorconfig`、无 `tests/`。

**package.json scripts 实测**
```json
{ "dev": "vite", "build": "vite build", "preview": "vite preview" }
```
无 `lint` / `typecheck` / `test`。

**运行依赖实测**
```json
{ "vue": "^3.5.13", "vue-router": "^4.5.0" }
```
**无 Pinia**（`README.docx` §4.2 要求存在 `stores/user.ts`）。

---

## 6. 「规格要求 vs 实际存在」对照

| README §4.2 要求的文件 | 实际 | 结论 |
| :--- | :--- | :--- |
| `src/api/{request,auth,product}.ts` | ✅ 存在 | 符合 |
| `src/components/ProductCard.vue` | ✅ 存在（在 `product/` 下） | 符合（路径不同） |
| `src/components/SearchBar.vue` | ✅ 存在（在 `common/` 下） | 符合（路径不同） |
| `src/views/Login.vue` | ❌ 缺失 | **缺口** |
| `src/views/Register.vue` | ❌ 缺失 | **缺口** |
| `src/views/Home.vue` | ✅ | 符合 |
| `src/views/ProductList.vue` | 🟡 实际命名 `IdleMarket.vue` | 命名不一致 |
| `src/views/ProductDetail.vue` | ✅ | 符合 |
| `src/views/PublishProduct.vue` | ❌ 缺失 | **缺口** |
| `src/views/Profile.vue` | ✅ | 符合 |
| `src/stores/user.ts` | ❌ 缺失（且无 Pinia） | **缺口** |
| `.env.example` | ❌ 缺失 | **缺口** |
| `tests/` | ❌ 缺失 | **缺口** |

---

## 7. 架构断裂证据：API 层未被引用

### 7.1 谁 import 了 `src/api/*`？

```powershell
Get-ChildItem src -Recurse -File |
  Select-String -Pattern "api/(request|auth|product)|from '\.\./api|from '\./api"
```
**唯一命中**：
```
IdleMarket.vue:121: toastMessage.value = '💡 发布闲置原型：Phase 1 规范中支持对接 POST /api/products 接口';
```
——这只是一句**字符串文案**，不是 import。

对应 grep（`*.vue`，pattern `from '\.\./api|getProductList|createProduct|login|register`）结果：**No matches found**。

### 7.2 数据实际来源

```powershell
Select-String -Path (Get-ChildItem src -Recurse -Include *.vue).FullName -Pattern 'from ''\.\./mock'''
```
6 个 view 全部直接引用 mock：`Home.vue`、`IdleMarket.vue`、`ForumList.vue`、`ProductDetail.vue`、`PostDetail.vue`、`Profile.vue`。

### 结论

`src/api/`（3 文件 / 147 行）是**完全未被调用的死代码**。「契约优先 + 异常静默降级」在架构描述上成立，在**运行时不存在**——因为没有任何调用路径。技术报告 §4.3 的降级机制描述需标注为「设计就绪，未接线」。

---

## 8. 交互假闭环统计（Toast 代替真实交互）

```powershell
grep -c "showToast\(|toastMessage.value = |handleActionTip\(|handlePublishTip\("
```

| 文件 | 原型提示次数 | 具体位置 |
| :--- | :-: | :--- |
| `Profile.vue` | 8 | 第 17/22/27/32/43/57/76/91 行（4 统计 + 4 菜单） |
| `PostDetail.vue` | 4 | 174 复制 / 180 点赞 / 185 关注 / 200 评论 |
| `ProductDetail.vue` | 4 | 146 收藏 / 150 分享 / 154 联系卖家 / 158 预订 |
| `Home.vue` | 1 | 207 扫一扫 |
| `ForumList.vue` | 1 | 95 发帖 |
| `IdleMarket.vue` | 1 | 121 发布 |
| **合计** | **19** | — |

### 8.1 Toast 组件重复实现

```powershell
Select-String -Pattern '\.prototype-toast\s*\{' -Path *.vue  # 6 个文件各自实现
Select-String -Pattern 'const toastMessage = ref'            # 6 个文件各自声明
```
命中文件（完全一致）：`ForumList.vue`、`Home.vue`、`IdleMarket.vue`、`PostDetail.vue`、`ProductDetail.vue`、`Profile.vue`。

**同一份 Toast 实现被复制 6 次**（含 `ref` 状态、`setTimeout` 逻辑、`<Teleport>` 结构、scoped CSS、过渡动画）。

---

## 9. 硬编码色值统计

```powershell
Get-ChildItem src -Recurse -Include *.vue,*.ts -File | ForEach-Object {
  $c = Get-Content $_.FullName -Raw
  [pscustomobject]@{ File=$_.Name; Hex=([regex]::Matches($c,'#[0-9A-Fa-f]{3,8}\b')).Count }
}
```

| 文件 | 硬编码 hex | 总行数 |
| :--- | :-: | :-: |
| `PostDetail.vue` | 38 | 542 |
| `ProductDetail.vue` | 28 | 479 |
| `Profile.vue` | 26 | 351 |
| `Home.vue` | 20 | 497 |
| `IdleMarket.vue` | 16 | 322 |
| `ForumList.vue` | 13 | 251 |
| `AppHeader.vue` | 11 | 261 |
| `ForumPostCard.vue` | 11 | 233 |
| `ProductCard.vue` | 8 | 241 |
| `FeatureEntryCard.vue` | 7 | 145 |
| `App.vue` | 4 | 148 |
| `SearchBar.vue` | 3 | 230 |
| `ForumSection.vue` | 3 | 131 |
| `ProductSection.vue` | 3 | 148 |
| `BottomNavigation.vue` | 2 | 184 |
| **8 个 `.ts` 文件** | **0** | 493 |
| **合计** | **≈186–193** | 4,637 |

### 9.1 典型失效案例

`src/styles/variables.css:19-22` 已定义：
```css
--color-tag-blue-bg: #E8F4FD;
--color-tag-blue-text: #2563EB;
--color-tag-green-bg: #EAF9EC;
--color-tag-green-text: #16A34A;
```
但同值硬编码仍出现在：
- `ForumPostCard.vue:161-167`（`#E8F4FD` / `#2563EB` / `#EAF9EC` / `#16A34A`）
- `PostDetail.vue:269-275`（同样四个值再来一遍）

另：`ProductDetail.vue:218` 写死 `background-color: #000;`。

**结论**：设计 Token 体系**存在但未被真正采纳**。这比没有 Token 更危险——它让评审者误以为规范已落地。

---

## 10. 状态 UI 缺失证据

```powershell
grep -E "loading|Loading|skeleton|try\s*\{|catch\s*\(" --include=*.vue src/
```
在 `.vue` 文件中命中：**0 处**（无 loading 态、无骨架屏、无任何 try/catch）。

空状态：仅 `IdleMarket.vue:58-62` 有一处 emoji 空态（`📦 暂无该分类下的闲置商品`），且该空态由 **mock 过滤**触发，不是网络返回。

---

## 11. 无障碍抽检

```powershell
grep -E "aria-|role=|alt=|focus-visible|tabindex" --include=*.vue src/
```
命中 **18 处**，构成：
- `alt=`：9 处（多为商品图/头像，✅ 良好）
- `aria-label=`：4 处（`SearchBar.vue:35` 清空、`PostDetail.vue:5` 返回、`ProductDetail.vue:5` 返回，及 1 处）
- `focus-visible` / `tabindex` / `role`：**0 处**
- 键盘可达性：无法证实存在（全部依赖 `@click`，无 `@keydown` 处理）

**缩放被禁用**：`index.html:5`
```html
<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
`user-scalable=no` 违反 WCAG 1.4.4（文本可缩放至 200%）。移动端无障碍审查会直接扣分。

**触控热区抽检（按 CSS 声明推算）**

| 元素 | CSS | 估算高度 | 44px 基线 |
| :--- | :--- | :-: | :-: |
| `App.vue` `.switch-btn` | `padding: 5px 12px; font-size: 11.5px` | ≈ 24–26px | ❌ 不足 |
| `Home.vue` `.hot-tag` / `.history-item` | `padding: 5px 12px; font-size: 12px` | ≈ 24–25px | ❌ 不足 |
| `SearchBar.vue` 清空按钮 | 见 `SearchBar.vue:35` 区域 | 未实测 | ⚠️ 待核 |

> 说明：以上为按 CSS 规则推算，**未做像素级实测**（未截图测量）。标注为「待核」。

---

## 12. 交付包核对

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::OpenRead(...)
```

| 包 | 条目数 | 内容 | 结论 |
| :--- | :-: | :--- | :--- |
| `福帮帮-免安装即用体验包(推荐发给老师同学双击即看).zip` | 39 | `dist/*`（37）+ `双击直接预览(免装环境).bat` + `scripts/server.ps1` | ⚠️→✅ 原包因脚本编码问题**不可运行**，已用修复后脚本重新打包（958.1 KB） |
| `福帮帮-完整前端源码开发包(供前端开发继续写代码).zip` | 108 | 源码 + **`screenshot_*.png`（7 张）+ `test_hide_*.png`（3 张）等杂物** | ⚠️ **混入交付截图**，交付前应剔除 |

### 12.1 ⚠️ 重大缺陷：免安装预览包曾完全无法运行（已修复）

**初步审阅结论「质量合格」是错误的**，实跑后推翻如下。

**复现命令**
```powershell
cd "C:\Users\Fate永恒\Desktop\UI"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\server.ps1"
```

**实测输出**
```
At ...\scripts\server.ps1:67 char:76
+ ...        default { $response.ContentType = "application/octet-stream" }
The string is missing the terminator: ".
    + FullyQualifiedErrorId : TerminatorExpectedAtEndOfString
按任意键继续... (exit 1)
```

**根因**：`scripts/server.ps1` 保存为 **UTF-8 无 BOM**（首字节 `24 70 6F`，即 `$po`）。`双击直接预览(免装环境).bat` 调用的是 `powershell`（Windows PowerShell 5.1，非 PowerShell 7），在中文 Windows 上按 **GBK(cp936)** 读取无 BOM 脚本 → 脚本内中文注释/字符串被错误解码 → 引号配对被破坏 → 语法解析失败。

**影响面**：
- `双击直接预览(免装环境).bat` → **必定失败**（exit 1）
- `福帮帮-免安装即用体验包(推荐发给老师同学双击即看).zip` → **同样必定失败**——而这是**明确推荐发给老师同学**的交付物

**修复**：为 `scripts/server.ps1` 补 UTF-8 BOM（`EF BB BF`），内容零改动，3,100 → 3,103 字节。

**修复后验证**
```powershell
# 1) 解析通过
PARSE_OK
# 2) 服务启动横幅正常
福帮帮 (CampusLink) 前端本地预览服务已启动!
访问地址: http://localhost:5173/
# 3) 路由探测
/                          200   857 bytes
/profile                   200   857 bytes   ← SPA fallback ✅
/forum/1                   200   857 bytes   ← 深链路 fallback ✅
/assets/index-BSjNjxGy.js  200   110664 bytes
/favicon.svg               200   226 bytes
/nope.png                  404              ← 带扩展名不误回退 ✅
```

**结论**：修复后 `server.ps1` 逻辑正确（SPA fallback、端口递增、MIME 映射、`finally` 清理均无问题）；**修复前该包不可用**。`福帮帮-免安装即用体验包(...).zip` 已用修复后的脚本重新打包（39 项，958.1 KB）。

> **教训**：Windows 下的 `.ps1` 若要被 `powershell.exe`（5.1）调用，**必须存为 UTF-8 with BOM**，否则任何中文字符都会导致解析失败。审阅脚本时不能只看逻辑，必须实跑。

**未执行**：`scripts/take_screenshots.js` 实跑（依赖 `puppeteer-core` + 系统 Edge，未在本次审计中执行）。因此技术报告「Console errors count: 0」的结论**本轮未能独立复现**，标注为「未经独立验证」。

---

## 13. 未能核实清单

| 项 | 原因 |
| :--- | :--- |
| Console 0 报错 | 未运行 `take_screenshots.js`（需 Edge + puppeteer 实跑） |
| 真机 375/414/430 适配 | 未做多视口实机/截图比对 |
| 触控热区精确像素 | 仅按 CSS 推算，未测量渲染结果 |
| 对比度是否达标 | 未做色值对比度计算 |
| 后端接口是否真的可用 | 后端未启动，未联调 |
| SRS 文档、类图、PPT、博客 | 不在本仓库范围内（属其他交付物） |

---

## 附：复现环境

| 项 | 值 |
| :--- | :--- |
| OS | Windows（中文） |
| Node | v24.21.0 |
| Vite | 6.4.4 |
| TypeScript | 5.7.x（`node_modules/.bin/tsc` 可用） |
| 包管理 | npm（`node_modules/` 已预装，未重装） |
| 构建命令 | `.\node_modules\.bin\vite.cmd build` |

---

## 14. 2026-10-28 接手验证与 Git 基线

本节为本次工作区的实测结果；前面各节保留历史记录，不能据旧进度判定当前完成情况。

### Git 与文件保护

- 工作区：`D:\CodexProject\CampusLink`。前端在 `work/phase1` 分支开发，远程关联 `https://github.com/Aurowisp/Frontend.git`。
- 原始交接源码提交为 `2bc546d`，标签 `handoff-20261028`；完整交接文件备份为 `.handoff-backups/handoff-original-20261028-190550.zip`。
- 后端为 `backend/` 独立克隆，原始提交 `63f82d8`，同样保留 `handoff-20261028` 标签；后续使用 `work/integration` 分支。
- 后端验证配置提交为 `54a10c7`：测试启动强制使用独立 SQLite，禁用开发库建表及种子写入；新增 `requirements.lock.txt` 记录本次验证环境。
- 前端 `.gitignore` 排除独立后端目录、环境文件、依赖、缓存、数据库及备份；不提交真实凭证。
- 前端最初是无 Git 的文件夹，交接基线与远程旧版是独立历史。已比较二者：远程为 `9010f39`（6 页旧原型），交接包包含新增三页和文档。使用保留交接源码树的合并提交接合历史，以便后续正常比较及提交 PR；原始历史仍可从标签与父提交找回。
- 本次只创建本地提交和读取远程，未向远程推送、合并 PR 或部署。

### 前端验证

环境：Node `24.16.0`、npm `11.13.0`、Vite `6.4.4`。

| 检查 | 本次结果 |
| --- | --- |
| `npm ci --cache .cache/npm --no-fund --no-audit` | 通过 |
| 安装 `vue-tsc` 并加入 `npm run typecheck` | 已完成 |
| `npm run typecheck` | 退出码 0 |
| `npm run build -- --outDir .cache/build-baseline` | 退出码 0，87 个模块，保留原 `dist/` |

### 后端验证

Python `3.12.10`，依赖安装在 `backend/.venv/`，精确版本见后端 `requirements.lock.txt`。

测试命令（在 `backend/` 执行）：

```powershell
.\.venv\Scripts\python.exe -m pytest --basetemp 'D:\CodexProject\CampusLink\.cache\pytest-backend-20261028-2' -ra
```

结果：**8 passed，1 条 Starlette TestClient/httpx 兼容弃用警告**。该警告没有导致测试失败；后续依赖升级时需处理，不能把当前结果视为全功能覆盖。

测试覆盖当前已有的注册登录、重复账号与错误密码、参数校验、商品 CRUD、写权限及所有权、收藏、联系方式、交易接受和健康检查。尚未覆盖所有交易竞争及异常路径。

以工作区内 SQLite 数据库启动真实 Uvicorn 服务，并进行只读 HTTP 探测：

| 路径 | 结果 |
| --- | --- |
| `/api/health` | HTTP 200，数据库 connected |
| `/api/products` | HTTP 200，6 条后端种子商品 |
| `/docs`、`/openapi.json` | HTTP 200，OpenAPI 有 14 个路径 |
| `/api/users/me`（无登录） | HTTP 401 |
| `/api/products/999999999` | HTTP 404 |
| Origin `http://localhost:5173` | CORS 返回对应允许来源 |

### 未完成与下一步

1. 先修复前端失败后伪成功的登录、注册、发布行为，并接入真实登录态。
2. 商品列表、搜索、详情改为真实 API；补齐加载、失败、空状态和重试。
3. 对接我的发布、商品编辑与状态管理、收藏和交易请求。
4. 确认并实现图片上传存储；论坛暂按原型展示，不能冒充已有真实服务。
5. 补浏览器端验收、PostgreSQL 验证和部署交付。当前只验证 SQLite，没有完成前后端端到端联调。

---

## 15. 2026-10-28 真实交易流程联调验收

第 14 节“未完成”列表是本轮开始前的基线；本节记录本轮结果。当前仍不代表课程全部交付或正式部署完成。

### 完成的功能与行为

- Pinia 管理真实用户，刷新后请求 `/users/me` 恢复身份；受保护页面要求登录，过期身份清理后返回登录页。
- 注册按后端契约提交用户名、邮箱、密码，删除模拟短信验证码及凭空拼接邮箱的行为。
- 登录、注册、发布及商品查询失败时显示真实错误，不再生成模拟 JWT、写入 Mock 或替换为第一件商品。
- 首页、商品列表、搜索分类、分页加载、详情接入 API；列表价格排序明确作用于已加载内容。
- 封面经登录用户上传、服务端校验和重新编码后存盘，再将返回 URL 写入商品；刷新后可重新读取。
- 发布与编辑共享视图；本机草稿按用户隔离，保存已上传封面 URL，不依赖临时 blob URL。
- 新增我的发布、我的收藏、我的交易、个人资料。商品支持编辑、状态变更及确认删除；联系方式、收藏和交易请求使用真实接口。
- 同一商品接受第二位买家的请求返回 409；取消未接受的请求不会解除其他买家的预约。状态更新使用条件更新并在冲突时回滚。
- 已接受交易期间，不允许通过商品接口绕过交易流程直接重新上架或标记已售。
- 论坛通过 `api/forum.ts` 使用保留的示例内容，页面有明确演示标识。
- 新增 RequestState、AppDialog 与共享账号页面样式，375/390/440px 使用实际设备宽度；桌面保留 440×956 预览。
- Vite 忽略 `.cache/`、后端及备份目录，避免 Windows 浏览器缓存数据库被文件监听时触发 EBUSY。

### 自动化与浏览器验证

| 检查 | 结果 |
| --- | --- |
| `npm run typecheck` | 退出码 0 |
| `npm run build -- --outDir .cache/build-phase1` | 退出码 0，113 个模块 |
| 后端 pytest | 12 passed，1 条已有 Starlette/httpx 弃用警告 |
| `npm run test:e2e` | 退出码 0，独立数据库、上传目录、随机端口运行 |
| `npm run setup:backend` | 锁定依赖安装检查通过 |
| `npm start` | 前后端同时启动通过，前端 HTTP 200、后端健康检查 connected |

两项交易回归测试在修复前均失败，修复后通过；两项图片测试验证持久化、登录要求、非法内容及超限拒绝。

浏览器验收由 Windows Edge 和 Puppeteer 驱动两个独立浏览器身份，实际点击表单和按钮，覆盖：

1. 访客发布跳转登录；注册成功后登录，返回原目标页面。
2. 封面上传、本机草稿恢复、真实发布、刷新后数据库与图片一致。
3. 商品编辑后价格保存；商品搜索返回真实结果，搜索空态正确。
4. 错误密码、网络失败均不能产生登录凭证。
5. 收藏刷新后保留，联系方式由后端返回；买家预订、卖家接受、面交完成后商品已售。
6. 发布网络失败仍留在可编辑表单，数据库没有新增；恢复后重试成功。删除必须经确认，删除后详情返回 404。
7. 取消收藏持久化，过期身份清理；不存在商品不回退到示例商品。
8. 列表断网显示错误，不出现 Mock；重试恢复真实数据。
9. 375/390/440px 无根节点横向溢出，浏览器无未捕获运行时错误。

截图位于本机 `.cache/e2e/`，原始交接截图与 `dist/` 未覆盖。测试数据使用一次性 SQLite 与上传目录，没有向开发数据库添加验收账号。

### 启动、Git 与明确边界

- `npm start` / `start-local.bat` 启动配套服务；首次后端依赖准备为 `npm run setup:backend`。
- 启动脚本仅在 `backend/.env` 不存在时生成随机本机密钥。环境文件被两个仓库的忽略规则排除，不进入提交。
- 后端配套提交：`11a5e38`，位于 `work/integration`；前端位于 `work/phase1`。本次未推送远程。
- 业务接口仍需本地后端运行。旧“免安装预览”和旧 `dist/` 是历史原型；新版构建位于 `.cache/build-phase1/`。
- 每件商品当前保存一张封面；未实现多图相册、孤立上传清理、真实论坛后端、在线支付或站内聊天。
- 未发现本机 Docker/psql 命令，因此本轮未运行 PostgreSQL 或容器部署验收。Compose 补了上传目录持久化卷，Docker 上下文排除 `.env`、数据库与虚拟环境，但尚未实跑。
- 课程 SRS、PPT、博客和最终团队验收仍需单独完成。

---

## 16. 2026-10-28 PostgreSQL、备份恢复与部署构建交付

本节覆盖第 15 节“PostgreSQL 未验证”的历史状态。当前已经完成本机 PostgreSQL 和部署构建验收；没有发布到公开服务器，也未运行 Docker 容器。

### 项目内 PostgreSQL

- 本机原先没有 PostgreSQL/Docker 命令或服务。使用 PostgreSQL 官网链接的 EDB Windows ZIP，版本为 17.11（EDB 包 17.11-5），下载大小 381,531,864 字节。
- 运行程序位于 `.cache/postgres-17.11-5/`，数据与私密配置位于 `.local/postgres/`。不注册系统服务、不修改系统 PATH，也不在工作区外安装。
- 监听 `127.0.0.1:55432`，SCRAM-SHA-256 认证；管理、应用和测试角色分开，应用角色不是超级用户也不能创建数据库。
- 下载来源和本地 SHA-256 记录在缓存中的 `SOURCE.json`。该哈希是本地完整性记录，不冒充独立发布方校验值。
- Vite 忽略并拒绝提供私密数据、备份、后端源码及缓存目录；`.local/` 和 `.releases/` 都已纳入 Git 忽略规则。

来源：[PostgreSQL Windows ZIP 说明](https://www.postgresql.org/download/windows/)、[EDB 二进制下载](https://www.enterprisedb.com/download-postgresql-binaries)。

### SQLite 数据复制

- `npm run migrate:postgres` 先检查目标库为空，使用 SQLite backup API 创建只读源的一致性快照，再在一个 PostgreSQL 事务内复制。
- 成功复制：users 5 行、products 6 行、favorites 0 行、transaction_requests 0 行。
- 核对四张表的逐行内容指纹，包含原 ID、密码哈希、价格、时间戳与关系。SQLite 无时区时间按 UTC 显式转换，避免受 PostgreSQL 本机时区影响。
- 重置序列，检查 users_id_seq 为 (5, true)、products_id_seq 为 (6, true)，保证后续新记录 ID 正常递增。
- 原 SQLite 文件迁移前后 SHA-256 相同，随后复查仍相同。旧 SQLite 网页服务已停止，原文件与迁移前快照保留。
- 目标非空时拒绝重复复制；数据指纹不一致时回滚目标事务。

### PostgreSQL 与浏览器验证

| 检查 | 本轮结果 |
| --- | --- |
| PostgreSQL pytest | **20 passed**，含并发争抢预约、上传、生产配置及 SPA 路由检查 |
| SQLite pytest | **19 passed, 1 skipped**（跳过 PostgreSQL 并发检查） |
| 开发模式浏览器验收 | 两个独立账号走完整真实交易流程，全部通过 |
| 部署构建浏览器验收 | 同源 FastAPI + 编译页面 + PostgreSQL，再走完整流程，全部通过 |
| 图片与数据库备份恢复 | 四张表内容指纹、两张上传图片的 SHA-256 全部一致 |
| `npm run typecheck` | 退出码 0 |
| `npm run build:release` | 113 个模块构建通过，保留原 `dist/` |
| 恢复副本启动 | 独立 8081 端口启动成功，首页/健康检查 200，未知 API 404 |

测试库使用独立 `campuslink_test_<UUID>` 数据库和逐用例 UUID schema，测试角色与应用角色分离。E2E 外部数据库只接受新建测试库标识，上传必须留在工作区缓存。测试没有向迁移后的应用库插入验收账号。

并发测试同时发起两个“接受预约”请求，断言一个成功、另一个 409，数据库只保留一个 ACCEPTED 请求。SQLite 专用 PRAGMA 改为按 engine 注册，避免在 PostgreSQL 测试连接上误执行。

仍有 1 条 Starlette TestClient/httpx 弃用警告；没有把它当成失败或隐藏。

### 备份与恢复

- `npm run backup:postgres` 实际生成本机应用库备份。`pg_dump -Fc` 使用导出的同一 PostgreSQL 事务快照，与清单中的表指纹一致。
- 同时复制上传目录并记录每个文件 SHA-256；拒绝跟随上传目录中的符号链接。
- `npm run restore:postgres -- --backup <目录>` 只创建新库和新图片目录，拒绝已有表或已存在的图片目标，不使用 drop/clean 覆盖活跃数据库。
- 已分别验证合成交易数据加两张图片的恢复，以及实际迁移库副本的恢复。恢复后可通过 `--restore <标识>` 在独立端口检查，原库保持不变。
- 私密备份留在 `.handoff-backups/`；不会进入源码交付 ZIP。数据库备份包含密码哈希，应保存在私有存储。

参考：[pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html)、[pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)。

### 部署构建与源码交接

- `npm run build:release` 生成同源 `/api` 构建，记录前后端提交号、源码是否有未提交修改，以及静态资源 SHA-256。
- `npm run start:release` / `run-production.bat` 由 FastAPI 同时提供编译页面和 API，使用 PostgreSQL；不依赖 Vite 开发服务器。未知 API 和缺失静态资源返回 404。
- 正式模式要求 PostgreSQL、私有随机 JWT 密钥，且 debug、种子数据、自动建表均关闭；错误配置会拒绝启动。
- `npm run package:release` 只接受干净且与构建提交号一致的两个仓库，打包配套源码与构建，不包含真实 `.env`、数据库、私密配置、依赖和缓存。
- 后端提交 `364e556` 包含本轮数据库与部署能力；前端提交记录可从当前工作分支与交付 manifest 查询。
- 尚未完成：公开服务器、域名及 HTTPS 上线、Docker 实跑；真实论坛、多图等扩展，以及课程 SRS/PPT/博客等另外交付物。

---

## 17. 2026-10-29 真实论坛、旧库升级与交付整理

用户确认按计划补齐论坛。原始 `resource/README.docx` 的 Phase 1 未定义论坛写接口；`[ 福帮帮 ] 项目内部说明文档_初版.docx` 与 UI 任务说明包含攻略分享。本轮是后续拓展，未改写原始文档。

### 完成范围

- 新增 `forum_posts`、`forum_comments`，真实帖子与评论写入数据库。
- 公开列表与详情、五类筛选、标题/正文搜索、分页；首页最新分享和搜索读取真实论坛 API。
- 登录后发帖、可选封面上传、本人编辑/删除、“我的帖子”、按账号区分的本机草稿；新增 `PostEditor.vue`，列表复用于个人帖子。
- 评论持久化、分页读取、本人修改和删除；后端核验所有权。删除帖子级联删除评论，界面明确提示并要求确认。
- 正文和评论以纯文本显示，不执行输入的 HTML；删除原型点赞、关注，不伪造学籍认证。
- 请求错误显示实际失败，发布和评论失败后保留输入；不存在的帖子返回 404，不回退到第一条示例。
- 新增论坛样式使用既有设计 Token；ForumPostCard 由键盘可操作的按钮触发一次导航。

### 数据保护和旧版兼容

- 修改模型前备份应用数据库到 `postgres-local-638e780709994217adf11699701a7354`，文件保存在私有 `.handoff-backups/`。
- 新增 `npm run upgrade:postgres`，先成功备份数据库与上传文件，再创建缺少的表；不删除表、不覆盖字段或旧行。备份失败会阻止后续建表。这不是通用字段迁移框架。
- 本机升级前备份为 `postgres-before-schema-2ace0fd3d37948568f75616ec98791fc`。升级后：users 5、products 6、favorites 0、transaction_requests 0；两个论坛表初始 0 行。原四表内容指纹逐表一致。
- 原 SQLite 文件的 SHA-256 与上一轮成功迁移清单一致，未修改；证据另存 `.cache/forum-upgrade-verification.json`。
- 旧四表备份已恢复到独立新库，四表和上传文件验证通过；使用 `upgrade:postgres -- --restore <标识>` 再备份并新增论坛表，没有替换当前使用库。
- 数据工具支持旧 SQLite 缺少论坛表时的迁移，以及旧版备份的指纹检查；新增 PostgreSQL 兼容用例覆盖真实迁移、旧源文件不变和新表为空。

### 实际验证

| 检查 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| PostgreSQL pytest | **33 passed** |
| SQLite pytest | **31 passed, 2 skipped**（仅 PostgreSQL 并发和迁移检查跳过） |
| SQLite 浏览器回归 | 交易与新增论坛流程全部通过 |
| PostgreSQL 开发模式浏览器 | 交易与新增论坛流程全部通过 |
| PostgreSQL 编译部署模式浏览器 | 同源页面与 API，交易与论坛流程全部通过 |
| 备份恢复 | 六张表的内容指纹和三张上传图片 SHA-256 一致 |
| 移动端与运行时 | 375 / 390 / 440px 列表、详情、编辑无横向溢出；无未捕获浏览器错误 |
| 编译 | 114 个模块，原始 `dist/` 保留 |

后端仍有 1 条既有 Starlette TestClient/httpx 弃用警告。测试使用独立库、schema、图片目录和端口，未向日常使用库插入测试账号、论坛示例或评论。

新增浏览器覆盖：写帖保护路由；不存在帖子 404；封面与草稿恢复；失败发布没有写入且保留正文；帖子编辑；另一账号编辑被拒；分类搜索空态；首页与“我的帖子”；评论失败重试、刷新保存、本人修改、取消/确认删除；删除帖子时评论级联；离线错误重试；脚本内容按纯文本显示。

本机 Edge 156 启动时会通过兼容层重启，导致原测试启动器提前收到退出码 0。加入 `--edge-skip-compat-layer-relaunch` 后真实浏览器验收恢复；仅关闭本轮创建的隔离测试浏览器，没有操作个人浏览器会话。

备份样本 `postgres-e2e-357100d0a6964d418fd9e4d025479f96` 包含 users 2、products 1、transaction_requests 1、forum_posts 1、forum_comments 1、favorites 0，以及三张上传图片。恢复并重新计算全部指纹一致；执行状态见 `.cache/postgres-validation.json`。

### 使用与交接

- 功能要求对照、升级说明、内容管理说明、课堂演示步骤在 `docs/ACCEPTANCE_AND_DEMO.md`。
- 论坛完整接口在独立后端仓库 `docs/API.md`。需要本轮前后端配套版本，旧远程 `main` 不代表本地最新成果。
- 本地入口仍为 `run-production.bat` / `npm run start:release`，8080 端口。编译、源码配套打包与私密文件排除规则沿用上一轮。
- 未做：自由标签、攻略与闲置关联、攻略收藏、点赞关注、嵌套回复、管理员审核、多图和孤立上传清理；公网服务器/HTTPS、Docker 实跑及独立课程 SRS/PPT/博客仍待安排。

## 18. 2026-10-29 临时公网演示

用户确认“还没有服务器，先做临时公网演示”。本机 8080 服务重新启动；新增 `start-public-demo.bat` 和 `scripts/start_public_demo.py`。

- 使用 Cloudflare Quick Tunnel，连接程序 2026.10.5 来自官方 GitHub Release；下载文件 SHA-256 与发布方 digest 一致，仅保存在项目缓存。
- 先备份当前库和上传文件，再恢复到新的 `campuslink_demo_<UUID>` 和独立上传目录，六表指纹及图片校验一致。保留用户已经发布的内容，未覆盖或删除本机数据。
- 公网副本使用生产配置、独立随机 JWT 密钥、编译后的页面和仅监听回环的后端。只通过隧道提供网站，不暴露 PostgreSQL 端口。
- 公网 HTTP 验证：首页、论坛、商品详情、健康检查、帖子与商品接口均 200；商品图片读取成功；两个已有体验账号登录成功；未知 API 为 404。
- 私密路径验证：不存在的配置路径返回 404，或只返回和首页相同的 SPA HTML；没有提供实际 `.env`、Git 配置或数据库私密文件。初次断言将所有路径预期为 404，其中 `/backend/.env` 因无扩展名路径回退 HTML 而返回 200；复核响应正文后确认仅为首页外壳。
- Edge 真实浏览器走公网首页、买家登录、闲置列表、论坛，全部通过，无未捕获异常；截图在 `.cache/e2e/public-forum-mobile.png`。
- 公网网址、服务端口与进程记录只存 `.local/public-demo/latest.json`；日志和备份不提交。停止连接后地址失效，下次运行会创建新的副本和地址。
- 公网副本与本机原库不自动同步。此次未进行付费资源购买、长期云托管、正式域名或 Docker 部署。

操作、数据边界和停止说明见 `docs/PUBLIC_DEMO.md`。Cloudflare 官方说明：https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/ 。

## 19. 2026-10-30 Render 与 Supabase 部署源码准备

用户选择课程展示用途和免费托管，已在 Supabase 创建项目，并创建部署仓库 `Mikorchara/campuslink-deploy`。确认仓库初始为空，当前连接账号对该仓库有写权限；未改变组员原仓库，也未修改新仓库的公开/私有设置。

- 后端提交 `c1a1c57`：新增 Supabase Storage 适配，保留本地上传兼容。处理后的图片在云模式只上传远程，不回退到临时磁盘；失败返回真实错误。私有桶由服务端密钥访问，浏览器保持使用已有 `/api/uploads` 路径，不接触存储密钥。旧的本地目录备份命令在云存储模式会拒绝运行，防止误生成不含远程图片的备份。
- 前端根仓库提交 `98debc2`：新增 `deploy/Dockerfile`、云端启动入口、`render.yaml`、部署说明与严格按跟踪源码导出的工具。Node 阶段构建前端，Python 阶段提供页面和 API；生产模式、无演示种子、无启动期隐式建表，单独配置项允许以锁保护的事务新增缺失表，不做字段迁移。
- 数据库 URI 可保留密码占位符，实际密码单独作为服务环境变量；由启动程序编码，避免密码特殊字符破坏 URI，并强制 TLS。私密环境变量及原始数据库异常不输出到启动失败消息。
- 生成独立配套源码 133 个文件，包含前后端、资源及部署配置。排除实际环境文件、数据库、上传目录、缓存、依赖和 Git 历史；ZIP 已检查 CRC 并写入 SHA-256 旁文件。
- 已推送部署仓库 `main`，提交 `02fba392c26ba9060c567fb0344e4e41c61f09f1`，本地 HEAD 与远端 HEAD 一致。通过 GitHub 工具再次读取远端 `render.yaml`，确认 Docker、Free、健康接口及环境变量模板均已到位。

验证：PostgreSQL 后端 **44 passed**；部署入口的密码编码、TLS 与拒绝不完整配置 **4 passed**；前端类型检查通过；真实双账号浏览器覆盖交易、论坛、错误重试和 375/390/440px 适配，全部通过。SQLite 首轮为 41 passed、2 skipped，随后增加一个拒绝 publishable key 的参数用例并在 PostgreSQL 完整套件中通过。保留既有一条 Starlette 测试库弃用警告。

云存储测试使用隔离 HTTP 替身验证请求、响应和错误处理，未调用用户真实 Supabase 项目。当前电脑没有 Docker，故未声称完成 Linux Docker 构建；这一步须在 Render 首次构建验证。Supabase 密码/存储密钥尚未填写，正式网站尚未部署；原本机和临时演示数据未迁移、未覆盖。Render/Supabase 免费套餐的休眠和额度限制仍适用。

## 20. 2026-10-30 站内消息、商品与帖子点赞

- 新增三张表：notifications、product_likes、post_likes；不改既有字段或行。老库重复 create_all 升级保留原用户及密码哈希的测试通过。云端维持 INITIALIZE_SCHEMA=true，不更换数据库或密钥。
- 站内消息：预订申请、交易接受/拒绝/取消/完成、帖子新评论、收到商品/帖子赞。通知与业务同事务；失败的交易不产生通知。支持收件人鉴权、分页、未读筛选、单条/全部已读、内容删除后的失效跳转、交易定位。
- 点赞：独立于收藏，游客看总数，登录后设置/取消。唯一约束、原子冲突处理及 PostgreSQL 并发重复请求验证通过。同一用户取消再点赞不会重复通知。自己操作不通知自己。
- 前端：登录页面顶部消息入口及未读徽标，个人中心入口；网页可见时 30 秒检查，窗口恢复焦点立即检查；登出清空未读状态。无系统推送、邮件、短信、即时聊天或商品评论入口。旧事件不补发。
- 验证：PostgreSQL 后端 60 passed（含并发、权限、业务回滚与升级测试）；SQLite 后端+云入口 61 passed、3 个 PostgreSQL 专项跳过。保留一条已有 Starlette/httpx 弃用警告。
- 类型检查、Vite 生产构建通过。SQLite 与 PostgreSQL 开发环境双账号 Edge 验收通过；新构建的 PostgreSQL 同源生产网页双账号验收通过，涵盖通知跳转/已读持久化/未读筛选/失败重试、两类点赞、375/390/440px 以及原交易论坛回归。无未捕获浏览器错误。截图 .cache/e2e/notifications-mobile.png。
- 备份恢复：隔离 PostgreSQL 验收库完整备份与还原，9 张表的数据指纹及 3 个上传文件校验一致；报告 .cache/activity-validation.json。没有迁移或覆盖实际使用库，也没有导出云端真实用户数据。
- 中间验收情况：首次并行启动 SQLite 浏览器导航超时，单独重跑通过；原 PostgreSQL validate 包装流程的生产阶段指向旧 release，旧页面缺少新入口导致失败。重建 release 后单独完成生产网页与备份恢复验收，不能把前一次包装命令整体称为通过。
- 固定公网：部署仓库提交 2c9d754 已自动上线。实际公网独立双账号 API 验收通过：注册登录、商品和帖子点赞幂等/取消/重赞、评论/预订/接受/完成通知、收件人隔离、已读持久化、目标删除后的失效链接。临时测试商品、帖子与关联交易已移除；两个测试账号及其通知历史保留，生成的账号凭据仅在忽略的 .local/cloud-acceptance/ 下，不提交或输出。既有用户、商品、帖子未改动。专业工具原型仍延期。

## 21. 2026-10-30 新版交接包与项目报告

- 新增 HANDOFF_20261030.md、ACCEPTANCE_20261030.md、PROJECT_PROGRESS_REPORT.md 和 DEMO_DATA.json；更新 README 与历史文档入口，保留旧报告和旧交接 ZIP。
- 报告区分原组员已有成果、接手后开发、真实后端和固定公网成果，列出消息与点赞规则、验证范围、数据边界和启动维护方法。专业原型工具及分享链接继续待办，不将网页或截图计作工具交付；我参与的讨论列表仍待补。
- Word 报告 6 页，渲染为 PDF 和逐页 PNG 并人工检查，修正了初稿空白分页和模板标题线。标准脚本因本机缺 LibreOffice 未能转换，改用新建隐藏 Word 实例导出 PDF，再生成 PNG 检查；未打开或改动用户已有文档。报告与外层交接产物放在 .releases/handoff-20261030T091118Z/，中间渲染文件仅在 .cache/。
- 本轮只调整交接文档和后端接口说明，没有业务代码修改，不重复宣称全套业务测试重新运行。既有 60 项 PostgreSQL 与 61 项 SQLite/入口测试结果来源于第 20 节。
- 本轮实际复查公网健康、消息路由、论坛和闲置页均返回 200，部署仓库仍为 2c9d754。源码与编译页将由干净配套提交重新打包，产物哈希及解压隔离启动的检查结果写入外层交付清单，不复制真实数据库或账号凭据。
