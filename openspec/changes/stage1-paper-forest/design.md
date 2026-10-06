## Context

「解忧森林」从零开始，目前没有任何代码。完整产品需求见项目根目录的 `解忧森林-prompt.md`，共分 4 个阶段，本变更只覆盖第一阶段。

约束：
- 移动端优先（375px 起），兼容桌面；手机上目标 60fps
- 数据只存本地（IndexedDB）；本阶段不接入任何外部服务
- 美术全部由代码生成（SVG），没有画师素材；以后要能整体替换
- 画风是最大的不确定因素，所以先做风格样板页，等用户确认后再做其余部分

## Goals / Non-Goals

**Goals:**
- 一套可复用的 2.5D 纸雕场景引擎和纸偶系统，第二到第四阶段（召集动画、年轮纸雕等）直接在上面扩展
- 完整可玩的第一阶段：入林 → 森林 → 7 个小游戏 → 回到森林
- 小游戏的 AI 部分通过接口隔离，第二阶段只替换实现
- 核心逻辑（纸边生成、景深数学、光影、降画质、游戏状态机、mock AI、存储）全部有单元测试；关键用户路径有 E2E 测试

**Non-Goals（本阶段不做）:**
- 倾诉、圆桌发言、古树总结、追问、Claude API、API Routes（第二阶段）
- 会话持久化、沉淀、年轮、成长卡片（第三阶段）
- 记忆唤醒、风险检测、设置页、数据导入导出（第四阶段）
- 环境音和 UI 音效（第四阶段）。本阶段唯一的声音是龟壳呼吸的可选提示音
- 国际化、账号、云同步、PWA 离线

## Decisions

### D1. 框架版本：Next.js 16 + React 19 + Tailwind 4
需求写的是「Next.js 14+」，当前最新稳定版是 16，直接用最新版，避免以后升级。动画库用 `motion`（即 Framer Motion 改名后的包，从 `motion/react` 导入）。包管理用 npm，README 最简单。
- 备选：固定在 Next 14 —— 没有必要，以后还要迁移。

### D2. 单页应用 + 状态驱动，不按页面拆路由
`/` 是唯一的产品页，根据状态切换「加载 → 入林 → 森林」。角色卡和小游戏都是叠在场景上的浮层，不跳转路由，这样从小游戏回来时场景不会重新加载（需求明确要求）。后续阶段的倾诉也在同一个场景里进行（动物要聚到空地上）。`/style-sample` 是开发专用页，生产构建里调用 `notFound()`。
- 页面依赖本地时间和 IndexedDB，所以场景只在客户端渲染：服务端只输出一张米白纸色的加载底图，客户端挂载后再渲染场景，避免水合不一致。
- 备选：每个小游戏一个路由 —— 切换时场景会卸载重建，视差和粒子状态丢失，转场也难做连贯。

### D3. 2.5D：CSS 3D 分层 +「舞台盒」坐标系
```
viewport（perspective: P）
└─ world（preserve-3d；相机变换 = 视差偏移 + 镜头推进）
   ├─ layer 天空      translateZ(-d1) scale(s1)
   ├─ layer 远山      ...
   ├─ layer 远树
   ├─ layer 中景树林  ← 古树、啄木鸟、猫头鹰、松鼠
   ├─ layer 草地空地  ← 熊、狐狸、水獭、乌龟、溪流
   └─ layer 前景      translateZ(0)
```
- 每层的缩放补偿 `s = (P + d) / P`，静止时所有层投影后正好叠在一起，像一张平面画。
- 视差和镜头推进都只改 world 的 transform：远层投影位移是 `偏移 × P/(P+d)`，近层位移更大，这就是真实的透视视差，不需要逐层计算。
- **舞台盒**：每层内部放一个固定宽高比（1600×1000）的盒子，按「cover」方式铺满视口并额外留出视差余量 M。纸层 SVG 和放在这一层的动物都在这个盒子里定位，所以不管屏幕比例如何，动物都能对准树枝、溪边这些位置。
- 竖屏手机只能看到舞台中间约 35% 的宽度。重要元素（古树、7 只动物）在竖屏和横屏下各有一套位置：竖屏挤在中央安全区，横屏铺开。远山、树林这类背景是程序生成的长条形状，两种方向共用。
- 「不露边」由纯函数 `layerBox(viewport, depth, P, maxShift)` 计算，并有单元测试覆盖。
- 备选：Three.js / React Three Fiber —— 纸雕本身就是一层层平面，CSS 3D 足够，而且包更小、手机上更省电，DOM 元素还能直接响应点击和键盘。以后要真实光照再迁移。

### D4. 手剪纸边：带种子的随机数 + 折线抖动
`lib/paper/random.ts` 提供 mulberry32 随机数，`lib/paper/roughen.ts` 把多边形的每条边细分，再沿法线方向抖动，输出 `M…L…Z` 折线路径。用折线而不是曲线，是为了保证每个点偏离原轮廓不超过幅度 a（可测试），而且小步长折线本身就像剪刀剪出的边。`lib/paper/shapes.ts` 提供椭圆、水滴、山脊线、树冠、叶片等基础形状，返回顶点数组，再交给 roughen。
- 所有形状在模块加载时生成一次，结果固定，不在每帧计算。

### D5. 层间投影：静态阴影副本，按画质分级
每个纸层在形状下方再画一份深色副本，按光源方向偏移。画质「高」时这份副本带 SVG feGaussianBlur（柔和阴影）；「中」「低」时不模糊（清晰的偏移剪影，本身也很有剪纸味）。阴影副本自己不做动画，所以只会被栅格化一次，随所在纸层一起被合成器移动。所有做 transform 动画的元素都不加 filter。
- 时段切换时阴影偏移会变，触发一次重新栅格化，每分钟最多一次，可以接受。

### D6. 光影：时段查表 + 注册过的 CSS 自定义属性
`lib/scene/lighting.ts`：`getTimeOfDay(date)` 返回时段；`LIGHTING[时段]` 给出光源角度、阴影偏移向量、各层纸色、天空渐变、是否逆光。纸色通过 `@property` 注册的颜色变量（如 `--paper-hill-far`）下发，所以颜色变化可以用 CSS transition 平滑过渡。夜晚逆光：各层颜色压暗，古树树冠的镂空纹样（evenodd 挖洞）后面放一层暖光，萤火虫出现。

### D7. 视差输入：Motion values，不走 React state
`useParallaxInput()` 返回一对 `MotionValue<number>`，取值在 -1 到 1 之间，经 spring 平滑后直接驱动 world 的 transform，不触发 React 重渲染。
- 来源选择：`(pointer: fine)` 用鼠标；有 DeviceOrientationEvent 时用陀螺仪（以第一次读数为基准，±15° 映射到 ±1）；iOS 需要权限时，先显示「开启体感」按钮，在此之前自动漂移；用户拒绝后把结果记在 localStorage，不再显示按钮。
- 自动漂移是周期约 20 秒的李萨如曲线，幅度 0.3。
- 减弱动画时整个 hook 返回常量 0。

### D8. 降画质：纯函数状态机 + rAF 采样
`lib/scene/quality.ts` 的 `createQualityGovernor()` 接收帧时间戳，维护 2 秒滑动窗口，平均帧率低于 45 时降一级，只降不升。挂载后的前 2 秒是预热期，不采样；页面隐藏时暂停采样，避免切回前台时误判。画质等级通过 store 下发，控制阴影模糊、粒子数量和是否显示远树层。

### D9. 粒子：DOM + CSS 动画，不用 Canvas
最多 36 个粒子（高画质时），每个是一个带正反两面的小 div（`backface-visibility: hidden`），用 CSS 关键帧做下落、摇摆和 rotateY 翻转。所有参数来自带种子的随机数，并通过 CSS 变量传入。页面隐藏时设置 `animation-play-state: paused`。几十个合成层在手机上没有压力，而且比 Canvas 少一套绘制循环。敲树洞的纸屑同样用 DOM 实现（每次最多 8 片，播完就移除）。
- 备选：Canvas —— 粒子上百时才值得，本阶段用不到。

### D10. 纸偶：嵌套 `<g>` + 关节 transform-origin + CSS steps()
```ts
interface PuppetPart {
  id: string;
  path: string;                    // 已经过 roughen 的 SVG path
  fill: string;                    // 纸色
  joint: [number, number];         // 关节点，viewBox 坐标
  z: number;                       // 同级部件的叠放顺序
  pin?: boolean;                   // 是否在关节上画两脚钉
  idle?: IdleMotion;               // 呼吸 / 眨眼 / 摆动
  children?: PuppetPart[];
}
```
- 每个部件渲染成两层 `<g>`：外层给点击反馈用（Motion 驱动，流畅），内层给待机动画用（CSS keyframes），两者互不冲突。`transform-box: view-box` + `transform-origin` 设在关节点上。
- 待机动画用共享 keyframes，参数通过 CSS 变量传入；`animation-timing-function: steps(var(--steps))` 实现约 12 帧/秒的顿挫感。不同动物的相位偏移由动物 id 决定，固定不变。
- 阴影：同一个纸偶以剪影模式再渲染一份（所有 fill 换成阴影色），按光源方向偏移，放在本体后面，使用相同的动画类，所以动作完全同步。
- 纸偶本身是一个 `<button>`，带 aria-label，热区不小于 44×44px。

### D11. 素材集中
- `lib/animals.ts`：8 个角色的设定（名字、思维方式、心理学依据、语气、样句、小游戏）+ 纸偶部件定义 + 竖屏和横屏位置。
- `lib/scene.ts`：6 个纸层的形状、纸色键名、深度、镂空纹样。
- 组件只读取这两个文件。以后换成画师素材时，只要保持 `PuppetPart` / `SceneLayer` 结构不变即可。

### D12. 状态与存储
- Zustand stores：`app`（资料、是否能持久化）、`scene`（时段覆盖、画质、减弱动画覆盖）、`forest`（打开的卡片、打开的游戏、镜头焦点、刚玩过的动物）、`gameContext`（最多 20 条）、`dev`（模拟 AI 失败）。
- Dexie 数据库 `jieyou`，第 1 版只有 `profile` 表。第二、三阶段会升级版本，加入 sessions、memories 表。
- `lib/db/profile.ts` 是唯一读写资料的地方：IndexedDB 打开失败时自动切换到内存存储，并把 `persistent` 标记为 false。

### D13. AI 接口隔离
```ts
interface ForestAI {
  splitThought(text: string): Promise<ThoughtBubble[]>;    // 1–5 个
  reframe(thought: string): Promise<{ humor: string; gentle: string; real: string }>;
  breakDown(worry: string): Promise<string[]>;             // 3–5 个
}
```
本阶段的 `mockForestAI` 根据输入哈希挑选模板，结果固定；`splitThought` 按标点切分句子，再用关键词规则判断事实还是猜测、属于哪种思维陷阱，所以 mock 效果也算合理。第二阶段换成调用 `/api/*` 的实现，游戏代码不需要改动。

### D14. 拖拽：共享的「拖或点」组件
事实还是猜测、落叶漂流、藏坚果三个游戏共用 `components/games/dnd/`：
- `Draggable` 用 Motion 的 drag，松手时检查落在哪个 `DropZone` 里
- 同时支持「先点物件、再点目标」和键盘操作
- 没有放进任何目标的物件弹回原位

### D15. 测试
- **Vitest 单元测试**（TDD 先写测试）：random、roughen、shapes、layerBox、lighting、quality、纸偶定义校验、tapSession、breath、事实还是猜测的点评生成、pickNoRepeat、mock AI 的接口约定、gameContext 上限、profile 存储（用 fake-indexeddb，包括不可用时的降级）
- **组件测试**（Testing Library + jsdom）：入林各步骤校验、各小游戏的关键分支
- **Playwright E2E**（基于生产构建）：375×667 与 1440×900 下的布局和热区、入林 → 森林 → 小游戏往返、减弱动画、视差不露边、动画元素没有 filter、字体分片数量、`/style-sample` 在生产环境返回 404
- **画面自检**：用 Playwright 截图，我先看一遍效果再交给你确认

### D16. 森林生活：动物在 3D 世界里自由定位，「舞台 + 远近」坐标
原方案把动物挂在某个纸层里，但走动、跳跃、聚拢都需要在不同远近之间连续移动，所以改为：
- 动物不放在纸层里，而是直接放在 world 里，位置为 `(x, y, depth)`，其中 x、y 是舞台坐标，depth 和纸层一样以 px 计。渲染时用 `translateZ(-depth) scale((P + depth)/P)`，算法和纸层相同，所以远近、视差和纸层完全一致，深度也可以连续变化。
- 动物的叠放顺序由 3D 深度决定（preserve-3d）。纸层之间留出空隙，避免动物插进纸层里。
- 地面：草地是一个倾斜的平面。`groundY(depth)` 给出某个深度上地面在舞台中的 y 值，越远越高，和草地纸层的地平线对齐。走在地上的动物，y 由 depth 决定，不单独存储。
- 每只动物的「领地」是一组锚点（树干上的几个高度、树枝上的几个落脚点、溪流中线上的几个点、草地上的一块区域）。走动就是从当前锚点移动到同一领地里的另一个锚点。
- 移动方式是纯函数 `planMove(animal, from, to)`，返回一串关键帧：路径点、每段时长、朝向、姿态（走 / 跳 / 飞 / 爬 / 漂）。跳跃和飞行用抛物线 `y(t) = 线性插值 - 4h·t(1-t)`，接触阴影的位置跟着地面走。
- 调度器 `createWanderScheduler(rng)` 是纯状态机：每 12–30 秒挑一只没在动的动物，最多同时一只在动；暂停时不发新任务。
- 聚拢：`gatherSeats(count, companionIndex, layout)` 算出半圆座位（伙伴在正中间，越到两侧越靠后），每只动物按各自习性规划路线过去；坐下后朝向圆心。夜晚的篝火和白天的阳光是独立的纸片元素，放在空地中央。
- 实现上，每只动物的位置用 Motion 的 MotionValue 驱动，沿关键帧序列播放，不触发 React 重渲染。

### 后续阶段的接入点
- 第二阶段：在 `app/api/` 下加 Claude 调用；把 `getForestAI()` 换成 HTTP 实现；聚拢倾听之后直接接入圆桌发言
- 第三阶段：年轮纸雕复用 roughen 和投影方案；Dexie 升级到第 2 版
- 第四阶段：音效模块、设置页、风险检测都通过新的 store 和组件接入，不改动场景引擎

## Risks / Trade-offs

- [程序生成的纸偶可能不够可爱] → 先做风格样板页，只做阿橘一只，用户确认后再批量做；部件结构对画师友好，以后可以整体替换
- [手机上 6 个大纸层 + 阴影 + 粒子掉帧] → 只对 transform/opacity 做动画，阴影静态栅格化，自动降画质三级兜底；在样板页上显示实时帧率
- [iOS 陀螺仪权限体验割裂] → 默认自动漂移，按钮是可选的小纸片，拒绝后不再打扰
- [竖屏中央安全区太挤，热区重叠] → E2E 断言热区不小于 44px 且互不重叠；动物大小按方向分别设置
- [CSS 3D 缩放后 SVG 发虚] → 纸层容器使用 will-change: transform，让浏览器按最终尺寸栅格化；样板页实机检查
- [霞鹜文楷首次加载慢] → unicode-range 分片 + font-display: swap，先显示系统字体
- [mock 的 AI 结果和第二阶段的真实结果差距大] → mock 只用来跑通交互；接口类型就是第二阶段的契约

## Open Questions

- 风格样板页完成后，需要用户确认画风（配色、纸边粗糙程度、阿橘的造型），再继续后面的任务。确认前不做其余 6 只动物。
