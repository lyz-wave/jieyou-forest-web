# 解忧森林 · 开发交接文档

> 用途：让任何一个模型或开发者接手后，不需要翻聊天记录，就能理解产品、架构、当前进度、已知问题和下一步怎么做。
> 依据：仓库当前的真实代码、`openspec/changes/stage1-paper-forest/` 下的规格，以及原始需求 `解忧森林-prompt.md`。
> 写作时间：2026-10-03。所有「当前状态」以这个时间点为准，接手后请先按第 2 节的方法重新核对。

---

## 0. 接手第一件事（必读）

1. **先读这几份文件**，优先级从高到低：
   - `CLAUDE.md`、`AGENTS.md`：项目硬性规则。`AGENTS.md` 说明这里用的 Next.js 16 和训练数据里的版本有差异，写 Next 相关代码前先读 `node_modules/next/dist/docs/` 里对应的指南
   - `openspec/changes/stage1-paper-forest/` 下的 `proposal.md`、`design.md`、`tasks.md`、`specs/*/spec.md`：已经批准的第一阶段方案和验收标准
   - `解忧森林-prompt.md`：完整产品需求，覆盖全部 4 个阶段
   - 本文档
2. **核对状态**：
   ```bash
   git status --short
   openspec list
   openspec instructions apply --change stage1-paper-forest --json
   npm run typecheck && npm run lint && npm test
   ```
3. **不要提交代码**，除非用户明确要求。目前整个项目只有一个 `create-next-app` 初始提交，其余全部是未提交的工作区改动。
4. 第 1–3 阶段都已完成（记录见第 9 节）：第 1 阶段 63/63（9.1–9.7）、第二阶段引导式选伙伴（9.8）、倾诉与圆桌（9.9）与一轮**按文档逐节校对**（`openspec/changes/doc-alignment/`，9.10）、**第三阶段沉淀与年轮**（`openspec/changes/stage3-rings/`，9.11：Dexie 第 2 版、年轮三级浏览、成长卡片、先放一放与古树追问、`?dev=1` 演示数据；年轮在 10-08 做成了一盘**纸雕**（9.12），10-09 按用户的要求改成**剪纸年轮**，见 9.13）。**接下来是第四阶段**（记忆唤醒、数据导出导入删除、音效与动画打磨，架构建议见第 11.3、11.4 节），动手前先走 OpenSpec 并和用户确认范围。语音输入按用户 2026-10-08 的意思先放着。第 1–3 阶段已经部署在 Cloudflare Workers 上（Worker 名 `jieyou-forest-web`，地址 <https://jieyou-forest-web.radiant-hawking.workers.dev>，做法见 9.14）；线上要能真的对话，需要设置 `ANTHROPIC_API_KEY`。
5. 用户的工作习惯和规则见第 13 节。主要是：OpenSpec 流程、TDD、tasks.md 做完一项立刻打勾、手术式修改、中文沟通。

---

## 1. 产品概述

「解忧森林」是一个 2.5D 剪纸画风的治愈系 Web 应用，体验闭环是：

**释放情绪 → 多视角转变思维 → 沉淀成长记忆 → 再遇到相似问题时唤醒记忆**

- 森林里住着 7 只动物，每只代表一种思维方式，各有一个释放情绪的小游戏
- 点「开始倾诉」后，动物们聚到空地上听用户说：白天坐在阳光里，夜晚围着篝火
- 用户说完，动物们依次从自己的思维方式发言，配合动画；最后古树岁岁总结；用户可以继续追问
- 结束后，AI 把这次的问题和领悟沉淀成一条「成长记忆」，存进古树的年轮。年轮按 年 → 月 → 日 三级浏览
- 以后遇到相似的问题，森林会提示：「某年某月某日，你也曾……那天你领悟到……」

视觉要求：**2.5D、剪纸画风**，具体是层叠纸雕：多层彩色卡纸前后错开，边缘是手剪的不规则感，整体有纸张纹理，光影跟随真实时间变化。用户已经确认过这个画风。

### 1.1 角色表（素材全部在 `lib/animals.ts`）

| id | 名字 | 物种 | 思维方式 | 心理学依据 | 小游戏（game.id / 名称） | 栖息位置 |
|---|---|---|---|---|---|---|
| woodpecker | 笃笃 | 啄木鸟 | 情绪觉察 | 情绪标注 | knock-tree / 敲树洞 | 古树树干侧面 |
| owl | 墨墨 | 猫头鹰 | 理性分析 | CBT | fact-or-guess / 事实还是猜测 | 古树树枝 |
| fox | 阿橘 | 狐狸 | 换个角度 | 认知重构 | flip-mirror / 翻面镜 | 溪流前草地 |
| bear | 团团 | 熊 | 自我关怀 | Self-compassion | bear-hug / 熊抱 | 溪流前草地 |
| turtle | 慢慢 | 乌龟 | 时间视角 | 10-10-10 + 正念 | shell-breath / 龟壳呼吸 | 溪前岸边 |
| otter | 漂漂 | 水獭 | 放下与解离 | ACT 认知解离 | leaf-float / 落叶漂流 | 溪流里 |
| squirrel | 跳跳 | 松鼠 | 行动派 | 问题解决 / 行为激活 | hide-nuts / 藏坚果 | 古树树洞 |
| tree | 岁岁 | 古树 | 森林守护者 | 整合 | 无 | 场景中央偏后 |

`ANIMALS: Record<CharacterId, AnimalDef>` 包含 8 个角色；`ANIMAL_CAST` 是 7 只动物（不含古树），id 类型已收窄为 `AnimalId`。

---

## 2. 当前进度总览

### 2.1 四个阶段

| 阶段 | 内容 | 状态 |
|---|---|---|
| 1 | 风格样板 → 森林场景、7 只动物、森林生活、入林、角色卡、7 个小游戏（AI 用 mock） | **✅ 已完成，63/63 项已勾选**（2026-10-06 全量检查通过，见 9.6） |
| 2 | 倾诉、圆桌发言、古树总结、追问（接 Claude API） | **✅ 已完成**（引导式选伙伴见 9.8；倾诉与圆桌见 9.9；按文档校对见 9.10） |
| 3 | 沉淀、年轮三级浏览、成长卡片 | **✅ 已完成**（`openspec/changes/stage3-rings/`，见 9.11；年轮的纸雕见 9.12；E2E 与截图齐全） |
| 4 | 记忆唤醒、数据导入导出删除、音效、动画打磨 | 未开始（**风险检测与求助卡已经按文档第八节做进第二阶段**，见 9.10；语音输入按用户意思后置） |

> 部署：第 1–3 阶段已经跑在 Cloudflare Workers 上（`jieyou-forest-web`，<https://jieyou-forest-web.radiant-hawking.workers.dev>，做法见 9.14）。线上目前没设模型 Key，八个接口都走降级。

### 2.2 第一阶段各组

| 组 | 内容 | 状态 |
|---|---|---|
| 1 | 工程骨架 | ✅ 已勾选 |
| 2 | 纸艺纯函数（随机、手剪纸边、形状、景深、光影、画质） | ✅ 已勾选 |
| 3 | 场景引擎（纸层、视差、纹理、粒子、降画质） | ✅ 已勾选 |
| 4 | 纸偶 + 阿橘 + 风格样板页 + WebKit 点击修复 | ✅ 已勾选，画风已确认 |
| 5 | 森林生活（地面、领地、移动、调度、聚拢、篝火阳光） | ✅ 已勾选 |
| 6 | 其余 6 只动物和古树 | ✅ 已勾选 |
| 7 | 存储与入林 | ✅ 已完成并验证（含手机回归修复，见 9.1） |
| 8 | 森林主场景（角色卡、古树卡、徽记、镜头、游戏面板开关） | ✅ 8.1–8.5 全部完成并验证（见 9.3、9.5） |
| 9 | 小游戏通用部分（ForestAI 接口 + mock、GameShell、拖拽） | ✅ 已完成并验证（见 9.4） |
| 10 | 七个小游戏 | ✅ 已完成并验证（见 9.5） |
| 11 | 阶段验收（E2E 主流程、全量检查、README） | ✅ 11.1–11.4 全部完成并验证（见 9.5、9.6） |

### 2.3 最近一次验证结果（以下是事实记录，不代表现在仍然成立）

- 全量单元测试：**24 个文件、201 个测试全部通过**；`typecheck`、`lint`、`build` 通过。这是在加入手机视口断言之前的结果
- 生产构建 E2E（`playwright.prod.config.ts`，mobile + desktop）：`onboarding.spec.ts` 和 `prod.spec.ts` 一共 10 个测试全部通过。也是在加入视口断言之前
- 补上视口断言后曾暴露手机回归（见 9.1）。修复后重新验证：生产 E2E（mobile + desktop）10 个全部通过；开发服务器 E2E 31 通过、2 跳过；typecheck、lint、201 个单元测试、生产构建全部通过（2026-10-06）
- 开发服务器上的 E2E（`*.dev.spec.ts`，样板页和森林生活）：历史上连续 3 轮 35 个测试一致通过，另有 2 个按设计跳过。之后没有重跑
- **第 8 组完成后（2026-10-06）**：`npx vitest run` 27 个文件 225 个测试通过；`npm run typecheck`、`npm run lint` 通过；生产 E2E（`playwright.prod.config.ts`，mobile + desktop，含新的 forest-home 8 项 ×2）**26 个全部通过**；开发服务器 E2E 30 通过、2 跳过，`dev-iphone` 命中测试单独重跑通过（要带 `PLAYWRIGHT_BROWSERS_PATH=0`，否则 WebKit 找不到）
- **第 9 组完成后（2026-10-06）**：`npx vitest run` **36 个文件 269 个测试全部通过**（第 9 组新增 9 个文件 44 个测试）；`npm run typecheck`、`npm run lint` 零报错；新写的 `e2e/devtools.spec.ts`（2 个用例 ×2 视口）生产构建 **4 个全部通过**，同一个文件对着用户跑着的开发服务器（`--config=playwright.existing-dev.config.ts`，3200）**2 通过 2 跳过**（开发服务器上调试抽屉一直显示，那条只对生产构建有意义）
- **第 10 组 + 8.4 + 11.1 完成后（2026-10-06）**：`npx vitest run` **52 个文件 371 个测试全部通过**；`typecheck`、`lint` 零报错；`e2e/games.spec.ts` 用 `playwright.existing-dev.config.ts` 对着用户跑着的开发服务器（3200）跑，mobile 46.7s、desktop 52.5s 各 1 个用例通过；截图 16 张在 `docs/games/`（七个小游戏 + gameContext 抽屉，两个视口）
- **第 1 阶段收尾（11.2–11.4）完成后（2026-10-06）**：新增 `e2e/quality.spec.ts`（3 个用例 × 两个视口）；`npm run typecheck`、`npm run lint` 零报错；`npx vitest run` **52 个文件 371 个测试全部通过**；生产 E2E（`playwright.prod.config.ts`）**38 个全部通过（2.5 分钟）**；开发服务器 E2E（`playwright.existing-dev.config.ts`，复用 3200，dev-mobile/dev-desktop）**30 通过 2 跳过**，`dev-iphone` 的 WebKit 命中测试单独跑 **1 通过**；`npm run build` 成功；`docs/onboarding`、`docs/forest`、`docs/games` 的截图全部重新生成，已自检手机与桌面两个视口的森林主场景；`README.md` 改写成验收版
- **第二阶段 + 按文档校对完成后（2026-10-08）**：`npx vitest run` **74 个文件 526 个用例全部通过**（上轮 71/504）；`npm run typecheck`、`npm run lint` 零报错；生产 E2E（`playwright.prod.config.ts`）**50 个全部通过**（含新增的危机守护页两条 × 两个视口，见 9.10）；截图重新生成在 `docs/talk/`（新增 `*-talk-guard.png`）
- **第三阶段（沉淀与年轮）完成后（2026-10-08）**：`npx vitest run` **85 个文件 605 个用例全部通过**（上轮 74/526）；`npx tsc --noEmit`、`npx eslint .` 零报错；生产 E2E（`playwright.prod.config.ts`，mobile + desktop）**54 个全部通过**（新增 `e2e/rings.spec.ts` 两条 × 两个视口，`e2e/talk.spec.ts` 的收尾改走「再次打分 → 成长卡片」）；截图 16 张在 `docs/rings/`
- **年轮改成一盘纸雕之后（2026-10-08）**：`npx vitest run` **86 个文件 617 个用例全部通过**（上轮 85/605）；`npx tsc --noEmit`、`npx eslint .` 零报错；`e2e/rings.spec.ts`（mobile + desktop）通过，`docs/rings/` 的截图重新生成（内圈抬起、纸下见影，见 9.12）
- **年轮改成剪纸年轮之后（2026-10-09）**：`npx vitest run` **87 个文件 641 个用例全部通过**（上轮 86/617）；`npx tsc --noEmit`、`npx eslint .` 零报错；生产 E2E **54 passed (4.1m)**（含 `e2e/rings.spec.ts` 两条 × 两个视口）；`docs/rings/` 16 张截图重生成。
- **部署到 Cloudflare 之后（2026-10-09）**：`npx opennextjs-cloudflare build` 成功；`npx wrangler deploy --dry-run` 报 gzip **1113.57 KiB**、Worker Startup **18 ms**；本地 `wrangler dev`（8787）与线上都验过：首页 200（标题「解忧森林」、入林页正常、中文字体分片 200）、`POST /api/risk` 合法入参 503 降级、非法入参 400、未知路径 404（见 9.14）
- **每 IP 限流加上之后（2026-10-09）**：`npx vitest run` **88 个文件 647 个用例全部通过**（上轮 87/641；新增 `lib/ai/limit.test.ts` 5 例与 `routes.test.ts` 的 429 用例）；`npm run typecheck`、`npx eslint .` 零报错；清理 `.open-next` 后重新发布（Version ID `4a65467f-1b89-466a-b0e5-d9da649a6119`，gzip 1114.76 KiB），线上连打 21 次 `/api/risk`：前 20 次 503（线上没设 Key）、第 21 次起 **429 + `retry-after=57`**（见 9.14）

---

## 3. 技术栈与环境

| 项 | 版本 / 说明 |
|---|---|
| Next.js | 16.3.8，App Router，Turbopack。**和训练数据里的版本有差异**，先读 `node_modules/next/dist/docs/` |
| React | 19.2.8 |
| TypeScript | 5，strict，不允许 `any` |
| Tailwind | 4（`@tailwindcss/postcss`，用 `@theme inline` 定义颜色） |
| 动画 | `motion` 14（从 `motion/react` 导入，即 Framer Motion） |
| 状态 | Zustand 5 |
| 本地存储 | Dexie 4（IndexedDB） |
| 字体 | `lxgw-wenkai-screen-webfont`（霞鹜文楷屏幕阅读版），在 `app/layout.tsx` 导入 `lxgwwenkaigbscreen.css`，按 unicode-range 分片 |
| 单元 / 组件测试 | Vitest 5 + jsdom + Testing Library + `fake-indexeddb/auto` |
| E2E | Playwright 1.63（Chromium + WebKit） |
| Node | 22（`@types/node` 也是 22） |

### 3.1 命令

```bash
npm run dev            # 开发服务器（默认 3000）
npm test               # Vitest 单元 + 组件测试
npm run typecheck      # 先 next typegen 生成 LayoutProps 等全局类型，再 tsc --noEmit
npm run lint           # eslint（eslint-config-next 16）
npm run build          # 生产构建
npm run test:e2e       # 全部 E2E：会启动生产服务器 3100 和开发服务器 3101
npm run test:e2e -- --config=playwright.prod.config.ts   # 只跑生产项目，不启动开发服务器
npm run e2e:install    # 把 Chromium 和 WebKit 装到 node_modules（PLAYWRIGHT_BROWSERS_PATH=0）
```

### 3.2 环境注意

- **Playwright 浏览器装在 `node_modules` 里**：系统缓存里的浏览器曾经两次莫名消失，所以脚本统一加了 `PLAYWRIGHT_BROWSERS_PATH=0`。自己写的 Playwright 脚本也要带上这个环境变量
- **Next 16 同一个项目目录只允许一个 `next dev`**：如果已经有开发服务器在跑（比如用户自己开着预览），`npm run test:e2e` 里的开发服务器会启动失败，报 `Another next dev server is already running`。处理方法：
  - 只跑生产项目：`--config=playwright.prod.config.ts`
  - 或者先问用户能不能停掉那个开发服务器。**不要擅自杀掉用户的进程**
- Next 16 的开发输出在 `.next/dev`，和生产构建的 `.next` 互不影响
- Vitest 用 Vite 8 原生的 `resolve.tsconfigPaths: true` 解析 `@/` 别名，没有装 `vite-tsconfig-paths`
- 临时的浏览器检查脚本要放在项目的 `scripts/` 下才能解析到项目依赖；在 ESM 里用 `await import("@playwright/test")`
- **工具路径怪癖**：之前用文件写入工具传绝对路径时，有两次文件被保存成了一个带反斜杠的「字面文件名」，躺在项目根目录，而不是写进对应的子目录（`PopupCard.tsx` 和诊断脚本都出过这个问题，都已经移回正确位置）。写完新文件后，用 `ls` 或 `git status` 确认它确实在预期的目录里；可以用 `find . -path ./node_modules -prune -o -name '*\\*' -print` 检查有没有误写的文件

---

## 4. 目录结构与文件职责

```
app/
  layout.tsx                 根布局：字体、viewport（viewportFit cover，themeColor 米白）、body overflow-hidden
  globals.css                @property 注册纸色变量、主题色、.paper-button / .paper-card、焦点样式、时段过渡
  page.tsx                   "use client"，用 next/dynamic(ssr:false) 只在客户端加载 ForestApp
  style-sample/page.tsx      生产环境 notFound()；开发环境渲染 StyleSample
  style-sample/StyleSample.tsx  样板页：完整场景 + 全部动物 + 调试面板 + 聚拢演示；支持 ?time=night
components/
  scene/                     2.5D 纸雕场景引擎
    PaperScene.tsx           视口 / world 结构、相机（视差 + 镜头推近）、时段、画质、slots / actors / overlay 插槽
    ClientPaperScene.tsx     next/dynamic(ssr:false) 包装，服务端只输出米白底
    PaperLayer.tsx           单个纸层：translateZ + 缩放补偿；静态 SVG（阴影副本 + 纸片 + 镂空遮罩）
    WorldActor.tsx           3D 世界里按 (x, y, depth) 自由定位的元素（动物、篝火）
    StageItem.tsx            纸层内按舞台坐标放 HTML
    SceneContext.ts          lighting / quality / reducedMotion / unit / stage / layout
    PaperTexture.tsx         全屏 feTurbulence 纸纹，pointer-events:none
    Particles.tsx (+css)     落叶 / 光斑 / 萤火虫，DOM + CSS 动画，后台暂停
    CrownGlow.tsx            夜晚树冠镂空后的暖光
  puppet/
    PaperPuppet.tsx (+css)   纸偶渲染：部件递归、关节、两脚钉、剪影阴影、时段明暗、待机 / 步态、点击反馈、水线裁剪
  forest/
    ForestApp.tsx            产品首页：启动 → 入林或森林；入林时镜头推近；森林欢迎条、存储提示、免责声明
    ForestAnimals.tsx        所有动物的行为调度：平时走动、聚拢、散开（给每只动物下 ActorCommand）
    ForestAnimal.tsx         单只动物：执行指令、接触阴影、水獭水线
    Gathering.tsx (+css)     篝火（夜晚）/ 阳光（白天）纸艺元素
    GatherControls.tsx       「开始倾诉」按钮、坐好后的提示纸条和「让大家散开」
    ForestHome.tsx           森林浮层：欢迎条、今天的伙伴、存储提示、免责声明、角色卡、开始倾诉
    CharacterCard.tsx        角色卡 / 古树卡内容（含「我的年轮」占位提示、「我的伙伴」标记）
    CompanionBadge.tsx       伙伴的小叶子徽记
    TreeSpot.tsx             古树的可点热区（岁岁，perspectiveScale 关掉）
  onboarding/
    Onboarding.tsx           五步入林引导（组件测试在 Onboarding.test.tsx）
    MorningMist.tsx          晨雾纸片：完整动画时向两侧拉开，减弱动画时只淡出
  ui/
    PopupCard.tsx            立体书式纸卡：rotateX 折起、焦点管理与焦点陷阱、Esc、点外部关闭（测试在 PopupCard.test.tsx）
  games/
    GameShell.tsx            游戏面板外壳：标题、回到森林、思考中、失败挠头 + 重试
    useAiRequest.ts          请求状态机（idle / thinking / ready / failed）+ 重试 + abort
    dnd/                     DndProvider / Draggable / DropZone（拖拽 + 点选 + 键盘三路都在）
  dev/
    DebugPanel.tsx           样板页调试：时段、画质、减弱动画、帧率、查看全部角色
    CastGallery.tsx          全部角色一览
    DevTools.tsx             开发工具挂载点（读 location.search，未启用返回 null）
    GameContextTray.tsx      gameContext 抽屉 + 清空 + 「模拟 AI 失败」开关
hooks/
  useParallaxInput.ts        视差来源：鼠标 / 陀螺仪 / 自动漂移 / 无；iOS 授权按钮；拒绝后记在 localStorage
  useTimeOfDay.ts            每分钟检查一次真实时段，可被 scene store 覆盖
  useReducedMotion.ts        系统设置 + 开发覆盖
  useQualityGovernor.ts      rAF 采样帧率 → 降画质
  useViewportSize.ts         视口尺寸（首帧前为 null）
  useActorMotion.ts          单只动物的位置（MotionValue）、朝向、姿态、moveTo / face
lib/
  animals.ts                 【素材集中】8 个角色的设定 + 纸偶部件（约 1160 行）
  scene.ts                   【素材集中】6 个纸层、古树、入林晨雾 ONBOARDING_MIST、PERSPECTIVE、PARALLAX_MARGIN
  paper/random.ts            mulberry32、hashString、seeded、between
  paper/roughen.ts           多边形细分 + 法线抖动 → M/L/Z 折线
  paper/shapes.ts            ellipse / blob / leaf / crescent / ridge / treeLine
  paper/geometry.ts          Point、bounds、点到线段距离、平移
  scene/depth.ts             舞台、缩放补偿、投影、不露边、相机限制、镜头对焦、最大推近量
  scene/lighting.ts          时段判定、四时段光影表、阴影偏移、CSS 变量
  scene/quality.ts           降画质状态机
  scene/parallax.ts          视差来源选择、陀螺仪映射、漂移曲线
  scene/particles.ts         带种子的粒子参数
  puppet/types.ts            PuppetPart / PuppetDef、校验、12fps 步数、相位延迟
  forest/ground.ts           地面与溪流模型
  forest/territory.ts        领地锚点（竖屏 / 横屏两套）、习性
  forest/motion.ts           planMove 路线规划、sampleTrack
  forest/scheduler.ts        走动调度状态机
  forest/gather.ts           聚拢座位
  onboarding/nickname.ts     昵称校验与截断
  db/profile.ts              Dexie 资料存储 + 内存降级
  stores/app.ts              启动阶段、资料、persistent
  stores/scene.ts            时段覆盖、画质、减弱动画覆盖
  stores/forest.ts           伙伴、聚拢阶段、走动暂停
  stores/gameContext.ts      小游戏上下文（最多 20 条）
  stores/dev.ts              模拟 AI 失败开关（已接到调试抽屉）
  dev.ts                     开发工具开关 devToolsEnabled（开发恒真，生产要 ?dev=1）
  games/dnd.ts               zoneAtPoint 落点判定（纯函数，重叠取面积更小者）
  ai/types.ts                ForestAI 接口、思维陷阱表 TRAPS、三种翻面版本、字数上下限、AI_FAILURE_LINE
  ai/mock.ts                 确定性 mock：同输入同结果、600–1200ms、可 abort、可模拟失败
  ai/index.ts                唯一实例 forestAI（第二阶段换真实现只改这里）
e2e/
  prod.spec.ts               生产环境 /style-sample 返回 404；字体分片少于 30
  onboarding.spec.ts         入林、刷新、存储降级、减弱动画（同时把截图写到 docs/onboarding/）
  style-sample.dev.spec.ts   纸层、命中测试、steps 节奏、点击反馈、键盘、无 filter、时段阴影、画质、减弱动画、视差不露边
  forest-life.dev.spec.ts    走动（加速页面时钟）、白天 / 夜晚聚拢、散开、减弱动画
  devtools.spec.ts           调试抽屉：生产不带 ?dev=1 不出现；能看 gameContext、能开「模拟 AI 失败」
  helpers.ts                 finishOnboarding 等共用流程
playwright.config.ts         5 个项目：mobile / desktop（生产 3100）、dev-mobile / dev-desktop / dev-iphone（开发 3101）
playwright.prod.config.ts    只保留 mobile / desktop 和生产服务器
scripts/shoot.mjs            截图脚本（临时探针 diag-companion 已在 9.1 修好后删掉）
docs/style-sample/  docs/cast/  docs/onboarding/  docs/forest/   画面自检截图
openspec/changes/stage1-paper-forest/   第一阶段方案、规格、任务清单
```

---

## 5. 核心架构

### 5.1 2.5D 坐标系与相机

**分层结构**（`components/scene/PaperScene.tsx`）：

```
.paper-scene（fixed、全屏，写入时段 CSS 变量）
└─ 3D 容器（perspective: 1000，pointer-events:none）
   └─ world（preserve-3d，transform = 视差 + 镜头，pointer-events:none）
      ├─ PaperLayer × 6（translateZ(-depth) scale((P+depth)/P)）
      └─ actors（WorldActor：动物、篝火、阳光）
├─ 时段色调层
├─ Particles
├─ overlay（按钮、卡片、入林 UI）
└─ PaperTexture（最上层，不拦截点击）
```

**关键常量**：

| 常量 | 值 | 位置 |
|---|---|---|
| `PERSPECTIVE` | 1000 | `lib/scene.ts` |
| `PARALLAX_MARGIN` | 36（px，舞台在视口四周多留的余量） | `lib/scene.ts` |
| `STAGE_W × STAGE_H` | 3000 × 1000（舞台单位） | `lib/scene/depth.ts` |
| 纸层深度 | sky 1600 / hills 900 / farTrees 550（低画质可隐藏）/ forest 280 / meadow 110 / fore 0 | `lib/scene.ts` |

- **舞台坐标**：x 从 -1500 到 1500，中心为 0；y 从 0 到 1000，顶部为 0。舞台按 cover 方式铺满视口，再加上视差余量；`stageRect()` 算出 `unit`，即 1 个舞台单位等于多少 CSS px
- 竖屏手机只能看到舞台中间大约 ±250 到 ±280 的宽度，所以重要元素（古树、7 只动物）在竖屏和横屏下各有一套位置
- **缩放补偿**：每层 `scale = (P + depth) / P`。静止时所有层投影后正好叠在一起，像一张平面画；视差和镜头只改 world 的 transform，远近位移差自然形成真实的透视视差
- **相机**（`useCamera`）：
  - 视差输入是 -1 到 1 的 MotionValue，乘以 `PARALLAX_MARGIN × 0.9`
  - 镜头推近 `CameraFocus { depth, point, z, keepWidth?, anchorY? }` 由 `focusCamera()` 算出相机位置；`maxZoomToFit()` 用 `keepWidth` 限制推近量，保证聚拢时两端的动物都还在画面里
  - 最后用 `clampCamera()` 保证任何纸层都不露边
  - 减弱动画时相机固定为 0
- `PaperScene` 接受 `timeOverride` 属性（入林时固定为清晨 `dawn`），也会读 `scene store` 里的开发覆盖

### 5.2 手剪纸边与固定随机（`lib/paper/`）

- `seeded(seed)` 基于 `hashString` + `mulberry32`。**所有会渲染出来的形状和粒子都必须用带种子的随机**，禁止直接用 `Math.random()`，否则会造成水合不一致，也没法测试
- `roughPath(polygon, { seed, amplitude, step })`：把多边形每条边按 `step` 细分，再沿法线方向抖动，输出只含 `M / L / Z` 的折线 path。测试保证：同一个种子结果相同；每个点偏离原轮廓不超过 `amplitude`；路径闭合
- 所有形状在模块加载时生成一次，不在每帧计算

### 5.3 光影（`lib/scene/lighting.ts`）

- 时段边界：5:00–7:59 清晨 `dawn`，8:00–16:59 白天 `day`，17:00–18:59 黄昏 `dusk`，19:00–4:59 夜晚 `night`
- `LIGHTING[时段]` 包含：阴影方向单位向量（与光源相反）、调色板（12 个纸色）、阴影颜色和透明度、纸偶明暗、整体色调、镂空暖光、是否逆光、是否有萤火虫
- 纸色通过 `lightingCssVars()` 写成 `--paper-*` 变量；这些变量在 `globals.css` 里用 `@property` 注册过，所以时段切换时能用 3 秒 transition 平滑过渡
- 阴影是**静态的偏移副本**：高画质时加 `feGaussianBlur`，中低画质时是清晰的偏移剪影。**任何做 transform 动画的元素本身都不加 CSS filter**，这条有 E2E 检查

### 5.4 视差（`hooks/useParallaxInput.ts` + `lib/scene/parallax.ts`）

- 来源选择：`(pointer: fine)` 用鼠标；有 DeviceOrientation 且是触屏时用陀螺仪（以第一次读数为基准，±15° 映射到 ±1）；iOS 需要授权时先自动漂移，并显示「开启体感」按钮；用户拒绝后记在 localStorage，不再显示按钮
- 自动漂移：周期约 20 秒的李萨如曲线，幅度 0.3
- 减弱动画时返回常量 0
- 设备能力用 `useSyncExternalStore` 读取，避免 effect 里调用 setState

### 5.5 降画质（`lib/scene/quality.ts` + `hooks/useQualityGovernor.ts`）

- 状态机：前 2 秒是预热期，不采样；之后用 2 秒滑动窗口，平均帧率低于 45 就降一级，只降不升；两帧间隔超过 1 秒（比如切到后台）就丢弃当前窗口
- `QUALITY_SETTINGS`：高（模糊阴影，36 个粒子）/ 中（清晰阴影，16 个）/ 低（清晰阴影，6 个，去掉远树层）
- 调试面板可以手动锁定画质，锁定后不再自动降级

### 5.6 纸偶系统（`lib/puppet/types.ts` + `components/puppet/PaperPuppet.tsx`）

```ts
interface PuppetPart {
  id: string; path: string; fill: string;
  joint: [number, number];   // 关节点（viewBox 坐标）
  z: number;                 // 同级叠放顺序；子部件 z < 0 画在父部件后面
  ink?: boolean;             // 墨色细节：不计入纸色、不投影
  pin?: boolean;             // 在关节上画两脚钉
  idle?: { kind: "breathe" | "blink" | "sway"; duration: number; amount: number };
  gait?: "leg-front" | "leg-back" | "wing";
  waterOnly?: boolean;       // 只在水里显示（水獭腰间的水面纸条）
  children?: PuppetPart[];
}
interface PuppetDef {
  id: string; viewBox: [number, number]; facing: "left" | "right";
  parts: PuppetPart[];
  signature: { part: string; angle: number };  // 点击时摆动的标志性部件
  waterline?: number;                          // 泡在水里时，这条线以下裁掉
}
```

- viewBox 统一为 200×200，脚底大约在 y=196
- **每个部件渲染成嵌套的 `<g>`**：最外层 `data-part` 加关节 transform-origin，供 Motion 点击反馈使用；中间层是待机动画（CSS keyframes）；最内层是步态动画。三层互不覆盖 transform
- 待机动画：`steps(var(--steps), jump-none)`，步数 = 周期秒数 × 12，即约 12 帧/秒的定格感。`idleDelay(puppetId, partId, duration)` 由 id 哈希出固定的负延迟，让不同动物错开相位
- 步态：`stride 0.5s steps(6)`（腿），`flap 0.25s steps(3)`（翅膀）
- 每个纸偶渲染 3 份 SVG：剪影阴影（按光源方向偏移，整组降透明度）→ 本体 → 同形剪影做时段明暗。朝向和原始朝向不同时整体 `scaleX(-1)`，阴影一起翻转，但偏移方向保持跟随光源
- 纸偶本身是 `<button>`，带 aria-label（例如「阿橘，狐狸，换个角度」），热区至少 44×44
- `PuppetHandle.react()`：整体轻跳 + 标志性部件摆动，总时长 0.55 秒；减弱动画时改为透明度闪一下
- `PaperPuppet` 已经支持 `badge` 属性，可以直接拿来放伙伴的小叶子徽记，**但目前还没有任何地方用它**
- `validatePuppet()` 检查：部件 id 不重复、关节点在 viewBox 内、主体纸色 2–4 种、三种待机动画都有、标志性部件存在。`lib/animals.test.ts` 对全部 8 个纸偶跑这个校验

### 5.7 森林生活（`lib/forest/` + `hooks/useActorMotion.ts` + `components/forest/`）

**地面模型**（`ground.ts`）：
- 草地是夹在草地纸层（深度 110）和前景纸层（深度 0）之间的一个斜面
- 地上的动物只在深度 12（近，舞台 y=900）到 104（远，舞台 y=790）之间活动；`groundY(depth)` 在这之间线性插值，越远越高
- `sizeAt(depth)`：最近处 1，草地最远处和树上 0.6。CSS 透视在不到 100px 的纵深里几乎看不出远近，所以另外按深度缩小
- 溪流从舞台 x=-40 开始向右流出画面；`streamDepthAt(x)` 是一条蜿蜒的中线；`streamHalfWidthAt(x)` 源头窄、下游宽；`inStream(x, depth)` 判断是否在水里

**领地与习性**（`territory.ts`）：
- 每只动物有 `perch`（ground / trunk / branch / hollow / water）和一组锚点；竖屏、横屏两套；第一个锚点是「家」
- 古树上的动物深度为 `TREE_DEPTH = 274`；爬树的最低点 `TREE_CLIMB_BOTTOM_Y = 740`
- `HABITS`：速度（乌龟 18 最慢，松鼠 150 最快）、会不会飞、会不会游、竖屏 / 横屏下的尺寸
- 聚拢空地中心 `CLEARING = { x: 0, depth: 40 }`

**路线规划**（`motion.ts`，`planMove(animal, from, to, { maxDuration?, hop? })`）：
- 会飞的：同一树干上小幅移动时一跳一跳（啄木鸟），树上横向移动时走，其他情况沿抛物线飞
- 水獭在水里：沿溪流中线细分漂动
- 从树上下来：先爬到树根，再向前跳到草地
- 从水里上岸：跳到岸上
- 要上树：走到树根前、跳上去、往上爬
- 地面行走：如果直线会穿过溪流，就绕到源头左边
- 弧线：`y(t) = 线性插值 - 4h·t(1-t)`；`lift` 表示离地高度，接触阴影留在地面上、随高度变小变淡
- `maxDuration`：总时长超过这个值就整体加速（聚拢时不让大家等乌龟太久）

**调度器**（`scheduler.ts`）：纯状态机，外部传入时间戳。每 12–30 秒挑一只没在动的动物，同时最多一只在动，尽量不连续挑同一只；可以暂停和恢复。

**聚拢**（`gather.ts`）：
- `gatherSeats(companion, layout)`：伙伴坐在中心左侧最近的位置，其余从大到小交替分到两侧；越往外越往后退，从镜头看是一道向后弯的弧；不会碰到溪流；坐下后都面朝中心
- `gatherHalfWidth()`：座位两端最远到哪里，用来限制镜头推近量

**运行时**：
- `useActorMotion`：位置用 MotionValue 每帧更新，不触发 React 重渲染；只有朝向、姿态、进出水时才重渲染。`moveTo()` 返回 Promise：走完 resolve(true)，被新指令打断 resolve(false)
- `ForestAnimals`：给每只动物下 `ActorCommand { id, to, facing?, instant?, maxDuration? }`；聚拢和散开时每只最多 5 秒；页面不可见、`wanderPaused` 为 true、正在聚拢或减弱动画时不走动
- `useForestStore.gather` 状态：`idle → gathering → seated → dispersing → idle`，`pending` 计数，每只到位时调用 `arrived()`
- `WorldActor` 的 transform：`translate3d(x·unit·s, (y-500)·unit·s, -depth) scale(s·sizeAt(depth))`，其中 `s = (P + depth) / P`

### 5.8 状态（`lib/stores/`）

| store | 字段 | 说明 |
|---|---|---|
| `app` | `phase: loading / onboarding / forest`、`profile`、`persistent`、`boot()`、`completeOnboarding(profile)` | 启动时读资料；完成入林时写入；会同步 `forest.companion` |
| `scene` | `timeOverride`、`quality`、`qualityLocked`、`reducedMotionOverride` | 开发调试覆盖 |
| `forest` | `companion`、`gather`、`pending`、`wanderPaused`、`opened`、`openedAt`、`pendingGame`、`openCard(id, at?) / closeCard() / startGame(gameId) / closeGame()` | `openCard` 会暂停走动并记住动物当时的舞台坐标（镜头据此推近）；`startGame` 先折回角色卡再记下要玩哪个游戏 |
| `gameContext` | `entries`、`add(game, content)`、`clear()` | 格式「【游戏名】内容」，最多 20 条，只在内存里 |
| `dev` | `simulateAIFailure` | 已接到调试抽屉的「模拟 AI 失败」开关（`components/dev/GameContextTray`）|

`forest` 的 `lastPlayed` / `playedTimes` / `gameAnimal` / `gameAt` 就是规格里的「刚玩过的动物」和「玩这只游戏时镜头停在哪」：`closeGame()` 时记下，`ForestAnimals` 用 `playTokenFor()`（`lib/forest/play.ts`）决定让哪只跳一次（第 10 组做完，见 9.5）。

### 5.9 本地存储（`lib/db/profile.ts`）

- Dexie 数据库名 `jieyou`，第 1 版只有 `profile` 表，固定主键 `"me"`
- `createProfileStore(dbName?)` 返回 `{ persistent, load(), save() }`。没有 `indexedDB` 或 `db.open()` 失败时退回内存存储，`persistent = false`，并 `console.warn`
- `completeOnboarding` 写入失败时也会把 `persistent` 置为 false，然后照常进入森林
- 第二、三阶段要升级到第 2 版，加入 `sessions`、`memories` 表（见第 11 节）

### 5.10 启动与入林

- `app/page.tsx`（客户端组件）通过 `next/dynamic(..., { ssr: false })` 加载 `ForestApp`。原因：页面依赖本地时间和 IndexedDB，服务端只输出「森林正在醒来…」的米白底，避免水合不一致
- `ForestApp`：
  - 挂载时调用 `boot()`
  - `phase === "onboarding"`：场景固定为清晨，不放动物；overlay 是 `MorningMist` + `Onboarding`；点「走进森林」后镜头推近（`depth 280, point (0,600), z 80`）、晨雾拉开
  - `phase === "forest"`：放动物和篝火 / 阳光；左上角欢迎条「{昵称}，欢迎回到森林 / 今天的伙伴 · {名字}」；存储不可用时显示提示；底部是 `GatherControls` 和免责声明
- `Onboarding` 的五步：`mist`（标题页「走进森林」）→ `welcome`（岁岁纸偶 + 三句欢迎）→ `nickname`（最多 12 个字，按字符计、emoji 算一个；全空白不能继续）→ `notice`（说明卡，「我知道了」）→ `companion`（7 张单选卡片 + 「一起入林」）
- **只在最后一步写入资料**；中途刷新从头开始；保存中禁止重复提交
- 每一步都用 `PopupCard`（`dismissible={false}`，不能用 Esc 或点外部跳过）
- 伙伴卡片：原生 `<input type="radio">` 透明铺满整张卡片，这样触摸、鼠标、键盘都走同一条真实的选择路径。之前用 `sr-only` 时，Playwright 的真实点击会被装饰层拦截

### 5.11 PopupCard（`components/ui/PopupCard.tsx`）

- 动画：完整动画时 `rotateX: -88 → 0`，以底边为轴折起（transformOrigin 50% 100%），关闭时折回；减弱动画时只淡入淡出
- 打开 50ms 后聚焦 `[data-autofocus]` 或卡片本身；关闭时焦点回到打开它的元素
- Tab / Shift+Tab 焦点陷阱；Esc 和点背景关闭（`dismissible` 为 false 时不响应）
- `onClose` 和 `dismissible` 放在 ref 里，这样父组件重渲染时不会重新执行聚焦逻辑、把焦点从输入框抢走（有回归测试）
- 卡片 `max-h-[calc(100dvh-32px)] overflow-y-auto`

### 5.12 小游戏通用部分（`lib/ai`、`lib/games`、`components/games`、`components/dev`）

- **AI 唯一入口**：游戏只 import `@/lib/ai` 的 `forestAI`，类型从 `@/lib/ai/types` 取。第一阶段是 `createMockAI`（同输入同结果、600–1200ms、可 abort、可模拟失败），第二阶段换实现只改 `lib/ai/index.ts`
- **`useAiRequest`**：`status`、`result`、`error`、`run(text)`、`retry()`、`reset()`。失败后输入不丢（输入由游戏自己保管），思考中重复 `run` 会被忽略，卸载时 abort 上一个请求
- **`GameShell`**：`title` / `animal` / `status` / `onRetry` / `onClose` / `children`，内部就是 `PopupCard`；`useGameBusy()` 拿到「正在想」的布尔值
- **拖拽**：`lib/games/dnd.ts` 的 `zoneAtPoint(x, y, zones)` 是纯函数（重叠时取面积更小的那个，即更具体的目标）；`DndProvider` 管选中态和落点判定，`Draggable` / `DropZone` 都是真按钮，所以键盘和点选天然可用
- **开发工具**：`devToolsEnabled(search, nodeEnv)` —— `NODE_ENV=development` 时恒真，生产构建要 `?dev=1`；`DevTools` 挂在森林浮层右下角，能看 gameContext、清空、打开「模拟 AI 失败」

---

## 6. 硬性规则（来自 `CLAUDE.md` 和已批准的设计）

1. **素材集中**：角色设定和纸偶部件只写在 `lib/animals.ts`，场景纸层只写在 `lib/scene.ts`。组件里不得内联动物或场景形状。新的纸艺元素（比如篝火）如果是场景素材，优先放进这两个文件
2. **性能**：只对 transform 和 opacity 做动画；做 transform 动画的元素不加 CSS filter；阴影用静态偏移副本
3. **随机必须带种子**：用 `lib/paper/random.ts`
4. **减弱动画**：所有动画组件都要处理 `useReducedMotion()`
5. **AI**：小游戏只能通过 `lib/ai` 的 `ForestAI` 接口取数据（已建，见 5.12）；游戏里不许直接 import mock
6. 不用 `any`；纯逻辑先写测试（TDD）
7. 3D 容器和 world 都是 `pointer-events:none`，能交互的元素自己打开 `pointer-events-auto`。**WebKit 做 3D 命中测试时会把 world 自己的盒子算在最前面，挡住里面的动物**，这是之前「点阿橘没反应」的根因
8. 场景只在客户端渲染
9. TypeScript 规范：优先 interface；函数显式标注返回类型；async 返回 `Promise<T>`；不确定类型用 `unknown`；错误不吞，至少 log
10. 测试规范：Vitest、`describe` / `it`、每个 `it` 只测一种行为；期望值手写，不用被测代码自己算；不对 mock 本身做断言

---

## 7. 测试体系

### 7.1 单元 / 组件测试（Vitest）

`vitest.config.mts`：jsdom 环境，`setupFiles` 引入 `@testing-library/jest-dom/vitest` 和 `fake-indexeddb/auto`，排除 `e2e/`。

已有测试覆盖：random、roughen、shapes、depth、lighting、quality、parallax、particles、scene、animals（纸偶校验）、puppet/types、ground、territory、motion、scheduler、gather、nickname、profile（包括不可用和打开被拒两种降级）、app store（含伙伴同步、保存失败）、forest store、gameContext（20 条上限）、dev store、PopupCard、Onboarding。

### 7.2 E2E（Playwright）

| 项目 | 服务器 | 跑哪些 |
|---|---|---|
| mobile（375×667，Chromium） | 生产 3100 | 非 `.dev.spec.ts` |
| desktop（1440×900） | 生产 3100 | 非 `.dev.spec.ts` |
| dev-mobile / dev-desktop | 开发 3101 | `*.dev.spec.ts`（样板页只在开发环境存在） |
| dev-iphone（WebKit，390×844） | 开发 3101 | 只跑名字里带「命中」的测试；headless WebKit 渲染重场景时会间歇停帧 |

`workers: 2`、`retries: 0`。开发服务器上全是动画测试，并发太多会互相拖慢、导致超时。

技巧：
- 走动测试通过 `addInitScript` 把 `performance.now` 加速 25 倍
- 判断「没有镜头推进」时，要检查 world 的计算 transform 是否是单位矩阵（`new DOMMatrix(...).isIdentity`），**不要和字符串 `"none"` 比较**，Motion 写出的是 `matrix(1, 0, 0, 1, 0, 0)`
- Trace 里常常缺截图帧，排查动画问题时用临时脚本逐帧记录位置和 transform 矩阵

### 7.3 画面自检

每完成一个可见功能，用 Playwright 截两个视口的图（手机 375×667、桌面 1440×900），自己先看一遍再交给用户。已有截图在 `docs/style-sample/`、`docs/cast/`、`docs/onboarding/`。

---

## 8. 已知遗留问题（不在 9.1 的阻塞之列，但需要知道）

| # | 问题 | 位置 | 建议 |
|---|---|---|---|
| 1 | 竖屏聚拢时部分小动物被大动物挡住；夜晚最左侧的松鼠只露出半身 | `lib/forest/gather.ts` 的 portrait 布局 | 用户没有要求马上改。可以考虑改成前后两排，测试里加「每只动物至少有 N% 面积可见」 |
| ~~2~~ | ~~首页 `/` 上点击动物只会播放点击反馈，没有角色卡~~ | `components/forest/ForestHome.tsx` | 第 8 组已做（9.3） |
| ~~3~~ | ~~没有伙伴小叶子徽记~~ | `components/forest/CompanionBadge.tsx` | 第 8.1 项已做 |
| ~~4~~ | ~~首页没有「我的年轮」入口~~ | 古树卡里 | 第 8.3 项已做（只给提示，不跳转） |
| ~~5~~ | ~~古树没有作为可点击角色放进森林~~ | `components/forest/TreeSpot.tsx` + `lib/scene.ts` 的 `TREE_HOTSPOT` | 第 8.1 项已做：树冠上一块 340×195 的透明热区（`perspectiveScale={false}`，避免 3D 投影二次缩放），aria-label「岁岁，古树，森林守护者」 |
| ~~6~~ | ~~「坐好」提示文案是「大家都在听啦，倾诉功能下个版本开放」~~ | `GatherControls.tsx` | 已改（9.9）：点「开始倾诉」会**同时**打开倾诉流程，纸条改为「大家都在古树前坐好了」+「让大家散开」；`forest-home.spec.ts` 的用例跟着改了断言 |
| 7 | 免责声明用的是米白色小字（`text-cream`，10px），压在草地上，对比度可能不够 | `ForestApp.tsx` | 第 8 组顺便检查对比度 |
| ~~8~~ | ~~入林说明卡写着「本阶段不向外部服务发送内容」~~ | `Onboarding.tsx` | 已改（9.9）：写明「昵称、伙伴和游戏记录只存在你自己的设备上」与「倾诉的话会发给本站的服务端、不写日志也不留下」；`Onboarding.test.tsx` 新增一条守这段文案 |
| 9 | 说明卡里的求助信息目前是笼统的「当地心理援助热线、急救或报警」 | `Onboarding.tsx` | 原需求里的号码（12356、400-161-9995、110 / 120）**上线前必须核实**，不要未经核实就写进产品 |
| 10 | `dev-iphone` 项目只验证命中测试 | `playwright.config.ts` | 需要时在真机上做性能和手感验收；早期只在本机 Chrome 上测到 58–60fps |
| 11 | 用户规则要求每个会话结束时在 `progress.md` 记录指标，目前**还没有这个文件** | 项目根目录 | 见第 13 节 |
| 12 | 之前派出去的只读代码复核（第 7 组）结果没有拿到 | 无 | 接手后自己对第 7 组再做一次复核 |

---

## 9. 已完成的组：第 7–11 组（第 1 阶段）、第二阶段（引导式选伙伴、倾诉与圆桌、按文档校对）与第三阶段（沉淀与年轮）

### 9.1 手机伙伴页标题被滚出屏幕（2026-10-06 已修复）

**现象**：375×667 下选中最后一张伙伴卡（阿橘）后，标题「今天想先找谁玩？」移出屏幕，`e2e/onboarding.spec.ts` 里的 `toBeInViewport()` 断言在 mobile 项目上失败。

**根因**（用 `scripts/diag-companion.mjs` 对生产构建实测）：

1. `PaperScene` 根元素用 `overflow: hidden`，而 hidden 仍然允许程序滚动。舞台比视口大（要给视差留余量），`focus()` 把 `.paper-scene` 滚了 287px，整个浮层跟着上移，纸卡顶部落到 -259px
2. 伙伴列表的滚动容器是 `fieldset`，浏览器没有按预期裁剪它的内容：纸卡 scrollHeight 776 > clientHeight 623，选中卡片时聚焦又把纸卡本身滚了 153px

**修复**：

- `components/scene/PaperScene.tsx`：根元素 `overflow-hidden` → `overflow-clip`（clip 不允许任何滚动，包括程序滚动）
- `components/onboarding/Onboarding.tsx`：滚动容器从 `fieldset` 换到外层 `div`（`mt-4 min-h-0 shrink overflow-y-auto p-1`），`fieldset` 只负责网格布局

**修复后实测**：`.paper-scene` 完全不再滚动；选中阿橘后只有列表内部滚动（scrollTop 245），标题停在 76–108px、「一起入林」停在 583–631px，都在 667px 视口内。截图 `docs/onboarding/mobile-companion.png` 自检通过。

**教训**：`overflow: hidden` 只挡住用户的滚动，挡不住 `focus()` 引起的程序滚动；要让一块区域彻底不可滚动，用 `overflow: clip`。浮层「自己往上跑」时，先查祖先元素的 scrollTop。

### 9.2 第 7 组验收情况

对照 `specs/onboarding/spec.md` 逐条确认，均有测试覆盖：首次进入入林 / 再次进入直达森林；五步顺序；资料只在最后一步写入（中途刷新不写入）；昵称为空或全空白不可继续、最多 12 字；中途刷新从头开始；减弱动画时晨雾只淡出；IndexedDB 不可用时给出提示且能继续。

`tasks.md` 里 7.1–7.5 已勾选；8.2（`PopupCard`）已实现并有测试，一并勾选。

**复用已经在跑的 next dev**：Next 16 同一项目目录只允许一个 `next dev`，用户开着预览时 `npm run test:e2e` 的开发服务器起不来。用 `playwright.existing-dev.config.ts` 复用已在运行的实例（默认 http://localhost:3200，可用 `DEV_URL` 覆盖）。注意 `PLAYWRIGHT_BROWSERS_PATH=0` 要用本仓库 `node_modules/playwright-core/.local-browsers` 里的浏览器；不加这个变量时 WebKit（dev-iphone）会去找 `~/Library/Caches/ms-playwright` 而报「Executable doesn't exist」。

### 9.3 第 8 组：森林主场景（2026-10-06 完成）

**新增/改动的文件**

| 文件 | 作用 |
|---|---|
| `components/forest/ForestHome.tsx` | 森林浮层：欢迎条（昵称 + 今天的伙伴）、存储不可用的提示、`GatherControls`、角色卡、底部免责声明 |
| `components/forest/CharacterCard.tsx` | 角色卡内容（名字 / 物种 · 思维方式 / 「我的伙伴」/ 简介 / 心理学依据 / 样句 / 「一起玩：X」或「我的年轮」） |
| `components/forest/CompanionBadge.tsx` | 伙伴的小叶子徽记（`data-testid="companion-badge"`） |
| `components/forest/TreeSpot.tsx` | 古树的透明热区：`WorldActor` + `perspectiveScale={false}`，aria-label「岁岁，古树，森林守护者」 |
| `lib/scene.ts` 的 `TREE_HOTSPOT` | 树冠上的热区（x 0 / y 465 / 340×195 / depth 280），放在树冠是因为树干被啄木鸟、松鼠、猫头鹰占满 |
| `lib/stores/forest.ts` | 新增 `opened`、`openedAt`、`pendingGame` 与 `openCard / closeCard / startGame / closeGame` |
| `components/scene/ActorContext.ts`、`lib/scene/tap.ts`、`WorldActor`、`PaperPuppet` | 44px 可点区域（见下） |

**44px 可点区域（这段最容易踩坑，务必先读懂）**

- **两道缩放会互相抵消**：`WorldActor` 的 transform 是 `translate3d(x·unit·s, (y-500)·unit·s, -depth) scale(s·k)`（`s=(P+depth)/P`、`k=sizeAt(depth)`），它自己在 `perspective: 1000px` 的容器里又往后退了 `depth`，浏览器投影会再乘一次 `1/s`。所以**盒子的屏幕缩放 = `screenScale(depth, perspectiveScale)` = `perspectiveScale ? sizeAt(depth) : 1`**，舞台坐标恰好等于屏幕坐标。把它当成 `s·k` 会算小补量
- `lib/scene/tap.ts`：`transformScale(depth, perspectiveScale)`（给 transform 用）、`screenScale(depth, perspectiveScale)`（给热区算）、`tapTip(box, scale, min = 44)`（还差多少才够 44，按短边算）。纯函数，11 个单测
- 用法：`WorldActor` 里 `useTransform` 算出 `tapTip({width: w, height: h}, screenScale(...))` 塞进 `ActorContext`；`PaperPuppet` 把按钮里放一个 `aria-hidden` 的透明 `span[data-tap-cover]`，四边 `calc(pad * -0.5)` 撑开。**纸偶本来就够 44px 时不补**，否则会和旁边动物的热区抢点击
- `PaperPuppet` 上原来的 `minWidth/minHeight: 44` 已删掉：那是 transform 前的尺寸，够不到 44px 还会把纸偶撑变形
- 手机竖屏只有树上的笃笃和松鼠不够 44px（31.9×31.9、35.5×35.5），补完正好 44
- **横屏要把水獭和乌龟的落脚点分开**：补热区后两只的矩形相交 1.2px，把乌龟的首锚点从 `bank(220, 24)` 挪到 `bank(190, 24)`

**E2E（`e2e/forest-home.spec.ts`，8 个用例 × 2 项目）与踩过的坑**

- **森林一直在动，Playwright 的 `locator.click()` 等不到「元素稳定」**：手机上 `data-parallax = drift`（headless 里没有陀螺仪），相机用 20 秒李萨如曲线持续平移，3.2 秒漂 4px，`click` 直接 90 秒超时。改成先量出热区坐标、再 `page.mouse.click(中心)`（真正的命中测试，不等稳定性）
- 视差推到最大是**两个轴同时**推满：`hypot(32.4, 32.4) = 45.8`，断言要逐轴比 `≤ PARALLAX_MARGIN * 0.9`
- 桌面上鼠标停在点击位置本身就有视差偏移，关卡片后不能用 `isIdentity` 判断镜头归位，要比 `m43`（z）
- 手机上笃笃屏幕上只有 44px：先量「纸偶按钮 ∪ 补出来的热区」再点它的左上角，才真的验证到补出来的那一圈

**验证**（2026-10-06）：`npx vitest run` 27 文件 225 测试通过；`typecheck`、`lint` 通过；生产 E2E（mobile + desktop）26 个全部通过；开发服务器 E2E 30 通过 + 2 跳过 + `dev-iphone` 命中测试通过（需 `PLAYWRIGHT_BROWSERS_PATH=0`）。

**8.4 的两件收尾**（游戏面板本体、「回到森林后刚玩过的动物轻跳一下」）已在第 10 组一并做完并验证，见 9.5；`tasks.md` 的 8.4 已勾选。

### 9.4 第 9 组：小游戏通用部分（2026-10-06 已完成）

**做了什么**

- `lib/ai/types.ts`：`ForestAI` 接口（`splitThought` / `reframe` / `breakDown`）、思维陷阱表 `TRAPS`（灾难化、读心术、非黑即白、以偏概全）、三种翻面版本 `REFRAME_LABELS`（幽默版 / 温柔版 / 现实版）、字数上下限常量，以及 `textLength`（按字符数，emoji 算一个）和 `isValidInput`。失败文案只在这里写一次：`AI_FAILURE_LINE`「风太大了没听清，能再说一次吗？」
- `lib/ai/mock.ts`：`createMockAI({ delayMs?, shouldFail? })`。延迟默认 600–1200ms（由输入哈希决定，不用 `Math.random()`），同一输入 → 同一结果；支持 `AbortSignal`；`shouldFail()` 为真时 reject，错误信息就是 `AI_FAILURE_LINE`
- `lib/ai/index.ts`：唯一实例 `forestAI`，`shouldFail` 读 `useDevStore.simulateAIFailure`。第二阶段换实现只动这个文件
- `components/games/useAiRequest.ts`：`status: idle | thinking | ready | failed` + `run / retry / reset`。重试复用上一次输入，思考中重复提交直接忽略，卸载时 abort
- `components/games/GameShell.tsx`：标题、`回到森林`、思考中「{动物名}正在想…」（`role=status`）、失败时「{动物名}挠挠头：{AI_FAILURE_LINE}」+「再试一次」；`useGameBusy()` 给游戏禁用提交按钮；面板复用 `PopupCard`（折起动画、Esc、焦点回归都是现成的）
- `lib/games/dnd.ts` + `components/games/dnd/`：`zoneAtPoint`（纯函数，先写测试）、`DndProvider`（选中态 + 落点判定 + registerZone）、`Draggable`、`DropZone`。点选、键盘（Tab → 回车选中 → 目标回车）、拖拽三条路都通；没放进目标就 `dragSnapToOrigin` 弹回，也不产生任何结果
- `lib/dev.ts` + `components/dev/`：`devToolsEnabled(search, nodeEnv)`（开发环境恒真，生产要 `?dev=1`）、`DevTools`、`GameContextTray`（右下角小按钮，展开看 gameContext 条目、清空、「模拟 AI 失败」）。挂载点是 `ForestApp` 的森林浮层

**踩到的坑（别再重踩）**

- 拖拽落点判定不要用 motion 的 `PanInfo.point`：它的文档只说「相对 device 或 page」，有歧义。改成在 `onDragEnd` 里读拖拽元素自己的 `getBoundingClientRect()` 取中点，和 `DropZone` 的 rect 是同一套视口坐标
- `DevTools` 第一版在 `useEffect` 里 `setState(window.location.search)`，ESLint 的 `react-hooks/set-state-in-effect` 直接报错。改成 `useSyncExternalStore(subscribe, getSearch, getServerSearch)`：服务端快照是空串，客户端拿到真实地址后 React 自己重渲染
- 测试里 mock 的函数签名必须和 `AiOptions` 对齐（`signal` 是可选的），写成 `{ signal: AbortSignal }` 会被 `tsc` 拒绝；mock 不带参数时 `mock.calls[0][0]` 会被推断成空元组，报 TS2493
- `playwright.existing-dev.config.ts` 把**所有**项目都指向开发服务器后，「生产构建里不带 `?dev=1` 就没有调试抽屉」这条在开发服务器上必然失败。现在配置里加了 `metadata: { devServer: true }`，用例据此跳过，不再靠项目名猜

### 9.5 第 10 组 + 8.4 收尾 + 11.1：七个小游戏与游戏面板（2026-10-06 已完成）

**做了什么**

- `components/games/GameHost.tsx`：「游戏面板宿主」。读 `forest.pendingGame`，按 id 映射到七个游戏组件（knock-tree / fact-or-guess / flip-mirror / bear-hug / shell-breath / leaf-float / hide-nuts），没值或未知 id 就不渲染任何东西；游戏里的「回到森林」调 `closeGame()`，Esc 走 `PopupCard` 现成的那套
- `components/forest/ForestHome.tsx`：角色卡「一起玩」→ `startGame(gameId, opened)`（古树卡没有游戏，排除掉）；`<GameHost />` 挂在角色卡同一层
- `lib/forest/play.ts`：`playTokenFor(lastPlayed, playedTimes, id)` —— 刚玩过的那只拿到「已玩次数」（数字一变，`ForestAnimal` 的 effect 就跳一次），其它动物恒为 0，不会跟着起跳
- `components/forest/ForestAnimal.tsx`：新 prop `playToken`（默认 0），effect 里只在它非 0 时调 `puppet.current?.react()`
- `components/forest/ForestApp.tsx`：镜头多一档 —— 面板打开时停在「玩这只游戏时的动物位置」（`gameAt` + depth 140），关掉面板自动回到森林视角
- `lib/stores/forest.ts`：`gameAnimal` / `gameAt` / `lastPlayed` / `playedTimes`；`startGame` 记下位置并暂停走动，`closeGame` 记「刚玩过这只」并把次数 +1（没开着面板时按 Esc 不算玩过）
- 七个游戏（纯逻辑在 `lib/games/`，组件在 `components/games/`）：
  - 10.1 敲树洞 `knock-tree` + `lib/games/knock.ts`：3 秒停手结束一轮、连击与纸屑；情绪词最多选 3 个，笃笃按选择回应
  - 10.2 事实还是猜测 `fact-or-guess` + `lib/games/cbt.ts`：白 / 灰气泡拖进两个树洞，点评只说「像是…」不说「错了」，命中的思维陷阱用 `TRAPS` 里的名字
  - 10.3 翻面镜 `flip-mirror` + `lib/games/reframe.ts`：写想法 → 尾巴一扫 → `rotateY` 翻出幽默 / 温柔 / 现实三种说法；收藏任意一条才写 gameContext
  - 10.4 熊抱 `bear-hug` + `lib/games/hug.ts`：`pickNoRepeat` 保证 20 句本地文案不连着重复；长按约 1.5 秒记「和团团抱了 2 秒」，不足 1 秒提示「再抱一会儿」，暖光与 60 次/分心跳是纯 CSS/motion
  - 10.5 龟壳呼吸 `shell-breath` + `lib/games/breath.ts`：盒式呼吸 4-4-4-4，阶段与倒数由纯函数 `breathPhase()` 算，1–10 轮可选，Web Audio 提示音，暂停 / 结束
  - 10.6 落叶漂流 `leaf-float` + `lib/games/leaf.ts`：写的叶子只逐字晕开，不落盘、不进 gameContext（有测试盯着 IndexedDB 与 gameContext）
  - 10.7 藏坚果 `hide-nuts` + `lib/games/nuts.ts`：说三件今天做到的小事，折纸坚果放进树洞，跳跳打气
- `e2e/games.spec.ts`（11.1）：入林 → 逐个玩完七盘 → 打开右下角调试抽屉核对七条 gameContext

**踩到的坑（别再重踩）**

- 面板走的是 `PopupCard` 的折起动画（`rotateX` 从 −88° 到 0）。动画刚开始时 `boundingBox()` 会给出被投影压扁的盒子（实测 179×1.2px），照那个坐标 `mouse.down()` 点不到东西。要先 `await button.hover()`（Playwright 会等元素稳定）再量 / 按
- AI 游戏要等 mock 的 600–1200ms：点完「拆一拆」立刻收集气泡会拿到 0 个，得先 `expect(page.locator('[data-draggable]').first()).toBeVisible({ timeout: 15_000 })`

**验证**（2026-10-06）：`npx vitest run` **52 个文件 371 个测试全部通过**；`npm run typecheck`、`npm run lint` 零报错；`e2e/games.spec.ts` 对着 3200 上跑着的开发服务器（`playwright.existing-dev.config.ts`）mobile 46.7s、desktop 52.5s 各 1 个用例通过；截图 16 张在 `docs/games/`（七个小游戏各一张 + gameContext 抽屉一张，两个视口），抽看 mobile 的 knock-tree 与 game-context 两张，画风、排版、记录内容都对。

---

### 9.6 第 11 组收尾：11.2 画面底线、11.3 全量检查、11.4 README（2026-10-06 已完成）

**11.2 新增 `e2e/quality.spec.ts`（3 个用例 × mobile/desktop，生产构建和开发服务器都跑）**

1. 字体按分片加载、**入林之后**首屏也少于 30 个分片（`page.on("request")` 数 `resourceType() === "font"`；原来的 `e2e/prod.spec.ts` 只数了首页）
2. 森林里做动画的元素都不带 `filter`（同一批选择器 `[data-testid=paper-world], [data-puppet-body], [data-particle], [data-part], [data-layer]`）
3. 减弱动画（`test.use({ reducedMotion: "reduce" })`）：入林后 `data-parallax="none"`、粒子数量 0、没有「开启体感」按钮、隔 400ms 两次取样的 `paper-world` transform 完全相同（相机不漂移）、`[data-part] > g` 的 `animationName` 只允许含 `blink`

**这两个坑别再踩**

- 新写的用例要在 `finishOnboarding(page)` **之前**先 `await page.goto("/")`：helpers 里没有导航，忘了就只有一份 about:blank，每个用例都会在等「走进森林」时各超时 90 秒。
- `npm run test:e2e`（默认 `playwright.config.ts`）会自己起 3100 的生产构建和 3101 的 `next dev`。**用户本机开着 `npm run dev` 时，Next 16 会拒绝第二个 dev server**（`Another next dev server is already running`），整套 E2E 会以 `Error: Process from config.webServer was not able to start` 收场。收尾时改用：
  - 生产侧：`PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test --config=playwright.prod.config.ts`（只保留 mobile/desktop 与 3100 的 webServer）
  - 开发侧：`DEV_URL=http://localhost:3200 PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test --config=playwright.existing-dev.config.ts <文件> --project=dev-mobile --project=dev-desktop`（复用 3200 上那个 dev server）
  - WebKit 那条（`--project=dev-iphone`）必须带 `PLAYWRIGHT_BROWSERS_PATH=0`，否则会去找 `~/Library/Caches/ms-playwright` 里并不存在的 webkit 而直接失败

**顺手修掉的一个偶发测试**

`components/games/GameShell.test.tsx` 的「失败时动物挠挠头…」在全量并行跑时约 11 次会挂 1 次：userEvent 默认 `delay: 0`，最后一个字还没落进 DOM 就走到断言，读到「…，真」少一位。改成 `userEvent.setup({ delay: null })` 打字之后，单文件连跑 15 次、全量连跑 6 次全绿。（教训：`userEvent.type` 的默认 delay 在并行跑全量时是个竞态来源，断言输入框的值尤其容易踩。）

**11.3 全量检查（以下是真跑过的结果）**

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型 | `npm run typecheck` | 0 报错 |
| 代码检查 | `npm run lint` | 0 报错 |
| 单元／组件 | `npx vitest run` | 52 个文件、**371 个测试全部通过** |
| 构建 | `npm run build` | 成功（`/`、`/_not-found`、`/style-sample`） |
| 生产 E2E | `npx playwright test --config=playwright.prod.config.ts` | mobile + desktop **38 个全部通过（2.5 分钟）** |
| 开发 E2E | `… --config=playwright.existing-dev.config.ts`（3200） | **30 通过、2 跳过** |
| WebKit 命中测试 | 同上 `--project=dev-iphone` | **1 通过** |
| 截图自检 | 生产 E2E 顺带重生成 | `docs/onboarding/` 6 张、`docs/forest/` 4 张、`docs/games/` 16 张；已看过手机与桌面两个视口的森林主场景 |

**11.4 README**

`README.md` 从「开发中」一句话改成验收版：第一阶段已完成的功能清单（入林引导、2.5D 森林、七只动物与七个小游戏的表格、森林里的互动、`gameContext`、AI 是 mock、无障碍与体感）、测试与覆盖、待办（第二／三／四阶段，与第 11 节一致）、已知待改进 4 条、开发提示（`?dev=1` 调试抽屉、`/style-sample` 只在开发模式、`docs/` 截图、以及上面 dev server 冲突的绕法）。
写之前逐条核对过能力，只写了真的成立的：键盘路径确实可用（`components/games/dnd/Draggable.tsx` 是原生 `<button>`，Tab 聚焦 + 回车选中、到投放区再回车放下），对比度**没有**写成「已达标」——免责声明那行仍是第 8 节的遗留问题。

---

### 9.7 emoji 全清：迷你真纸偶当动物标记（2026-10-08 已完成）

**为什么**：用户看过七版样张（`docs/mockups/animal-marks-desktop.png`、`animal-marks-mobile.png`、`animal-marks-heads.png`；开发模式样张页 `app/mark-sample/` 用完已删）后选了第六版「迷你真纸偶」，并要求「不止是动物标记，所有 emoji 都改一下」。

**做法**
- `components/puppet/PaperPuppet.tsx` 把内部的 `PuppetSvg` 导出（形状、纸色、时段明暗、idle 动画都在里面）。
- 新增 `components/puppet/PuppetMark.tsx`：`<PuppetMark id size />` = 阴影层 + 本体两层 `PuppetSvg`，`aria-hidden`，没有按键、不响应指针；阴影偏移随尺寸走 `max(1, round(size * 0.04))`。
- 新增 `components/ui/PaperGlyph.tsx`：`<PaperGlyph kind="leaf" | "feather" size />`，叶子与羽毛的纸片图形，随字色（`currentColor`）。
- `lib/animals.ts` 删掉 `AnimalDef.emoji` 字段与八个值。消费方：`CharacterCard.tsx`（角色卡头部 44px）、`Onboarding.tsx`（选伙伴 22px）、`CastGallery.tsx`（调试抽屉 22px）、`GameShell.tsx`（「正在想…／挠挠头」提示行 16px）。
- 小游戏里的图形：敲树洞的树 72px、笃笃回复 16px、敲击时飘出的羽毛（PaperGlyph feather 22px）；熊抱的团团 92px 与回复 16px；藏坚果打气 16px；龟壳呼吸的龟 80px 与收尾行 16px；落叶漂流的叶子（PaperGlyph leaf 12px）。
- 三处按钮与徽记：「开始倾诉」「开启体感」里的叶子 18/13px、「我的年轮」里的小树 18px、伙伴徽记 11px 叶子。
- 图形全部 `aria-hidden`，所以按钮的无障碍名变干净了：`开始倾诉`、`开启体感`、`我的年轮`——E2E、规格文本、README 共 31 处同步改过。
- 保留 `✓`（已选伙伴）与 `✕`（关闭）：随字色的排版符号，不是 emoji。

**防回归**
- 新增 `lib/ui/no-emoji.test.ts`：扫 `components`、`app`、`lib` 的产品源码（跳过 `*.test.*`），出现 emoji 码点就失败，允许集只有 `✓ ✕`。
- 新增 `components/puppet/PuppetMark.test.tsx`：每只动物与古树都画得出来（aria-hidden、尺寸由 size 决定）、用的是纸偶自己的纸色、自己不产出文字。

**验证（2026-10-08）**
- 单测 54 文件 375 用例通过（原 52/371，新增 PuppetMark 3 例与 no-emoji 1 例）；typecheck、lint 零报错。
- 开发服务器 E2E：`onboarding / forest-home / games` 两个视口 24 passed，`forest-life.dev` 两个视口 10 passed（游戏用例把七个小游戏又走了一遍，无障碍名对得上）。
- 生产 E2E：38 passed，并重新生成 `docs/` 下所有截图；另加 `docs/forest/{mobile,desktop}-character-card.png` 两张角色卡头部，专门看 44px 的标记。
- 改动规模：已跟踪文件 51 个、+96 / −65（含 26 张重生成的截图）；新增 4 个文本文件共 182 行。

### 9.8 第二阶段开场：引导式选伙伴（`companion-guided-pick`，2026-10-08 已完成）

**为什么**（用户提过「选动物 = 性格测试 / 接入 MBTI / 星座」的设想，我把利害讲清后用户拍板「就按你说的做」）
- 不做人格测验，也不做星座：入林第一句是「不用急着变好。先在这里，歇一歇」，在门口先测验再贴标签等于把安慰换成了评估；人格标签重测一致性差、星座没有心理学依据，也会削弱七只动物各自挂着的真实依据——它们是七种**方法**（情绪标注 / CBT / 认知重构 / 自我关怀 / 10-10-10 + 正念 / ACT 认知解离 / 行为激活），不是七种人格。
- 改成问「此刻你想被怎么对待」：三道题，给出恰好一只动物和一句「为什么是它」，可以接受也可以自己挑；本机记一条 `selfPicks { at, want, animalId, source: "self" | "guided" }`，作为第三阶段年轮与 AI 上下文的原料。
- 写进规格的边界：MBTI 最多是「用户自己填的、可选的一段自我描述」，星座不进模型；**任何标签都不决定推荐谁**，推荐只由当下的答案算出来；「测试感」的玩法留到第三阶段的年轮与自我探索，不在门口拦人。心理特征属敏感信息，进 AI 上下文前要明示并最小化。

**做法**
- `lib/onboarding/selfpick.ts`（纯逻辑 + 9 例测试）：`SELF_PICK_QUESTIONS` 三道题——第 1 题「此刻，你最想被怎么对待？」6 个选项、最多选两项；第 2 题 4 个选项；第 3 题 3 个选项。每题都带中立选项（`unsure`：算作答过，但不投票）。`recommend(answers)` 只由答案计票，平票时后答的题优先，七只动物都可达；`recommendLine` 只用当时的答案措辞，不出现「性格 / 类型 / 人格」。
- `components/onboarding/Onboarding.tsx`：第 5 步分三种形态。cards 是原来的七张卡 + 「不知道找谁？帮我看看」；guided 是「第 N / 3 问」+ 选项（`aria-pressed`）+ 上一问 / 下一问 / 看看推荐；result 是迷你纸偶 + 一句为什么 + 「看的是你此刻的需要，不代表你是什么样的人。」+ 「就是它」/「还是想自己挑」。点过引导又回到卡片不算推荐过，只记 `source: "self"`。
- `lib/db/profile.ts`：`Profile` 增加 `selfPicks: SelfPick[]`（老资料读出来是空数组）。不建索引，所以 Dexie 不升版本。

**验证（2026-10-08）**
- 单元与组件：`npx vitest run lib/onboarding lib/db` 21 例、`npx vitest run components/onboarding components/forest lib/stores` 35 例通过；typecheck、lint 零报错。
- E2E：`e2e/onboarding.spec.ts` 新增「走『帮我看看』入林，推荐的那只成为今天的伙伴，selfPicks 记下是引导来的」，手机与桌面两个视口都通过（8 passed / 29.5s），用例里直接读 IndexedDB 断言那条记录，并留下截图 `docs/onboarding/{mobile,desktop}-guided.png`。

### 9.9 第二阶段：倾诉与圆桌（`stage2-roundtable`，2026-10-08 完成）

**做了什么**：点「开始倾诉」，七只聚到古树前坐好，界面依次走 心情打分（1–10，可跳过）→ 写下想说的话（≤1000 字）→ 聆听 → 风险守护 → 圆桌发言 → 古树总结 → 追问 → 收尾回森林。本阶段不落盘（第三阶段才存年轮）。

**服务端**（`app/api/*/route.ts`，七个 Route Handler，全部 `POST`）：倾诉四个 `roundtable` / `summary` / `reply` / `risk`，小游戏三个 `split-thought` / `reframe` / `break-down`。统一回话体在 `lib/ai/route.ts`：成功 `200 {ok:true,data}`，入参不对 `400 {ok:false,reason:"invalid"}`，没配 Key `503 unavailable`，模型没给合用结果或抛错 `502 upstream`；`runAi(call)` 把抛错与 null 都变成 502。**整个目录没有一行日志**——用户写的话不进日志。

**模型调用**（`lib/ai/anthropic.ts`）：`DEFAULT_MODEL_MAIN = "claude-sonnet-5"`、`DEFAULT_MODEL_LIGHT = "claude-haiku-4-5-20251001"`（抄自产品需求第 19–21 行，**上线前要用当时可用的模型 ID 核实**，改 `JIEYOU_MODEL_MAIN` / `JIEYOU_MODEL_LIGHT` 即可）；`MAX_TOKENS_MAIN = 2000`、`MAX_TOKENS_LIGHT = 300`、`MAX_TOKENS_GAME = 800`；`ANTHROPIC_VERSION = "2023-06-01"`。`createAnthropicTransport(apiKey)` 是唯一碰网络的地方，抛错只带 `"anthropic " + status` 或 `"anthropic empty response"`，**不带用户文本**；`parseModelJson(raw)` 能吃纯 JSON、```json 围栏、前后夹解释文字三种写法；`createServerAI({transport, modelMain, modelLight})` 可注入假 transport（单测就是这么跑的）；`defaultServerAI(env)` 没有 `ANTHROPIC_API_KEY` 时返回 null 且一次请求都不发。

**入口与守卫**：路由只通过 `lib/ai/server.ts` 的 `getServerAI()` 拿 AI（测试用 `__setServerAIForTest` / `__resetServerAIForTest`，不必配 Key、不打网络）；`lib/ai/request.ts` 是入参守卫（`TALK_MAX = 1000` 是我定的倾诉上限，产品文档只写「支持长文本」；还有 `NICKNAME_MAX = 12`、`GAME_CONTEXT_MAX = 20`、`MEMORY_MAX = 12`、`HISTORY_MAX_INPUT = 40`、`NOTE_MAX = 200`、心情 1–10 整数）；`lib/ai/schema.ts` 是模型回复的**严格守卫**：七只发言必须不重不漏、只允许 animal/text/mood 三个键、多余字段一律判失败，总结五段齐全且总字数 ≤200、voices 2–3 条，追问 ≤150 字，风险三档且 reason ≤60。

**Prompt**（`lib/prompts.ts`）：`roundtablePrompt` / `summaryPrompt` / `replyPrompt` / `riskPrompt` 四个，外加三个小游戏模板 `splitThoughtPrompt` / `reframePrompt` / `breakDownPrompt`。上下文由 `contextBlock()` 拼（昵称、今天的伙伴、心情分、他说的原文；小游戏留下的、以前的记忆、对话记录都**只在非空时**出现小节），历史只取最近 `HISTORY_MAX = 12` 条；`PLAIN_STYLE` 是那四条语气规矩（口语化、先共情再给视角、动作描写放括号、只输出 JSON）。

**前端一个入口**：`lib/ai/index.ts` 导出 `forestAI` / `getForestAI()`，实现换成 `lib/ai/http.ts` 的 `createHttpAI({fetch, shouldFail})`（`?dev=1` 的「模拟 AI 失败」照旧生效）；`lib/ai/client.ts` 的 `postJson` 只认 `{ok:true,data}`，没连上、非 2xx、形状不对都抛同一句 `AI_FAILURE_LINE`，只有 AbortError 原样抛。**七个小游戏一行没改。** 没有 Key 时不偷偷退回第一阶段的本地模拟，而是显示同一句降级话 +「再试一次」（`lib/ai/mock.ts` 留作离线参考）。

**倾诉流程**：纯逻辑在 `lib/talk/`——`flow.ts`（`roundtableOrder` 伙伴先、`parseMention` 拆 `@墨墨`、`localGuard` 本地粗筛、`reveal` 打字机切片、`speechesAsHistory` / `replyHistory`）、`guard.ts`（`PRIVACY_LINE` 与 `guardCopy`，高风险三条路里只写「搜城市名 + 心理援助热线」，**不写未核实的号码**）、`api.ts` / `client.ts`（四个接口的调用）。状态机在 `lib/stores/talk.ts`：`phase = away | mood | listening | risk | roundtable | summary | followup`，动作 `open / setMood / setText / submit / gotSpeeches（按圆桌顺序排、同名去重）/ next / showAll / toggleMark / guard / resume / toSummary / toFollowUp / addReply（留最近 20 条）/ again / finish`，还有 `bubble`（头顶气泡的进度字）和 `toRoundtable()`（圆桌没接上时从「聆听」里出来，别让人干等）。界面在 `components/talk/`：`MoodStage` / `ListeningStage` / `RiskStage` / `RoundtableStage` / `SummaryStage` / `FollowUpStage` / `FailureLine` / `TalkFlow`，编排在 `useTalkFlow.ts`（提交时**并行**发本地粗筛的风险判定与圆桌请求；本地 high 直接守护且不打 `/api/risk`；服务端调用失败按 low 处理——宁可多报）。

**舞台上发生的事**：发言的那只走到古树前方（`lib/forest/podium.ts` 的 `PODIUM_DEPTH = 16`、`podiumSpot()` / `podiumPlan()`），`ForestAnimals.tsx` 用 `send(id, {to, facing, maxDuration: SPEAK_MAX_SECONDS = 3})` 下指令，说完送回座位；`ForestAnimal.tsx` 多两个 prop `speaking` / `bubble`（放大 1.14 + `speaking-glow` + `talk-bubble`，气泡里第一行是「名字 · 思维方式」）；古树在总结时发光（`components/scene/CrownGlow.tsx` 的 `data-testid="tree-glow"`）；倾诉期间动物停止走动、粒子停下（`Particles` 的 `quiet`）。

**无障碍**：只用键盘能走完整个倾诉（打分 → 输入 → 说给它听 → 下一位 → 总结 → `@` 追问 → 结束，`TalkFlow.test.tsx` 的 describe「只用键盘」用 `tabTo()` 一路断言 `document.activeElement`）；热区仍 ≥44×44；减弱动画下头顶气泡整段出现（`useTypewriter` 在 `reducedMotion` 时直接返回整句）。

**这一轮踩到的坑（可复用）**：
1. **E2E 的假服务端必须给满七只发言**：客户端 `lib/talk/api.ts` 用的是同一个严格守卫，只回 2 条发言会被判不合格 → 页面显示降级话（第一轮 6 个用例全挂就是这个原因）。同理 summary 的 voices 要 2–3 条。
2. **生产 E2E 里三个 AI 小游戏必须 stub**：`e2e/games.spec.ts` 的 `stubGames(page)` 拦 `/api/split-thought` / `/api/reframe` / `/api/break-down`；否则没有 `ANTHROPIC_API_KEY` 的构建里小游戏拿到 503，拿不到气泡（第二轮 4 个失败）。
3. **PopupCard 的折起动画期间量到的盒子是压扁的**（这次 desktop 量到 3.94px）→ 先 `await button.hover()` 等稳定再量。
4. **「全部显示」只在还没全说完时存在**：两条发言时点完「下一位」，按钮已经换成「听听古树怎么说」/「我还想说一句」（键盘用例因此去掉了这一步，E2E 里 7 条发言时覆盖）。
5. **「心结解开了」之后按钮不是立刻回来**：要先等大家散开走回位置，断言 timeout 给到 20_000 才稳。
6. **`useScene()` 不能在 `PaperScene` 外用**（会抛「useScene 必须在 <PaperScene> 内使用」），组件里要判断减弱动画就用 `useReducedMotion()`。
7. **组件测试里改 store 要包 `act()`**，且 vitest 配置没开 globals → 每个组件测试文件要自己 `afterEach(cleanup)`。
8. **`vi.mock` 工厂里不能引用顶层 const**（报 "Cannot access 'api' before initialization"）→ 用 `vi.hoisted` 定义假对象。
9. **点角色那一下会落空**：镜头推进/缩回的那半秒里热区一直在动，量到的坐标已经过时（生产 E2E 里两处「点不开卡片」的偶发都是这么来的：`forest-home.spec.ts` 的 owl、`games.spec.ts` 的第 4 个游戏）。修法：`e2e/helpers.ts` 新增 `settleCamera(page)`（等 `paper-world` 的 m41/m42/m43 不再变，最多 1.5 秒）并在 `tapActor` 里先等它；`forest-home.spec.ts` 的 `openCard()`、`games.spec.ts` 的 `openGame()` 再兜一层「没开出来就重试」（`expect(async () => {...}).toPass()`）。
10. **「开启体感」会盖在对话框上面**：它和 `PopupCard` 的背景层都是 `z-30`，同一层里谁在 DOM 后面谁在上面 —— 按钮原来写在 `{overlay}` 后面，于是在总结那一屏把卡片的字压住，点它还会落到卡片外面、把话头打断。修法：`PaperScene.tsx` 里把按钮移到 `{overlay}` 之前；`e2e/talk.spec.ts` 加了一条守卫（打分那一屏用 `document.elementFromPoint` 取按钮位置上的元素，必须是对话框而不是按钮；把顺序改回去这条就红，已验证过红→绿）。
11. **「开始倾诉」一直在森林里**，所以「等它可见」不能当「上一块面板关掉了」用（面板还在的那一瞬间它照样可见）→ 关面板要等那个按钮自己消失（`expect(back).toHaveCount(0)`）。

**验证（2026-10-08，全部真跑过）**：`npm run typecheck`、`npm run lint` 零报错；`npm test` **71 个文件 504 个用例全部通过**（57s）；`npm run build` 成功（生产 E2E 的 webServer 就是 `npm run build && npm run start -p 3100`）；**生产 E2E 全量 46 passed（6.3m）**——quality / onboarding / games / forest-home / talk / devtools / prod 全部 spec × mobile + desktop，中途暴露的 6 个偶发（视差没推到最大、三个 AI 小游戏没 stub、点角色落空、层级盖住卡片、面板没卸干净、按钮等待太短）全部定位并修好，见上面第 1–5、9–11 条；倾诉 E2E（3 个用例 × 两个视口）**6 个通过 / 27.5s**；两视口截图在 `docs/talk/`（打分、圆桌、古树总结），看图确认过层级修复后的总结页不再被「开启体感」压住。任务清单 `openspec/changes/stage2-roundtable/tasks.md` 24 项全部勾选。

**入林说明卡的文案同步改了**（`Onboarding.tsx`）：原来写「本阶段不向外部服务发送内容」已经不对，改成两段——「你的昵称、伙伴和游戏记录，只存在你自己的设备上」与「倾诉时你写下的话，会发给本站的服务端、交给模型帮你生成回应。那边不写日志，也不会把它留下来」。`Onboarding.test.tsx` 有一条守这段文案。
### 9.10 按产品文档逐节校对第二阶段（`doc-alignment`，2026-10-08 完成）

**为什么**：用户 2026-10-08 提出「感觉很多设计思路都复用了本地另一个叫解忧森林的项目」，要求严格按 `解忧森林-prompt.md` 实现、文档没写的自己设计、不复用那个项目。

**顺手核对的证据（我们确实没读它的源码）**：那个项目在 `/Users/lang/Desktop/比赛/jieyou-forest`（Electron + Capacitor，8 只动物、每只一个剪影色块，标题如「探索破局者」）；我们这边是产品文档第四节那张表里的 7 只（笃笃 / 墨墨 / 阿橘 / 团团 / 慢慢 / 漂漂 / 跳跳），`lib/animals.ts` 用 PuppetPart + 关节点 + `roughPath` / `seeded()` 程序化毛边，两边的 path 数据没有一条相同。导入的 claude-code 历史里 `CampfireCouncil` / `AnimalSprite` / `RingFacts` 这些名字出现 0 次（仅有的两次来自我用 `gh api` 列它的提交标题挑仓库名）。完整审计方法见 `openspec/changes/doc-alignment/proposal.md`。

**改回文档写法的七处**

| 文档条款 | 原来（我自己设计的） | 现在 |
| --- | --- | --- |
| 第八节：每条消息先用 Haiku 判风险，三级 none / concern / crisis | 本机粗筛命中才问服务端；等级叫 none / low / high | `lib/ai/schema.ts` 的 `RISK_LEVELS = ["none","concern","crisis"]`；`lib/prompts.ts` 的 `riskPrompt` 三档说明重写；`lib/talk/flow.ts` 的 `needsServerCheck(local) = local !== "crisis"`——**每句话都问服务端**，只有本机已经认出危险词才不打扰它；词表改名 `CRISIS_MARKERS` / `CONCERN_MARKERS` |
| 第八节 crisis：暂停游戏化、不圆桌、古树认真温和地回应、求助卡给 12356 / 400-161-9995 / 110 / 120（上线前核实）、确认安全后才能继续 | 只有三条出路 +「我还想说，继续吧」直接继续，**故意不写号码** | `lib/talk/guard.ts` 重写：`CRISIS`（`treeSays` 岁岁先说话 +「先停一下，我们慢慢来」+ 三步 + `hotlineTitle`「现在就能接住你的人」+ `confirm`「我现在是安全的」）与 `HOTLINES`（三个号码，注释写明上线前必须再核实）；`components/talk/RiskStage.tsx` 加求助卡与复选框，**勾上才能继续**；`useTalkFlow.checkRisk` 改成顺序——crisis 时 `guard()` 且**根本不发圆桌请求** |
| 第八节 concern：照常进行，古树在总结里温和地提一句可以寻求专业支持 | 没有这一档 | store 加 `concern` + `markConcern()`；`PromptContext.concern` 传给 `summaryPrompt`（只在为真时多写一句「值得有一个真人陪他一起看」，不吓人、不下结论）；`SummaryStage` 在岁岁整理时显示 `CONCERN_LINE` |
| 6.3.4 聆听动画：点头、竖耳朵、团团托腮 | 没做 | 新增 `lib/talk/gesture.ts`（`LISTEN_GESTURE`：松鼠竖耳朵、团团托腮、其余点头）与 `lib/puppet/gesture.ts`（每种动作的关键帧与节奏） |
| 6.3.6 其他动物反应动画：点头、思考、笑 | 没做 | `REACTIONS = ["nod","think","smile"]` + `reactionPlan(cast, speaker, round)`（跳过正在说话的那只，随 `shown` 轮换）；`ForestAnimals` 给每只算 `gestureFor(phase, id, reactions)` |
| 6.3.6 按钮名「全部显示」 | 我写成「一起说完吧」 | `components/talk/RoundtableStage.tsx` 改名（测试与 E2E 同步） |
| 6.3.8 点动物头像指定回答人 | 只支持 `@名字` | `FollowUpStage` 加一行 8 个纸偶头像（`role="group"`、`aria-pressed`、热区 ≥44px），点选后提示「这句话会交给：X」；写了 `@名字` 时以文字为准（`lib/talk/flow.ts` 的 `mentionsTarget()` + `useTalkFlow.ask(question, chosen)`） |

**画面上的做法**（`components/puppet/PaperPuppet.tsx` 现有 278 行）：新增 `gesture` / `gestureLoop` 两个 prop 与 `data-gesture` 属性；动作由 `animate()` 直接打在 `[data-part^="head"]` 这类节点上，减弱动画下仍然标出动作但不播；用 `lastGesture` ref 保证同一个动作不会重放；狐狸没有 `arm-*` 部件，`grounded` 过滤后自动退回头部点头。

**验证（2026-10-08）**：`npx vitest run` **74 个文件 526 个用例全部通过**（上轮 71 / 504；新增 `lib/talk/gesture.test.ts`、`lib/puppet/gesture.test.ts`、`components/puppet/PaperPuppet.test.tsx`，并补了危机分支、concern、点头像点名的用例）；`npm run typecheck`、`npm run lint` 零报错；生产 E2E（`playwright.prod.config.ts`）**50 个全部通过（3.5 分钟）**——新增两条守护页用例（本机认出 / 服务端判出，都断言没有发圆桌请求），并在圆桌用例里断言没说话的动物身上有 `data-gesture="nod|think|smile"`。截图新增 `docs/talk/{mobile,desktop}-talk-guard.png`。

**踩到的两个坑**：① `getByRole("alert")` 在 Next 里会同时命中路由播报器 `#__next-route-announcer__`，守护页要写成 `[role="alert"][data-autofocus]`；② 之前 E2E 里点「全部显示」的用例与文案要一起改。

**又补的两处（同一轮的第二次校对）**：① 文档第四节那一列的**语气**进了 Prompt——`lib/prompts.ts` 的 `castBlock()` 每行末尾加「；语气：{tone}」，`replyPrompt` 改成「用 X 自己的语气（tone）与思维方式」；② 「让大家再说说」再请一轮时**带上已经说过的**——`components/talk/useTalkFlow.ts` 的 `startRoundtable(text, history)` 与 `again()`（用 `speechesAsHistory(state.speeches)`），免得第二轮复读；单测补 `lib/prompts.test.ts` 两条与 `components/talk/TalkFlow.test.tsx` 一条，E2E 主流程里加了一段（点「让大家再说说」→ 回到第一句 → 全部显示 → 再请古树总结）。

**还没做的两件事（等用户拍板）**：① 6.3.3 的可选**语音输入**；② 第 5 步那个「不知道找谁？帮我看看」的**引导选伙伴**是产品文档之外加的一步，去留等用户定。

### 9.11 第三阶段：沉淀与年轮（`stage3-rings`，2026-10-08 完成）

**做了什么**：把「倾诉结束」到「年轮里能翻到这一天」整条链路接上，全部只写本机。

**1. 数据层（Dexie 第 2 版）**

- `lib/journal/types.ts`：`Message` / `Session` / `Memory` / `MemoryDraft`（模型只回 8 个字段，`helpfulAnimals` 与两次心情分由客户端补）、`SessionStatus = open | resolved | paused`、固定标签库 `THEMES`（13 个，末尾兜底「其他」）、`sanitizeThemes(values, max = 3)`（只留库内的、去重、最多 3 个、空了回「其他」）与一串字数上限常量。
- `lib/db/db.ts` 新增 `openJieyouDb(name)`：`version(1)` 只有 `profile`，`version(2)` 加 `sessions: "id, startedAt, status"` 与 `memories: "id, date, sessionId"`；没有 indexedDB 或打不开时返回 `null`（不抛）。
- `lib/db/journal.ts` 新增 `createJournalStore(dbName)`：`saveSession / getSession / listSessions（startedAt 降序）/ latestPaused / listMemories（date 降序）/ deleteMemory / clear`，打不开库时退回内存实现（`persistent: false`）。
- `lib/db/profile.ts` 改成共用 `openJieyouDb`；`lib/stores/journal.ts` 是界面用的 zustand：`memories` / `paused` / `ready` / `persistent` 与 `load / addMemory / putSession / removeMemory / clear / getSession`。
- 迁移有测试守着：手工用 `version(1)` 写一行 profile，升到第 2 版后还能读回来（`lib/db/journal.test.ts`）。

**2. 年轮纯函数（`lib/rings/rings.ts`）**

- 圈宽 `ringWidth(count) = clamp(6 + count * 4, 6, 26)`；配色 `ringColor(emotions)` 取出现最多的情绪，并列取先出现的，认不出就 `#c9c0ae`（`EMOTION_COLORS` 十条）。
- `yearRings` / `monthRings(memories, year)`（固定 12 圈，1 月最内）/ `dayRings(memories, year, month)`（只含有记录的日子）/ `highlightIds(memories, theme)` / `breadcrumbOf(year, month, day)` / `dateKey(y, m, d)`。
- `demoMemories(seed, today)`：用 `seeded()` 造的 8 条假记录，跨 2–3 年、当年不越过今天，id 是 `demo-N`，按日期升序。

**3. 沉淀链路（模型 → 卡片 → 库）**

- `lib/prompts.ts` 新增 `memoryPrompt(context)`（文档 10.4）：输出 8 个字段，title ≤12、summary ≤60、emotions 1–5、themes 只从标签库挑 1–3、coreBelief ≤40、shift 各 ≤20、insight 第一人称 ≤40、action ≤30 可省；`lib/ai/schema.ts` 的 `parseMemory` 是手写严格守卫（多一个键都算不合格）。
- `lib/ai/anthropic.ts` 加 `memory()`，`lib/talk/api.ts` 加 `memory()`，`app/api/memory/route.ts` 与 summary 路由同形 —— 服务端一共八个 handler。
- `lib/journal/settle.ts` 是纯函数：`localDate(now)`（本地时区 YYYY-MM-DD）、`messagesFromTalk(log)`（把「我写的 + 七只说的 + 总结 + 追问」编成消息流，`resonated` 只看点过「说到心里了」的动物）、`helpfulAnimalsOf(messages)`、`memoryFromDraft({draft, sessionId, date, helpfulAnimals, moodBefore, moodAfter})`、`sessionFromTalk({...})`。

**4. 结束流程（再次打分 → 生长 → 成长卡片）**

- `lib/stores/talk.ts`：`TalkPhase` 增加 `rate | grow | card`，新增 `startedAt` / `moodAfter` / `memory` / `memoryStatus`，动作 `toRate / setMoodAfter / toGrow / memoryFailed / gotMemory`。
- 总结页与追问页的「心结解开了」现在调 `toRate()`（不再直接回森林），「先放一放」调 `onPause`。
- `components/talk/RateStage.tsx`：1–10 打分（可跳过，进来时没打过分就说明这次也能跳）→ 两个按钮都会 `toGrow()` 再调 `flow.settle()`。
- `components/talk/GrowStage.tsx`：岁岁把这一次收进年轮（两圈纸环 + 一个光点，减弱动画时不动）；失败显示同一句降级话与「再试一次」。
- `components/talk/useTalkFlow.ts` 的 `settle()`：写记忆、写 `resolved` 会话、`gotMemory()`；`pause()`：只写 `paused` 会话（不沉淀）。
- `components/rings/GrowthCard.tsx`：日期与标题、心情 4 → 7（缺分写「没打分」）、「从『…』到『…』」、领悟、下一步、帮到我的动物（`PuppetMark`）。

**5. 年轮页与暂停提示**

- `components/rings/RingBrowser.tsx`（400 多行）：年层 → 12 圈月轮（没记录的月份是浅色细线）→ 有记录的日子 → 当天成长卡片，「那天的对话」用 `<details>` 惰性取原文；面包屑逐级返回；主题筛选只点亮相关的圈；空状态「你的第一圈年轮，正在生长」。环形只有描边能点，所以每个 `RingRow` 上另加了一圈透明加宽的 `pointerEvents="stroke"` 热区，键盘也能进（Enter / 空格）。
- `lib/rings/gesture.ts`：`zoomIn`（进到那年**最近有记录的**月 / 那天）、`zoomOut`（逐级退）、`pinchDistance`、`pinchAction`（1.25 倍阈值）、`isBackSwipe`（向右 80px 且纵向不过 80）。年轮页上双指张开／捏合、向右划、桌面按住 Command 滚一格都接上了。
- `components/forest/PausedPrompt.tsx`：有 paused 会话时岁岁问「上次那件事，还想接着聊吗？」并复述上次最后那句；「接着聊」把那次注入倾诉流程，「先不用」只是这次不显示（库里不动）。
- `components/forest/CharacterCard.tsx` 的「我的年轮」从纸条提示改成真入口（新 prop `onRings`）；`components/forest/ForestApp.tsx` 进森林时 `useJournalStore.getState().load()`。
- `?dev=1` 的调试抽屉新增 `components/dev/DemoDataButton.tsx`「生成演示数据」（`demoMemories(DEMO_SEED = 20260401)`，同种子同结果）。

**6. E2E**：新增 `e2e/rings.spec.ts`（两个用例 × 两个视口）——① 走完一轮 → 再次打分 8 分 → 成长卡片 → 进年轮 → 年层／月层／日层 → 那天的对话 → 面包屑回年层；② `?dev=1` 下先看空状态，再点「生成演示数据」长出一圈以上的跨年年轮，并试主题筛选。`e2e/rings.spec.ts` 的 `shot()` 在拍之前会等所有 `.paper-card` 的 `transform` 落定（PopupCard 是从底边折起来的，不等就拍到压扁的中间帧）。`e2e/talk.spec.ts` 的收尾改成新流程（`serveAll()` 里要补 `**/api/memory` 假接口；注意 `**/api/risk` 那行在文件里出现两次，锚点要连上下一行）；`e2e/forest-home.spec.ts` 里那条改成「从古树卡片走进年轮，还没沉淀过时是空状态」。

**验证**：`npx vitest run` **85 个文件 605 个用例全部通过**（第三阶段开工前是 78/563）；`npx tsc --noEmit`、`npx eslint .` 零报错；生产 E2E（`playwright.prod.config.ts`，mobile + desktop）**54 个全部通过**（含新增的年轮两条与改写后的倾诉一轮）；截图 16 张在 `docs/rings/`。

**踩过的坑（别再重踩）**

1. **Next 说「Failed to type check」不一定是类型错误**：那次是磁盘临时写满（`ENOSPC`，playwright 建 `test-results` 时报出来），`rm -rf .next` 后一次就过。跑 E2E 前顺手看一眼 `df -h`。
2. 环形 SVG 的点击热区只在描边上：E2E 里用 `target.click({ position: { x: box.width / 2, y: 2 } })` 点最上面那一点，点中心会落进别的元素。
3. 「跳过打分」本身就会走沉淀，别再补点一下「看看这次留下了什么」——那一屏已经翻过去了（`getByRole` 会等到超时）。
4. 生长动画那一屏在本地假接口下一闪而过，E2E 里断言 `ring-growing` 是竞态；只认结果 `growth-card`（动画本身由 `components/talk/Stage3.test.tsx` 的单测守着）。
5. 改大文件（HANDOFF / README）不要用「read 全文 + write 回写」：`read` 对大文件会静默截断。一律「读 → 精确锚点替换（断言只命中一次）→ 写回」，脚本落到 `/tmp/*.py` 再执行。
6. 年轮最初只有圈没有字：年层看不出是哪一年、悬停也没有反应。补法是 `RingRow` 上画 `<text data-testid="ring-label">`（年圈传年份），并让每圈在悬停／聚焦时把名字报给下面那行 `ring-caption`（`focus ?? pathName ?? "点一圈，看看那一年"`）；面包屑按钮要 `whitespace-nowrap`，否则「全部」会折成两行。两处都有单测（`components/rings/RingBrowser.test.tsx` 的「年轮上的名字」）。
7. 手势用例的语义容易写反：点进某一年之后本来就在月层，所以捏合之后要断言 `queryAllByTestId("ring-month")` 为空（回到年层），不是还有。

### 9.12 年轮改成一盘纸雕（2026-10-08 完成）

用户在 2026-10-08 提了第二件事：「年轮纸雕感要 2.5D」。产品文档 §3.5 的原文要求是「每一圈是一张环形纸片，从外到内一层层叠高（等高线纸雕），最内圈最高；点击某一圈时这圈纸片抬起、发光，再展开成下一级年轮」。这一节记的是怎么做的、验到了什么、以及三个坑。

#### 新增：`lib/rings/stack.ts`（纯函数，配 6 个用例）

- `LAYER_STEP = 7`、`LAYER_THICKNESS = 3`、`RISE_MS = 340`、`RISE_EXTRA = 10`。
- `layerLifts(total, step)`：从外到内的层高表，最外一圈是 `0`、最内最负（**把 `-0` 归一成 `0`**，因为 `toEqual` 区分 `0` 与 `-0`，这是个真踩过的坑）。
- `annulusPath(radius, width, cx, cy)`：两个圆子路径 + `fillRule="evenodd"` 挖空，`inner <= 0.5` 时就只剩一张圆纸片。
- `shade(color, amount)` / `lighten(color, amount)`（只认 6 位 `#rrggbb`，认不出原样返回）、`sparkAt(radius, cx, cy)`（正上方那一点）。

#### 改：`components/rings/RingBrowser.tsx`（465 → 约 530 行）

- `RingRow` / `DayBead` 两个组件删掉，换成 `PaperRing`：一组是 `<g data-ring-layer data-testid data-lift data-raised data-highlighted data-focused style={{transform, transition}}>`，里面按顺序画四张——`[data-ring-shadow]` 纸下的浅影（比纸宽 3px、下移 6px）、`[data-ring-side]` 裁口侧面（压暗 24%、下移 3px）、`[data-ring-face]` 纸面、最后 `[data-ring-hit]` 加宽的透明热区（`pointerEvents="fill"`、`role="button"`、`tabIndex`、`aria-label`）。抬手时多一张 `ring-rise-glow`，主题筛中时多一张 `data-ring-glow`，有记录的月份多一颗 `month-spark`，年份/日期写在纸边下面。
- 整盘往下挪半个层高，最内圈抬起来不会顶出画框：`lifts = day !== null ? dayLifts : month !== null ? monthLifts : yearLifts`、`shiftY = -Math.min(0, ...lifts) / 2`；圆心那颗「胚」是 `ring-core`（也是两张圆纸片）。
- 几何跟着数据走：年层 `YEAR_BASE = 32`、`YEAR_STEP = 26`、`YEAR_MAX = 104`，年多了就把圈压窄（`yearStep = min(26, (104 - 32) / (年数 - 1))`）、抬高按 `max(6, min(14, round(36 / (年数 - 1))))`；月层 `MONTH_BASE = 14`、`MONTH_STEP = 7`，没记录的月份不是纸环而是 1.5px 的浅色细线（仍然 11 条），跟着层高一起垫起来，于是月层看上去是一圈圈的等高线；日层 `DAY_BASE = 18`、`DAY_MAX = 100`，步长与宽度都按天数自适应，**只有一天的时候把这一圈画粗、往外挪（半径 34、宽 14）**，免得缩成一颗小点。
- 点击两拍：`RingBrowser({ onClose, riseMs = RISE_MS })` 里 `pick(id, run)` 先把那一圈抬起来发光（`rising`），`setTimeout` 到点再展开成下一级；`riseMs <= 0` 或 `prefers-reduced-motion` 时直接进。点开某一天之后，**那一圈仍留在盘上并亮着**（下面是那天的成长卡片），不会剩一张空盘。
- 键盘焦点不再画浏览器那个蓝方框：热区 `outline-none`，落到哪一圈就用那一圈自己的纸色发光（`data-focused`），同时下面那行 `ring-caption` 报到名字。

#### 验证（2026-10-08）

- `npx vitest run`：**86 个文件 617 个用例全过**（年轮组件 16 个：三级浏览 5、手势 3、名字 2、纸雕 6）。
- `npx tsc --noEmit`、`npx eslint .` 零报错。
- 生产 E2E `e2e/rings.spec.ts`（两个视口 4 个用例）通过，`docs/rings/` 的 16 张截图重新生成；已看图确认：年层 2025 叠在 2026 上（内圈抬起、纸下见影）、月层细线成锥、日层是一圈淡紫的纸环并写着「8日」。

#### 三个坑

1. SVG 元素的 `className` 是 `SVGAnimatedString`，测试里要写 `getAttribute("class")`，直接 `expect(el.className).toContain(...)` 会得到 `expected [] to include ...`。
2. 变量声明顺序：`dayWidth` 一开始写在 `dayStep` 前面，只有一天的数据永远走不到那个分支所以测试全绿，直到补了「一个月里有几天就是几圈」这个用例才把它逼出来。**新增展示层的计算就顺手补一个多元素用例**。
3. 年轮的热区是里面的 `<path data-ring-hit>`，`aria-label` 挂在它身上而不是 `<g data-testid>` 上；E2E 里原来的 `expect(year).toHaveAttribute("aria-label", ...)` 因此变成 2 failed，改成 `page.locator('[data-testid="ring-year"] [data-ring-hit]')` 才对。

### 9.13 年轮改成剪纸年轮（2026-10-09 完成）

用户看过 9.12 那版之后说：「这也不像年轮啊  我要剪纸图案的2.5D感的年轮」——同心圆加情绪色那版被否，要的是**剪纸图案**的年轮。这一节记的是纸片怎么剪出来的、整盘怎么摆、以及为什么「点不中」。

#### 新增：`lib/rings/paper.ts`（纯函数，配 19 个用例）

- `WOOD = "#d9bf8e"`、`BARK = "#a2794c"`、`WOOD_LIGHT = "#efe0bd"`、`MIN_BAND = 5`、`MIN_EDGE = 1.4`。
- `wobbledCircle(spec)`：半径沿角度用三条正弦谐波起伏（相位由 `seeded(seed)` 定），默认 48 个点；`petals` / `petal` 让边缘变成花瓣式的花边（树皮用它剪出 13 瓣）。
- `smoothClosedPath(points)`：Catmull-Rom 转三次贝塞尔，`M` 开头 `Z` 收尾；点少于 3 就走折线。
- `bandEdges(spec)` 与 `ringPaperPath(spec)`：一条环带的外圈手剪一次、**内圈用 `seed + 9911` 另外剪一次**（所以宽度沿圆周有粗有细，不是等宽的几何圆环）；内圈被外圈挤到只剩 `MIN_EDGE` 时按同一角度径向推回，`innerRadius <= 0.6` 时就只剩一张圆纸片。`cutHoles(spec)` 在环带上均分再抖动地剪几个叶子形小口（环宽 < 4 不剪），靠 `fillRule="evenodd"` 挖空。
- `grainPath` 一根木纹、`eccentricAt(seed, index, max)` 让越往外的圈偏得越多（真年轮不同心）、`woodTint(color, amount)` 把情绪色往木头色里调。
- `packedRings(widths, core, max, gap = 4)`：一圈挨一圈地长，放不下就整体收窄、最少 `MIN_BAND`，再挤只留缝——所以「记录多的一年更厚」是真的更厚，但整盘不会长出画框。

#### 改：`components/rings/RingBrowser.tsx`（约 530 → 约 650 行）

- 整盘加了「一截锯下来的木头」：`ring-drop` 落影 → `ring-bark`（`barkPath` 13 瓣花边 + `[data-ring-bark-side]` 厚度 + 木头切面 `[data-testid="ring-wood"]` + 一根木纹）→ `ring-core` 里那块不规则「胚」（`wobble: 0.26`）。
- 树皮**包住当前这一层**最外的那一圈：`layerOuter` 按年/月/日各自的几何算（月层是 `MONTH_BASE + (圈数 - 1) * MONTH_STEP + 最大圈宽 / 2`，日层是 `dayBase + dayStep * (天数 - 1) + dayWidth / 2`），`barkRadius = max(outerYearRadius, layerOuter) + 18`。第一版只按年层算，进到月层时那圈 10 月的纸环就跑到树皮外面去了。
- `PaperRing` 的每张纸片是四层：`[data-ring-shadow]`（比纸大 3、往下垫 `LAYER_THICKNESS * 2`、`#3b3328` 15%）、`[data-ring-side]`（压暗的裁口，垫 3）、`[data-ring-face]`（纸面 + 一圈更暗的边）、`[data-ring-grain]`，最后才是热区 `[data-ring-hit]`（用**没剪口的同形环带**，剪出来的小口不该让这一圈点不着）。
- **除了热区，所有纸片都 `pointerEvents="none"`**（影子、裁口、纸面、木纹、光点、标签字、空月份的细线，连树皮和木纹也一样）——原因见下面的坑 1。
- 空着的月份是一根手剪的细线（`ringPaperPath({ width: 1.5 })`），有记录的月份是纸 + 纸边一颗光点（`month-spark`）。

#### 验证（2026-10-09）

- `npx vitest run`：**87 个文件 641 个用例全过**（`lib/rings/paper.test.ts` 19 个：手剪起伏、包边、宽度不匀、镂口、偏心、层高打包；年轮组件 19 个，其中「只有热区是可点的」2 个）。
- `npx tsc --noEmit`、`npx eslint .` 零报错。
- 生产 E2E（`PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test --config=playwright.prod.config.ts`）：**54 passed (4.1m)**，含 `e2e/rings.spec.ts` 的两条（年→月→日三级、空状态 + 演示数据）。`docs/rings/` 16 张截图重新生成，已看图确认：年层是一截带花边树皮的木头 + 一圈带两个小镂口的手剪年轮（年份写在木头上）、日层是一圈淡紫纸环写着「9日」。

#### 四个坑

1. **装饰性的纸片会把点击吃掉**。影子、裁口、纸面画在同一组里、几何又几乎重合，`document.elementsFromPoint` 查出来最上面那个往往是一张**没有 `data-ring-hit` 的 path**；鼠标点下去事件冒到 `<g>` 上，什么都没发生。E2E 的「月→日」这一步就是卡在这里：年→月能点通（那一次的点恰好落在热区上）、月→日点不通。修法是给所有纸片 `pointerEvents="none"`，只有热区那条路径接点击；`e2e/rings.spec.ts` 的 `clickRing` 也从「量盒子点最上面那一点」改成「从盒子顶部往下扫，找到 `elementsFromPoint` 最上面正好是这一圈热区的那一点再点」。
2. **量到的是折起动画中间那一帧**。纸卡是 rotateX −88 → 0 折起来的，动画没落定就量 `boundingBox()`，拿到的是被投影压扁的盒子（实测 150×41，落定后 232×59），按那个坐标点不到东西。`e2e/rings.spec.ts` 里加了一个 `settleCards(page)`：等 `.paper-card` 的 `transform` 变成 `none` 或单位矩阵再量。
3. **`locator.click({ position })` 会先做稳定性检查**，在折起的卡片上会一直报 `element is not stable` 直到超时；按坐标点用 `page.mouse.click(x, y)` 绕开。
4. SVG 元素的 `className` 是 `SVGAnimatedString`（9.12 也踩过，这次是 `getAttribute("class")`）；另外 `<g>` 上有 `onClick` 时，`userEvent.click(getByRole("button", { name }))` 点的是热区路径，别去点组。
### 9.14 部署到 Cloudflare Workers（2026-10-09 完成）

用户 2026-10-09 说「先提交然后部署到cloudflare上」。提交那部分见下面「三个提交」，这一节记部署。

**为什么走这条路线**：Cloudflare 官方给 Next.js 的路线是 `@opennextjs/cloudflare` 适配器（把 `next build` 的 standalone 产物适配到 workerd，靠 Workers 的 Node.js 兼容层）。这个项目特别合适：服务端只有 8 个 Route Handler、全是 Web 标准的 Request/Response，没有数据库、没有文件读写，数据都在浏览器 IndexedDB 里 —— **不需要 D1 / KV / R2，也不用配 CORS**。选它的另一个理由是「改完照样能本地开发」：适配器只在构建和部署时介入，日常还是 `next dev`。

**三个提交（年轮的剪纸那一批，已推）**：`6bd4c50` feat(rings) 年轮改成一盘剪纸（`lib/rings/stack.ts`、`lib/rings/paper.ts` 与两个测试、`components/rings/RingBrowser.tsx` 与测试）；`15def1b` test(e2e) 年轮剪纸的端到端用例与两视口截图（`e2e/rings.spec.ts` 与 docs）；`60770d3` docs 记录与验收（README、HANDOFF、progress）。`git push origin main` 把远端从 `6607bff` 推到 `60770d3`。

**加了什么（六个文件 + 两条脚本）**：
- `wrangler.jsonc`：`main: ".open-next/worker.js"`、`name: "jieyou-forest-web"`、`compatibility_date: "2025-10-01"`、`compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`、`assets: { directory: ".open-next/assets", binding: "ASSETS" }`、`observability.enabled`。
- `open-next.config.ts`：`defineCloudflareConfig()` 默认配置。
- `.dev.vars.example`：三个变量名（`ANTHROPIC_API_KEY`、`JIEYOU_MODEL_MAIN`、`JIEYOU_MODEL_LIGHT`）。
- `.gitignore`：加 `/.open-next/`、`/.wrangler/`、`.dev.vars`。
- `package.json`：`preview`（构建 + `wrangler dev`）与 `deploy`（构建 + 发布）。
- `README.md`：顶部加线上地址，末尾新增「部署（Cloudflare Workers）」一节。
- **没有**照抄适配器模板里的 R2 增量缓存、self-reference service binding 与 IMAGES 绑定（没有 ISR、不用 `next/image`，加上只是多一个空桶）；**也没有**在 `next.config.ts` 里加 `initOpenNextCloudflareForDev()`（不用 Workers 绑定，加了只会让 `next dev` 多启一个 workerd）。

**验证（都真跑过）**：`npx opennextjs-cloudflare build` 成功（`Worker saved in .open-next/worker.js`）→ 本地 `npx wrangler dev --port 8787`：`/` 200、`POST /api/risk` 合法入参 503（没设 Key，走降级）、非法入参 400、未知路径 404 → `npx wrangler deploy --dry-run` 报 **Total Upload 5274.21 KiB / gzip 1113.57 KiB**（免费版 gzip 上限 3 MB）→ `npx wrangler deploy` 发布成功：<https://jieyou-forest-web.radiant-hawking.workers.dev>（118 个静态资源、Worker Startup 18 ms、Version ID `b80e3781-2d9e-4425-8303-05a83db2426b`）。线上用 Playwright 复核（bash 里的 curl 访问公网一律 000、只有 localhost 通，脚本要放进项目里才解析得到 `playwright`）：首页 200、标题「解忧森林」、入林页正常、中文字体分片 200（728 字节）、`POST /api/risk` 503 降级、`{}` 400；截图也看过了。

**三件要知道的事**：
1. **线上目前是降级状态**：没有设 `ANTHROPIC_API_KEY`（仓库里没有 `.env*`，用户本地的开发服务器也没这个变量）。要让七只动物真的说话，得自己跑 `npx wrangler secret put ANTHROPIC_API_KEY`（我不经手这个值）。两个模型变量同名同理，可选。
2. **数据跟着域名走**：IndexedDB 按 origin 分家，`localhost` 上的年轮不会跟着到线上地址，反过来也一样；换自定义域等于又换一份。
3. **`?dev=1` 在线上也开得出来**（`lib/dev.ts` 的 `devToolsEnabled(search, nodeEnv)` 只认参数），调试抽屉与「生成演示数据」按钮对访客可见 —— 但都只写访客自己浏览器里的数据，不影响别人。要是不想给访客看到，给 `devToolsEnabled` 再加一个域名判断即可。
**后来又加了一道篱笆（同一天）**：用户问「这个 key 会被暴露吗，安全不」，把 Key 的去向查了一遍（它只出现在服务端一次 fetch 的 `x-api-key` 头上；客户端产物里扫 `ANTHROPIC_API_KEY` / `sk-ant` / `x-api-key` 都是 0 个文件，而同一批产物能扫到「解忧森林」；仓库里只有不含值的 `.dev.vars.example`；报错只抛状态码）之后，顺手加了每 IP 的限流。

`lib/ai/limit.ts`（不加任何依赖）：`LIMIT_RULE = { windowMs: 60_000, max: 20 }`、`MAX_KEYS = 2000`；`createRateLimiter(rule, now)` 是滑动窗口，`check(key)` 给 `{ allowed, retryAfterSec }`；键从 `cf-connecting-ip` 取（退到 `x-forwarded-for` 的第一段，再退到 `local`）；`checkLimit(request)` 用模块级共用的那个实例，`__resetLimitForTest()` 只在测试里用。

`lib/ai/route.ts` 加了 `rateLimited(retryAfterSec)`（429 + `{ ok: false, reason: "rate" }` + `Retry-After`；前端一个字都不用改，`postJson` 对任何非 2xx 都给同一句降级话）与 `limitReached(request)`；八个路由的第一件事都是 `const limited = limitReached(request); if (limited) return limited;` —— 限流排在解析入参之前。

**它挡的是手滑连点与一台机器的滥用，不跨 isolate**（计数器在 Worker 进程内存里，重启归零、不同机房各算各的），所以真正的花钱上限还是去 Anthropic 后台设月度额度，Cloudflare 那边还可以再加一条 Rate limiting 规则。线上实测：从页面里连打 21 次 `/api/risk`，前 20 次 503（没设 Key），第 21 次起 429、`retry-after=57`。

## 10. 第一阶段实现指南（已完成，留作参考）

第 1 阶段的 63 项已于 2026-10-06 全部完成并通过全量检查（记录见第 9 节）。本节保留当时的做法与验收标准，供第二阶段参考。**以 `tasks.md` 和 `specs/` 为准**，本节只是帮助理解。每一项都先写失败的测试，再写实现。

### 第 8 组：森林主场景（已完成，见 9.3、9.5）

8.1、8.2、8.3、8.5 都已实现并验证；**8.4 的游戏面板本体与「回到森林后轻跳」已在第 10 组做完**（见 9.5）。下面是当时的做法，留作参考：

- 点「一起玩」时 store 已经会先折回角色卡、记下 `pendingGame`（`startGame(gameId)`），并把卡片的位置信息清掉
- 面板要做的就是：读 `pendingGame`，像立体书一样折起（`PopupCard` 已有折起动画和焦点管理，可以复用或参照），带「回到森林」按钮，Esc 也能关，关闭时调 `closeGame()`，场景不重新加载
- 面板做完后，「回到森林后刚玩过的动物轻跳一下」：在 `forest` store 里加一个「刚玩过的动物」字段，`ForestHome` 用 effect 看到它时让对应 `ForestAnimal` 调一次 `PuppetHandle.react()`（`ForestAnimal` 里已经 `useRef` 持有 puppet 句柄，点动物时就是这么调 react 的）
- 减弱动画时 react() 只做透明度呼吸（`PaperPuppet` 里已有分支），不用额外处理
- 做完后补 E2E：点角色卡 → 一起玩 → 面板出现 → 回到森林 → 卡片、镜头、动物都恢复，并且动物跳了一下（可以用 `data-pose` 或 transform 断言）

### 第 9 组：小游戏通用部分（已完成，见 9.4）

9.1–9.4 全部实现并通过测试。第 10 组的游戏直接复用这些：

- AI 一律 `import { forestAI } from "@/lib/ai"`，类型从 `@/lib/ai/types` 取，不要直接 import mock- 面板外壳用 `GameShell`（标题 / 回到森林 / 思考中 / 失败挠头重试），玩法放 `children`
- 提交按钮用 `useGameBusy()` 禁用；请求用 `useAiRequest((text, options) => forestAI.splitThought(text, options))`
- 拖拽与点选游戏（事实还是猜测、落叶漂流、藏坚果）用 `DndProvider` + `Draggable` + `DropZone`
- 失败文案不要再写一遍，用 `AI_FAILURE_LINE`
- gameContext 用 `useGameContextStore.getState().add("游戏名", "内容")`

**（下面是当初的接口设计，保留作背景）**

**9.1 `lib/ai/types.ts` + `lib/ai/mock.ts`**

```ts
export type ThinkingTrap = "灾难化" | "读心术" | "非黑即白" | "以偏概全";
export interface ThoughtBubble { text: string; answer: "fact" | "guess"; trap?: ThinkingTrap }
export interface Reframe { humor: string; gentle: string; real: string }
export interface ForestAI {
  splitThought(text: string): Promise<ThoughtBubble[]>; // 1–5 个
  reframe(thought: string): Promise<Reframe>;
  breakDown(worry: string): Promise<string[]>;           // 3–5 个
}
export function getForestAI(): ForestAI; // 本阶段返回 mock，第二阶段换成 HTTP 实现
```

- mock 规则：等待 600–1200ms（延迟由输入哈希决定，不用 `Math.random()`）；同样的输入返回同样的结果；`useDevStore.simulateAIFailure` 为 true 时 reject
- `splitThought` 的 mock：按标点切句；用关键词规则判断事实还是猜测（例如「肯定、一定、总是、永远、所有人、都觉得、他们会」倾向猜测），并归类思维陷阱
- 测试：对任意 1–60 字的输入，`breakDown` 返回 3–5 个非空字符串；`splitThought` 返回 1–5 个；结果确定；失败开关生效
- 测试里用假计时器跳过延迟

**9.2 `components/games/GameShell.tsx`**
- 标题、「回到森林」、Esc 关闭
- 请求失败：对应动物挠挠头，显示「风太大了没听清，能再说一次吗？」和「再试一次」，**用户刚才输入的内容不丢失**
- 等待中：动物播放思考动画，提交按钮不可用，防止重复提交
- 中途离开时，没完成的游戏不产生 gameContext

**9.3 `components/games/dnd/`**
- `Draggable`（Motion drag，松手时检查落在哪个 `DropZone`）、`DropZone`
- 「先点物件，再点目标」与拖拽效果相同
- 键盘：Tab 聚焦物件，回车选中，再在目标上回车
- 没放进任何目标时弹回原位
- 事实还是猜测、落叶漂流、藏坚果三个游戏共用

**9.4 开发工具**：开发模式下的小按钮，查看当前 gameContext；「模拟 AI 失败」开关。生产构建里不出现。

### 第 10 组：七个小游戏（已完成，见 9.5）

每个游戏先写纯逻辑测试，再写组件。所有 gameContext 文案必须和规格**逐字一致**：

| 游戏 | 纯逻辑（先测） | 关键行为 | gameContext 格式 |
|---|---|---|---|
| 敲树洞 | `tapSession`：至少点过一次后停手 3 秒结束；从第一次点击起满 30 秒结束 | 纸屑（每次最多 8 片，DOM，播完移除）、连击数、`navigator.vibrate`、屏幕微震（减弱动画时不震）；结束后飘出 10 个情绪词：愤怒、委屈、焦虑、失落、疲惫、羞愧、孤独、害怕、不甘、说不清；选 1–3 个，选第 4 个时提示「最多选 3 个就好」；回应「原来你是___啊，这很正常」，多个词用「、」和「和」连接；只选「说不清」时回应「说不清也没关系，情绪本来就是一团乱麻」 | `【敲树洞】此刻的情绪：委屈、疲惫` |
| 事实还是猜测 | 点评生成：一致的简短肯定；不一致的用提问语气（「这一个我倒觉得更像猜测——你能确定吗？」），**不出现「错了」**；列出出现过的思维陷阱和一句话解释 | 输入 1–100 字，可一键填入示例；空输入不能提交；调用 `splitThought`；气泡放进「事实」「猜测」两个树洞；全部放完后墨墨点评 | `【事实还是猜测】困扰的话：…；其中的猜测：…；可能的思维陷阱：…` |
| 翻面镜 | 无复杂逻辑 | 输入 1–60 字；「放到镜子前」后阿橘甩尾，镜子绕竖轴 `rotateY` 翻面，背面显示带标签的幽默版、温柔版、现实版；可以收藏任意几句；**没收藏就不产生记录** | `【翻面镜】原来的想法：…；收藏的说法：…` |
| 熊抱 | `pickNoRepeat`（同一次访问内不连续重复）；暖光强度曲线（按住越久越亮，10 秒最亮） | 长按团团，它张开双臂；纸灯笼式暖光；每分钟 60 次心跳 + 震动；按住超过 1 秒后松开，从本地文案库（**至少 20 句**）说一句；不足 1 秒提示「抱久一点点也没关系」且不记录；**不调用 AI** | `【熊抱】和团团抱了 6 秒` |
| 龟壳呼吸 | `breath` 阶段计算：吸气 4 → 屏息 4 → 呼气 4 → 屏息 4 为一轮，给出当前阶段、倒数、第几轮 | 默认 3 轮，开始前可调 1–10 轮；龟壳纸层吸气时沿 Z 轴升起分开、呼气时落回；可选提示音（默认关，Web Audio 生成）；可暂停、可结束；中途结束不记录；完成后慢慢说一句收尾的话 | `【龟壳呼吸】完成了 3 轮盒式呼吸` |
| 落叶漂流 | 无 | 写字区上方一直显示「叶子上的字不会被保存，漂走就真的走了」；每片 1–30 字；放进溪流后顺水漂走、字迹逐字晕开淡去；可以写多片；**叶子文字不能进 IndexedDB、gameContext、日志或任何网络请求**（要有测试） | `【落叶漂流】放走了 2 片烦恼叶子` |
| 藏坚果 | 无 | 输入 1–60 字；跳跳啃咬动画 + 调用 `breakDown` 得到 3–5 颗折纸坚果；把愿意尝试的放进树洞；树洞为空时「就这些」不可用，并提示「挑一颗最小的试试？」；点「就这些」后跳跳打气 | `【藏坚果】让人焦虑的事：…；愿意尝试的小步骤：…` |

所有游戏元素都按纸的材质来做（纸屑、圆形纸片气泡、折纸坚果、正反两面的卡纸镜子、多层纸片龟壳、纸灯笼暖光、几层波浪纸条组成的溪流）。素材放在 `lib/animals.ts` / `lib/scene.ts` 或新的集中素材文件里，不要散落在组件中；如果要新增素材文件，先在设计里说明。

### 第 11 组：阶段验收（已完成，见 9.5、9.6）

- 11.1 E2E 主流程：入林 → 森林 → 逐个完成 7 个小游戏 → 检查 gameContext
- 11.2 E2E：减弱动画模式、字体分片少于 30、动画元素没有 filter
- 11.3 全量检查：typecheck、lint、单元测试、E2E、build 全部通过；两个视口截图自检
- 11.4 更新 README：列出第一阶段已完成的功能和待办，交给用户验收

---

## 11. 后续阶段的架构设计（建议，开始前需要走 OpenSpec 并获得用户批准）

### 11.1 第二阶段：倾诉与圆桌

**服务端**
- `app/api/` 下的 Route Handlers（写之前先读 `node_modules/next/dist/docs/` 里关于 Route Handlers 的文档）：
  - `POST /api/roundtable`：一次调用返回全部动物的发言，避免重复观点
  - `POST /api/summary`：古树总结
  - `POST /api/reply`：追问（默认古树，或指定动物）
  - `POST /api/risk`：风险检测（第四阶段也可以提前到这里）
- 环境变量：`ANTHROPIC_API_KEY`；模型名也放进环境变量（例如 `JIEYOU_MODEL_MAIN`、`JIEYOU_MODEL_LIGHT`）。原需求里写了具体模型名，**使用前确认这些模型 ID 可用**
- API Key 只在服务端；服务端不保存任何用户数据，也不写入日志
- 所有 Prompt 模板统一写在 `lib/prompts.ts`（结构和要求见 `解忧森林-prompt.md` 第十节）
- 输出用严格 JSON。需要运行时校验：可以手写类型守卫；如果要引入 zod 之类的库，先按用户的依赖规则确认维护状态并征得同意
- 请求失败时的降级与小游戏一致：「风太大了没听清，能再说一次吗？」+ 重试

**前端**
- `getForestAI()` 换成调用 `/api/*` 的 HTTP 实现，**游戏代码不改**
- 聚拢坐好后进入倾诉：心情打分（1–10，可跳过）→ 输入（长文本，可选 Web Speech API 语音输入）→ 聆听动画 → 风险检测 → 圆桌
- 圆桌：伙伴先说；正在说话的动物走到前方放大高亮，头顶气泡打字机出字，标出思维方式；其他动物根据发言的 `mood`（gentle / thinking / playful / excited / calm / serious）做反应；「下一位」「全部显示」；每段的「说到心里了」
- 古树总结：古树发光，按四档植物意象（草 / 叶 / 树 / 苗）+ 开放式问题的结构
- 继续对话：默认古树回答；点头像或输入「@名字」由那只动物回答；「让大家再说说」
- 结束：「🌱 心结解开了」或「先放一放」（第三阶段落地存储）

**必须同步修改的文案**：入林说明卡和任何隐私说明，见第 8 节第 8 条。

### 11.2 第三阶段：沉淀与年轮

**数据**（Dexie 升级到第 2 版，`this.version(2).stores({ profile: "id", sessions: "id, startedAt, status", memories: "id, date, sessionId" })`，并写迁移测试）：

```ts
type AnimalId = "woodpecker" | "owl" | "fox" | "bear" | "turtle" | "otter" | "squirrel";
type Speaker = AnimalId | "tree" | "user";
interface Message { id: string; speaker: Speaker; content: string; resonated?: boolean; createdAt: number }
interface Session {
  id: string; startedAt: number; endedAt?: number;
  status: "open" | "resolved" | "paused";
  companion: AnimalId; moodBefore?: number; moodAfter?: number;
  gameContext: string[]; matchedMemoryIds: string[]; messages: Message[];
}
interface Memory {
  id: string; sessionId: string;
  date: string;            // YYYY-MM-DD
  title: string;           // ≤12 字
  summary: string;         // ≤60 字
  emotions: string[];
  themes: string[];        // 只能取自固定标签库，1–3 个
  coreBelief: string;
  shift: { from: string; to: string };   // 各 ≤20 字
  insight: string;         // 用户第一人称
  action?: string;
  helpfulAnimals: AnimalId[];
  moodBefore?: number; moodAfter?: number;
}
```

固定标签库：工作压力 / 职场人际 / 亲密关系 / 家庭 / 友情 / 自我价值 / 学业考试 / 健康 / 金钱 / 未来迷茫 / 失去与离别 / 孤独 / 其他。

**年轮**
- 年层：古树横截面，最早的一年在最内圈；圈宽按记录数决定（设上下限）；颜色由当年主导情绪色调混合
- 月层：缩放过渡后显示 12 圈月轮（1 月最内）；没有记录的月份是浅色细线
- 日层：只显示有记录的日子
- 详情：成长卡片列表，对话原文默认折叠
- 面包屑「全部 › 2026 › 3月 › 12日」；手势缩放和返回；按主题标签筛选高亮
- 纸艺表现：每圈是一张环形纸片，从外到内一层层叠高（等高线纸雕）；点击时这圈抬起、发光、展开成下一级。复用 `roughPath` 和静态阴影方案
- 空状态：「你的第一圈年轮，正在生长」
- 开发模式「生成演示数据」按钮：生成跨 2–3 年的假记录（用带种子的随机）
- 年轮的分组、圈宽、配色都应是纯函数，先写测试

**沉淀**：结束时再次打分 → AI 生成 Memory → 年轮生长动画（一个光点从树干外缘长成新的一圈）→ 成长卡片。`helpfulAnimals` 来自用户点过「说到心里了」的动物。

### 11.3 第四阶段：记忆唤醒、安全、数据

**记忆唤醒**
1. 第一条倾诉发出后，用轻量模型提取同结构的指纹（themes、emotions、coreBelief、summary）
2. 本地按 themes 和 emotions 的重合度粗筛前 5 条（纯函数，先测）
3. 交给轻量模型精判，返回真正相似的 id 和原因；没有就返回空
4. 命中：古树一圈年轮发光，飘下一片双面纸叶，展开成提示卡；按钮「看看那天」「这次不一样」
5. 把命中记录放进圆桌和总结的上下文，最多 1–2 只动物自然地提起
6. 只用鼓励的措辞，禁止「你怎么又……」；同一次倾诉只提示一次

**风险检测与安全（必须实现）**
- 每条用户消息先做风险检测：none / concern / crisis，宁可多报，不要漏报
- crisis：立刻停止游戏化表现，动物安静，不进行圆桌；古树认真温和地回应，鼓励联系信任的人和专业帮助；显示求助卡片（**号码上线前核实**）
- 交互设计提醒：原需求写的是「用户确认自己安全后才能继续」。但用户点一个按钮并不能可靠地说明风险已经解除，实现时要谨慎设计，比如保持求助信息可见、语气上持续关心，不要把一次点击当成风险解除的依据
- concern：照常进行，古树在总结里温和地提一句可以寻求专业支持
- 所有 AI 角色都不能：诊断、推荐药物、说教、空洞的正能量、否定用户感受
- 首页和设置页显示免责声明

**数据与设置**：导出全部数据（JSON）、导入（校验格式和版本）、删除单条记录、清空全部数据（二次确认）

**音效与打磨**：UI 音效（翻纸、剪刀、纸片摩擦）、环境音（鸟鸣、溪流、风，默认静音）；音频资源懒加载；减弱动画和静音设置要持久化

---

## 12. 优化方向（不在当前任务清单里，做之前先和用户确认）

**体验与画面**
- 竖屏聚拢遮挡（第 8 节第 1 条）
- 程序生成的纸偶可以整体替换为画师素材：保持 `PuppetDef` / `SceneLayer` 结构不变即可
- 环境氛围：季节变化、天气（雨天纸条雨丝）、节日彩蛋，都可以作为时段系统的扩展
- 动物之间的小互动（比如松鼠偶尔跑去找熊），可以在调度器里增加「结伴走动」

**性能**
- 在真机（中低端安卓、旧 iPhone）上测帧率，必要时调低默认画质，或者加「预热期测得设备能力后选择初始画质」
- `lib/animals.ts` 很长，但纸偶路径在模块加载时生成。如果首屏耗时明显，可以考虑把路径预先生成为静态数据（保持素材集中规则不变）
- 字体分片已经满足少于 30 的要求；可以检查首屏实际用到的分片数

**工程**
- 尽快做一次合理拆分的提交（需要用户同意），避免所有工作都只在工作区里
- E2E 开发服务器测试较慢且依赖动画时序，可以考虑把更多行为下沉为纯函数测试
- CI：GitHub Actions 跑 typecheck / lint / 单元测试 / 生产 E2E（`CI=1` 时 Playwright 不复用已有服务器）
- 可访问性：屏幕阅读器下的入林和游戏流程、颜色对比度、焦点顺序做一次专门检查

**隐私与安全**
- 所有和 AI 相关的说明文案要准确，不能声称完全离线
- 落叶漂流的「不留痕」要用测试守住
- 第二阶段起考虑接口的速率限制和异常输入保护

---

## 13. 用户的工作方式与规则（接手时务必遵守）

用户的全局规则文件在 `~/.claude/rules/` 下（workflow.md、karpathy.md、language-*.md），项目级规则在 `CLAUDE.md`。要点：

- **沟通用中文**
- **流程**：标准任务走 `/opsx:propose → /superpowers:brainstorming → /superpowers:writing-plans → 编码 → /opsx:verify → /opsx:archive`。第一阶段的设计和任务清单已经批准，继续第一阶段时不需要重新提案；**第二阶段开始前要新建 OpenSpec 变更并获得批准**
- **TDD**：没有先失败的测试，就不写生产代码。先写测试、看它按预期失败、再写最小实现
- **tasks.md**：每完成一项立刻把 `[ ]` 改成 `[x]`
- **Karpathy 四条**：先想再写（列出假设，不确定就问）、简单至上（不写没被要求的功能）、手术式修改（只动必须动的，不顺手重构、不删别人的死代码，只提一句）、目标驱动（把任务转成可验证的标准）
- **禁止**：未经批准的大规模重构；跳过测试交付功能；交付「框架搭好了你自己完善」的半成品；重复踩同一个坑；用户没说「直接做」时跳过 brainstorming
- **提交前**：测试全绿、lint 无错、review 通过。**不要擅自 commit 或 push**
- **进度汇报要真实**：测试失败就说失败，附上输出；没做的步骤要明说。之前出现过「说修好了其实没修好」的情况，用户很在意这一点
- **不要启动长时间、看不到进展的后台任务**。用户曾经因为后台批量画动物长时间没有产出而要求停掉，改成在前台一只一只做
- **会话指标**：每个会话结束时在项目根目录的 `progress.md` 记录：总调用数、planning 占比、返工次数、diff 行数、任务类型。健康标准是 planning 开销低于 20%、返工 0 次。这个文件目前还不存在，接手后第一次结束会话时创建
- 进入项目时，如果有 `openspec/changes/`，先运行 `openspec list` 了解进度

---

## 14. 给接手模型的启动提示词（可以直接复制使用）

```
你在继续开发「解忧森林」（Next.js 16 + React 19 + TypeScript strict + Tailwind 4 + motion + Zustand + Dexie）。

开始前请按顺序阅读：
1. HANDOFF.md（交接文档，含架构、进度、已知问题、剩余任务）
2. CLAUDE.md 和 AGENTS.md（硬性规则；写 Next 相关代码前先读 node_modules/next/dist/docs/ 中对应的指南）
3. openspec/changes/stage1-paper-forest/ 下的 design.md、tasks.md、specs/

然后：
- 运行 git status、openspec list、npm run typecheck、npm run lint、npm test，确认当前状态与 HANDOFF.md 第 2 节是否一致，有差异先告诉我
- 第 1 阶段 63 项已全部完成并通过全量检查（记录见第 9 节）；先按下一条命令自己验证一遍，和文档不一致就告诉我
- 前三个阶段都已完成（见 9.8 到 9.13），并按产品文档 `解忧森林-prompt.md` 逐节校对过；也已经部署在 Cloudflare Workers 上（见 9.14）；下一步是第四阶段（记忆唤醒、数据导出导入删除、音效与打磨，设计草稿在第 11.3、11.4 节）：先和用户确认范围，走 OpenSpec 流程拿到批准再动手

要求：
- 用中文沟通
- 严格 TDD：先写失败的测试并运行确认失败，再写最小实现
- 每完成一项立即在 tasks.md 打勾
- 不提交、不推送代码，除非我明确要求
- 不要擅自停止我正在运行的开发服务器
- 汇报时如实说明测试结果，失败就附上输出
```

---

## 附录 A：规格中需要逐字使用的文案

| 场景 | 文案 |
|---|---|
| 存储不可用 | 森林这次记不住你，关掉页面后需要重新认识哦 |
| 免责声明 | 解忧森林不能替代专业心理咨询 |
| 开始倾诉按钮 | 开始倾诉（叶子是 aria-hidden 的纸片图形） |
| 坐好后的提示 | 大家都在听啦。倾诉功能下个版本开放（当前代码用的是逗号，见第 8 节第 6 条） |
| 散开按钮 | 让大家散开 |
| 年轮入口 / 提示 | 我的年轮 / 年轮还在生长，过些日子再来看看 |
| AI 失败 | 风太大了没听清，能再说一次吗？ / 再试一次 |
| 敲树洞上限 | 最多选 3 个就好 |
| 敲树洞「说不清」 | 说不清也没关系，情绪本来就是一团乱麻 |
| 熊抱太短 | 抱久一点点也没关系 |
| 落叶说明 | 叶子上的字不会被保存，漂走就真的走了 |
| 藏坚果空树洞 | 挑一颗最小的试试？ |
| 年轮空状态（第三阶段） | 你的第一圈年轮，正在生长 |

## 附录 B：入林引导当前文案（`components/onboarding/Onboarding.tsx`）

- 标题页：「给心事留一片空地」/「解忧森林」/「不用急着变好。先在这里，歇一歇。」/ 按钮「走进森林」
- 古树：「我是岁岁」/「孩子，欢迎来到解忧森林。这里的每一位朋友，都愿意听你说。先放下行囊，慢慢来。」/「你好，岁岁」
- 昵称：「我们该怎么称呼你？」/「一个喜欢的名字就好，不必是真名。」/ 标签「你的昵称」/ 计数「n / 12 字」/「继续」
- 说明：「入林前，一点叮咛」/ 三段：不是心理治疗、紧急情况求助、数据只保存在设备上 /「我知道了」
- 伙伴：「今天想先找谁玩？」/「{昵称}，选一位同行伙伴吧。其他朋友也都在等你。」/「一起入林」（保存中显示「正在认识你…」）

## 附录 C：常用排查手段

| 问题 | 做法 |
|---|---|
| 点击动物没反应（尤其 Safari / iPhone） | 检查 3D 容器和 world 是不是 `pointer-events:none`，可交互元素是否 `pointer-events-auto`；用 `document.elementFromPoint` 看命中的是谁 |
| 水合警告 | 是否在服务端渲染了依赖时间、视口或随机数的内容；场景必须只在客户端渲染 |
| 动画结束后元素没回到原位 | 检查最终的计算 transform 矩阵 |
| E2E 间歇失败 | 先用脚本复现并逐帧记录位置，不要靠加等待时间掩盖；开发服务器冷编译、worker 并发都可能是原因 |
| Playwright 找不到浏览器 | `npm run e2e:install`，并确认命令带了 `PLAYWRIGHT_BROWSERS_PATH=0` |
| 开发服务器起不来 | Next 16 同一目录只能有一个 `next dev`；先确认已有的那个是不是用户在用 |
| 浮层莫名上移或被滚出屏幕 | 检查祖先元素的 `scrollTop`；`overflow: hidden` 仍可被 `focus()` 滚动，要彻底禁止用 `overflow: clip` |
