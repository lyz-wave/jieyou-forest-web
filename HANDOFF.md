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
4. **先修第 9.1 节的手机回归**，再开始第 8 组。
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
| 1 | 风格样板 → 森林场景、7 只动物、森林生活、入林、角色卡、7 个小游戏（AI 用 mock） | **进行中，38/63 项已勾选** |
| 2 | 倾诉、圆桌发言、古树总结、追问（接 Claude API） | 未开始 |
| 3 | 沉淀、年轮三级浏览、成长卡片 | 未开始 |
| 4 | 记忆唤醒、风险检测、数据导入导出删除、音效、动画打磨 | 未开始 |

### 2.2 第一阶段各组

| 组 | 内容 | 状态 |
|---|---|---|
| 1 | 工程骨架 | ✅ 已勾选 |
| 2 | 纸艺纯函数（随机、手剪纸边、形状、景深、光影、画质） | ✅ 已勾选 |
| 3 | 场景引擎（纸层、视差、纹理、粒子、降画质） | ✅ 已勾选 |
| 4 | 纸偶 + 阿橘 + 风格样板页 + WebKit 点击修复 | ✅ 已勾选，画风已确认 |
| 5 | 森林生活（地面、领地、移动、调度、聚拢、篝火阳光） | ✅ 已勾选 |
| 6 | 其余 6 只动物和古树 | ✅ 已勾选 |
| 7 | 存储与入林 | ⚠️ **代码基本写完但未勾选**，手机伙伴页有一个未修好的回归（见 9.1） |
| 8 | 森林主场景（角色卡、古树卡、徽记、镜头、游戏面板开关） | ⏳ 只完成了 `PopupCard`（8.2）的大部分 |
| 9 | 小游戏通用部分（ForestAI 接口 + mock、GameShell、拖拽） | ⏳ 只有 `dev` store |
| 10 | 七个小游戏 | ❌ 未开始 |
| 11 | 阶段验收（E2E 主流程、全量检查、README） | ❌ 未开始 |

### 2.3 最近一次验证结果（以下是事实记录，不代表现在仍然成立）

- 全量单元测试：**24 个文件、201 个测试全部通过**；`typecheck`、`lint`、`build` 通过。这是在加入手机视口断言之前的结果
- 生产构建 E2E（`playwright.prod.config.ts`，mobile + desktop）：`onboarding.spec.ts` 和 `prod.spec.ts` 一共 10 个测试全部通过。也是在加入视口断言之前
- 之后在 `e2e/onboarding.spec.ts` 的 `finishOnboarding` 里加了两条断言：「今天想先找谁玩？」标题和「一起入林」按钮必须在视口内。**手机项目上这两条断言失败**。由于 3 个入林测试都调用 `finishOnboarding`，手机上的 3 个入林测试现在应该都会失败；桌面应该仍然通过
- 开发服务器上的 E2E（`*.dev.spec.ts`，样板页和森林生活）：历史上连续 3 轮 35 个测试一致通过，另有 2 个按设计跳过。之后没有重跑

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
    GatherControls.tsx       「🍃 开始倾诉」按钮、坐好后的提示纸条和「让大家散开」
  onboarding/
    Onboarding.tsx           五步入林引导（组件测试在 Onboarding.test.tsx）
    MorningMist.tsx          晨雾纸片：完整动画时向两侧拉开，减弱动画时只淡出
  ui/
    PopupCard.tsx            立体书式纸卡：rotateX 折起、焦点管理与焦点陷阱、Esc、点外部关闭（测试在 PopupCard.test.tsx）
  dev/
    DebugPanel.tsx           样板页调试：时段、画质、减弱动画、帧率、查看全部角色
    CastGallery.tsx          全部角色一览
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
  stores/dev.ts              模拟 AI 失败开关
e2e/
  prod.spec.ts               生产环境 /style-sample 返回 404；字体分片少于 30
  onboarding.spec.ts         入林、刷新、存储降级、减弱动画（同时把截图写到 docs/onboarding/）
  style-sample.dev.spec.ts   纸层、命中测试、steps 节奏、点击反馈、键盘、无 filter、时段阴影、画质、减弱动画、视差不露边
  forest-life.dev.spec.ts    走动（加速页面时钟）、白天 / 夜晚聚拢、散开、减弱动画
playwright.config.ts         5 个项目：mobile / desktop（生产 3100）、dev-mobile / dev-desktop / dev-iphone（开发 3101）
playwright.prod.config.ts    只保留 mobile / desktop 和生产服务器
scripts/shoot.mjs            截图脚本
scripts/diag-companion.mjs   临时诊断脚本（9.1 修好后可删）
docs/style-sample/  docs/cast/  docs/onboarding/   画面自检截图
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

- 来源选择：`(pointer: fine)` 用鼠标；有 DeviceOrientation 且是触屏时用陀螺仪（以第一次读数为基准，±15° 映射到 ±1）；iOS 需要授权时先自动漂移，并显示「🍃 开启体感」按钮；用户拒绝后记在 localStorage，不再显示按钮
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
| `forest` | `companion`、`gather`、`pending`、`wanderPaused` | 角色卡打开时应设置 `wanderPaused` |
| `gameContext` | `entries`、`add(game, content)`、`clear()` | 格式「【游戏名】内容」，最多 20 条，只在内存里 |
| `dev` | `simulateAIFailure` | 第 9.4 项要接到调试 UI 上 |

规格里写的 `forest` 还应该有「打开的卡片、打开的游戏、镜头焦点、刚玩过的动物」，这些属于第 8 组，**还没有实现**。

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

---

## 6. 硬性规则（来自 `CLAUDE.md` 和已批准的设计）

1. **素材集中**：角色设定和纸偶部件只写在 `lib/animals.ts`，场景纸层只写在 `lib/scene.ts`。组件里不得内联动物或场景形状。新的纸艺元素（比如篝火）如果是场景素材，优先放进这两个文件
2. **性能**：只对 transform 和 opacity 做动画；做 transform 动画的元素不加 CSS filter；阴影用静态偏移副本
3. **随机必须带种子**：用 `lib/paper/random.ts`
4. **减弱动画**：所有动画组件都要处理 `useReducedMotion()`
5. **AI**：小游戏只能通过 `lib/ai` 的 `ForestAI` 接口取数据（第 9 组要建）
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
| 2 | 首页 `/` 上点击动物只会播放点击反馈，没有角色卡 | `ForestApp` 没给 `ForestAnimals` 传 `onActivate` | 第 8 组 |
| 3 | 没有伙伴小叶子徽记 | `PaperPuppet` 有 `badge` 属性但没用 | 第 8.1 项 |
| 4 | 首页没有「我的年轮」入口 | 应该在古树卡里 | 第 8.3 项 |
| 5 | 古树没有作为可点击角色放进森林（目前古树只是纸层里的形状） | `ForestApp` / `lib/scene.ts` | 第 8.1 项：在古树树冠或树干位置放一个透明的 44px 以上热区按钮，aria-label「岁岁，古树，森林守护者」 |
| 6 | 「坐好」提示文案是「大家都在听啦，倾诉功能下个版本开放」，规格写的是「大家都在听啦。倾诉功能下个版本开放」 | `GatherControls.tsx` | 对齐规格或者跟用户确认 |
| 7 | 免责声明用的是米白色小字（`text-cream`，10px），压在草地上，对比度可能不够 | `ForestApp.tsx` | 第 8 组顺便检查对比度 |
| 8 | 入林说明卡写着「本阶段不向外部服务发送内容」 | `Onboarding.tsx` | **第二阶段接入 Claude API 后这句话就不对了，必须改成准确的说法**：数据保存在本地，与 AI 对话时内容会发送给 AI 服务处理，服务端不保存 |
| 9 | 说明卡里的求助信息目前是笼统的「当地心理援助热线、急救或报警」 | `Onboarding.tsx` | 原需求里的号码（12356、400-161-9995、110 / 120）**上线前必须核实**，不要未经核实就写进产品 |
| 10 | `dev-iphone` 项目只验证命中测试 | `playwright.config.ts` | 需要时在真机上做性能和手感验收；早期只在本机 Chrome 上测到 58–60fps |
| 11 | 用户规则要求每个会话结束时在 `progress.md` 记录指标，目前**还没有这个文件** | 项目根目录 | 见第 13 节 |
| 12 | 之前派出去的只读代码复核（第 7 组）结果没有拿到 | 无 | 接手后自己对第 7 组再做一次复核 |

---

## 9. 下一步：完成第 7 组

### 9.1 【阻塞】手机伙伴页：选中卡片后标题和「一起入林」被滚出屏幕

**现象**：375×667 视口下，在第 5 步选中「阿橘」（最后一张卡片）后，「今天想先找谁玩？」标题完全离开视口。`e2e/onboarding.spec.ts` 中 `finishOnboarding` 的 `toBeInViewport()` 断言失败。

**已经测量到的事实**（用 `scripts/diag-companion.mjs` 对生产构建测得）：

| 时间点 | 纸卡顶部 | 纸卡 scrollTop | 伙伴列表 scrollTop | `.paper-scene` scrollTop |
|---|---|---|---|---|
| 选择前 | -259px | 0 | 0 | 287 |
| 选中阿橘后 | -259px | 153 | 0 | 287 |

纸卡 scrollHeight 776，clientHeight 623；fieldset 的 scrollHeight 624，clientHeight 379。

**根因分析**：

1. `PaperScene` 根元素用的是 `overflow-hidden`。`overflow: hidden` 的元素仍然可以被程序滚动，比如 `focus()` 会把聚焦元素滚进可见区域。舞台比视口大（为视差留了余量），所以 `.paper-scene` 被滚了 287px，整个 overlay（包括纸卡）在选择之前就已经上移了 287px
2. 选中最后一张卡片后，聚焦的单选框把**纸卡本身**又滚了 153px。也就是说伙伴列表并没有成为真正的滚动容器：纸卡内容总高仍然超过纸卡高度。推测原因是 `fieldset` 作为 flex 子项和滚动容器时，Chrome 的布局有已知的特殊行为（fieldset 不容易被 `min-height: 0` 压缩）。**这一点还没有单独验证**

**计划中的修复**（还没有应用，当时文件编辑被工具拦截）：

1. `components/scene/PaperScene.tsx`：根元素 `className="paper-scene fixed inset-0 overflow-hidden"` 改成 `overflow-clip`。`overflow: clip` 不允许任何滚动，包括程序滚动
2. `components/onboarding/Onboarding.tsx` 的伙伴步骤：
   ```tsx
   <div className="flex max-h-[calc(100dvh-112px)] flex-col">
     <h2 ...>今天想先找谁玩？</h2>
     <p ...>...</p>
     {/* 滚动放在 div 上，不放在 fieldset 上 */}
     <div className="mt-4 min-h-0 shrink overflow-y-auto p-1">
       <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3" disabled={saving}>
         ...7 张卡片...
       </fieldset>
     </div>
     <button className="... shrink-0">一起入林</button>
   </div>
   ```
3. 可能还需要让 `PopupCard` 在这种场景下不自己滚动（比如给 `PopupCard` 加一个属性，由内容自己管理滚动），视修完后的测量结果决定

**验证方法**：
1. `npm run build`
2. 用 `npm run start -- -p <空闲端口>` 起一个生产服务器，修改 `scripts/diag-companion.mjs` 里的地址后运行 `PLAYWRIGHT_BROWSERS_PATH=0 node scripts/diag-companion.mjs`。期望：`.paper-scene` 的 scrollTop 为 0；选中后纸卡 scrollTop 为 0；如果需要滚动，滚的是伙伴列表
3. `npm run test:e2e -- --config=playwright.prod.config.ts e2e/onboarding.spec.ts e2e/prod.spec.ts`：mobile 和 desktop 全部通过
4. 查看 `docs/onboarding/mobile-companion.png`：标题、7 张卡片的滚动区域、「一起入林」都在画面里
5. **把 `overflow-hidden` 改成 `overflow-clip` 会影响整个场景**，必须同时重跑开发服务器上的 E2E（样板页、森林生活，尤其是视差不露边和聚拢测试），确认没有破坏
6. 修完后删掉 `scripts/diag-companion.mjs`

### 9.2 第 7 组收尾

1. 修好 9.1 并通过上面全部验证
2. 运行 `npm run typecheck && npm run lint && npm test && npm run build`
3. 对照 `specs/onboarding/spec.md` 的每个场景逐条确认：
   - 第一次打开显示入林；再次打开直接进森林 ✓（E2E 覆盖）
   - 五步顺序、古树欢迎不超过 3 句 ✓
   - 完整走完后保存 `{ nickname: "小满", companion: "fox", onboardedAt }` ✓
   - 昵称为空或只有空格时「继续」不可用 ✓；最多 12 个字 ✓
   - 中途刷新从头开始 ✓
   - 减弱动画时晨雾只淡出、没有镜头推进 ✓
   - IndexedDB 不可用时显示「森林这次记不住你，关掉页面后需要重新认识哦」并能继续 ✓
4. 在 `tasks.md` 里把 7.1–7.5 改成 `[x]`。8.2（PopupCard）的折起 / 折回、焦点管理、Esc、点外部关闭都已实现并有测试，可以在第 8 组时一并确认后勾选

---

## 10. 第一阶段剩余任务：实现指南

下面每一项都给出建议的做法和验收标准。**以 `tasks.md` 和 `specs/` 为准**，本节只是帮助理解。每一项都先写失败的测试，再写实现。

### 第 8 组：森林主场景

**8.1 ForestHome**
- 把 `ForestApp` 里 `phase === "forest"` 的部分抽成 `components/forest/ForestHome.tsx`
- 放置 7 只动物 + 古树热区；伙伴动物用 `PaperPuppet` 的 `badge` 显示小叶子（素材放进 `lib/animals.ts` 或 `lib/scene.ts`）
- 免责声明「解忧森林不能替代专业心理咨询」，不遮挡交互
- 「🍃 开始倾诉」触发聚拢，聚拢期间按钮隐藏（`GatherControls` 已经这样做了）
- 验收：375×667 下 7 只动物、古树、「开始倾诉」都完整可见，热区不小于 44×44 且互不重叠；只有伙伴身上有徽记

**8.2 PopupCard**：已基本完成，见 5.11。确认规格场景后勾选

**8.3 角色卡与古树卡**
- 角色卡内容：名字、物种、一句话思维方式、心理学依据、一句样句、「一起玩：{游戏名}」按钮；伙伴的卡额外显示「我的伙伴」。数据全部来自 `ANIMALS`
- 打开卡片时设置 `forest.wanderPaused = true`，关闭时恢复
- 关闭时焦点回到那只动物（`PopupCard` 已经会把焦点还给打开它的元素，确认纸偶按钮就是那个元素）
- 古树卡：岁岁的介绍 + 「🌳 我的年轮」按钮；点按钮显示纸条「年轮还在生长，过些日子再来看看」，不跳转
- 验收：点墨墨，卡片从底边折起，显示「理性分析」和「一起玩：事实还是猜测」；按 Esc，卡片折回，焦点回到墨墨

**8.4 镜头与游戏面板**
- `forest` store 增加：打开的卡片、打开的游戏、镜头焦点、刚玩过的动物
- 点「一起玩」：关掉角色卡，镜头轻轻推向这只动物（用 `CameraFocus`，depth 用动物当前深度），游戏面板像立体书一样折起；手机上占满视口宽度
- 每个面板有「回到森林」，Esc 也能关；关闭时反向播放，场景不重新加载
- 回到森林后，刚玩过的动物调用一次 `PuppetHandle.react()`（需要从 `ForestAnimal` 暴露这个能力，比如通过 store 里的「刚玩过的动物」+ effect 触发）
- 减弱动画时没有镜头推近，只淡入淡出

**8.5 E2E**
- 两个视口下所有热区不小于 44px 且互不重叠
- 视差推到最大时不露边（样板页已有类似测试，首页也要有）
- 入林 → 森林 → 打开角色卡 → Esc 关闭 → 焦点回到动物

### 第 9 组：小游戏通用部分

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

### 第 10 组：七个小游戏

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

### 第 11 组：阶段验收

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
- 圆桌：伙伴先说；正在说话的动物走到前方放大高亮，头顶气泡打字机出字，标出思维方式；其他动物根据发言的 `mood`（gentle / thinking / playful / excited / calm / serious）做反应；「下一位」「全部显示」；每段的「🍃 说到心里了」
- 古树总结：古树发光，按 🌿 / 🍃 / 🌳 / 🌱 + 开放式问题的结构
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
- 先修复 HANDOFF.md 第 9.1 节的手机伙伴页回归，按第 9.1 节的验证方法逐项验证
- 完成第 7 组收尾（第 9.2 节），在 tasks.md 里勾选
- 然后按 tasks.md 顺序继续第 8 组

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
| 开始倾诉按钮 | 🍃 开始倾诉 |
| 坐好后的提示 | 大家都在听啦。倾诉功能下个版本开放（当前代码用的是逗号，见第 8 节第 6 条） |
| 散开按钮 | 让大家散开 |
| 年轮入口 / 提示 | 🌳 我的年轮 / 年轮还在生长，过些日子再来看看 |
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
