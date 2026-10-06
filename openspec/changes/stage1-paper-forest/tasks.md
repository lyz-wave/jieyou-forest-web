## 1. 项目骨架

- [x] 1.1 初始化 git 仓库和 .gitignore；创建 Next.js 16 + React 19 + TypeScript strict + Tailwind 4 项目（npm，App Router，不用 src 目录）
- [x] 1.2 安装依赖：motion、zustand、dexie、lxgw-wenkai-screen-webfont；开发依赖：vitest、@vitejs/plugin-react、jsdom、@testing-library/react、@testing-library/user-event、fake-indexeddb、@playwright/test
- [x] 1.3 配置 Vitest（jsdom、路径别名）和 Playwright（基于生产构建，375×667 与 1440×900 两个视口）；在 package.json 加 test、test:e2e、lint、typecheck 脚本
- [x] 1.4 写项目级 CLAUDE.md（技术栈、目录约定、素材集中规则、测试命令）和 README（安装、运行、测试；说明本阶段不需要 .env）
- [x] 1.5 全局样式：纸色 CSS 变量（用 @property 注册）、霞鹜文楷 GB 屏幕版、米白纸色底、按钮按下的纸张效果、焦点样式
- [x] 1.6 验证：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全部通过

## 2. 纸艺基础库（TDD）

- [x] 2.1 `lib/paper/random.ts`：mulberry32 随机数与字符串哈希；测试同一种子序列相同、不同种子序列不同
- [x] 2.2 `lib/paper/roughen.ts`：多边形边细分 + 法线抖动 → 折线 path；测试路径可复现、每点偏移不超过幅度 a、闭合
- [x] 2.3 `lib/paper/shapes.ts`：椭圆、水滴、叶片、山脊线、树冠（含 evenodd 镂空）等顶点生成器；测试顶点数和包围盒
- [x] 2.4 `lib/scene/depth.ts`：缩放补偿与 `layerBox()` 的不露边计算；测试两个视口 × 最大视差偏移时都覆盖视口
- [x] 2.5 `lib/scene/lighting.ts`：`getTimeOfDay()` 与四个时段的光影表；测试四个时段的边界时刻和阴影方向
- [x] 2.6 `lib/scene/quality.ts`：降画质状态机（预热期、2 秒窗口、只降不升）；测试掉帧降级、已是最低不再变、预热期内不采样

## 3. 场景引擎

- [x] 3.1 `lib/scene.ts`：6 个纸层的形状、深度、纸色键名、古树树冠镂空纹样
- [x] 3.2 `components/scene/PaperLayer`：舞台盒 + 层内 SVG + 静态阴影副本（按画质决定是否模糊）
- [x] 3.3 `components/scene/PaperScene`：viewport / world 结构，接收视差和镜头推进，给各层提供挂载点（slot）
- [x] 3.4 `hooks/useParallaxInput`：鼠标 / 陀螺仪 / 自动漂移 / 减弱动画四种来源；「开启体感」按钮与拒绝后的记忆
- [x] 3.5 `hooks/useTimeOfDay`（每分钟检查一次，支持手动覆盖）与 `hooks/useReducedMotion`（支持开发时覆盖）
- [x] 3.6 `components/scene/PaperTexture`：全屏噪点纹理（pointer-events: none）
- [x] 3.7 `components/scene/Particles`：双面落叶、光斑、夜晚萤火虫；数量随画质变化；后台暂停
- [x] 3.8 `hooks/useQualityGovernor`：rAF 采样接入状态机，写入 scene store

## 4. 纸偶与风格样板页

- [x] 4.1 `lib/puppet/types.ts` 与定义校验函数；测试 id 唯一、关节在 viewBox 内、主体纸色 2–4 种
- [x] 4.2 `components/puppet/PaperPuppet`：递归渲染部件、关节 transform-origin、两脚钉、剪影阴影、待机动画（steps）、点击反馈、按钮无障碍
- [x] 4.3 在 `lib/animals.ts` 中定义阿橘（狐狸）的设定与纸偶
- [x] 4.4 `app/style-sample`：完整纸层场景 + 阿橘 + 调试面板（时段、画质、减弱动画、帧率）；生产构建返回 404
- [x] 4.5 E2E：样板页渲染、动画元素没有 filter、生产环境 404；用 Playwright 截四个时段 × 两个视口的图并自检
- [x] 4.6 ⏸ **检查点：把样板页截图和运行方式交给用户确认画风。确认（或按反馈调整）后才继续第 5 组**
- [x] 4.7 修复：WebKit（iPhone / Safari）上点击动物没反应——3D 容器拦截了命中测试；E2E 增加 WebKit 命中测试

## 5. 森林生活（用户确认画风时追加）

- [x] 5.1 `lib/forest/ground.ts`：`groundY(depth)` 地面高度、溪流中线与「是否在水里」判断；测试越远越高、和草地纸层地平线对齐
- [x] 5.2 `lib/forest/territory.ts`：领地与锚点（树干、树枝、树洞、溪流、岸边、草地），竖屏 / 横屏两套；测试每个锚点都在对应地形上、领地互不重叠
- [x] 5.3 `lib/forest/motion.ts`：`planMove()` 按习性生成关键帧（走 / 跳 / 飞 / 爬 / 漂），抛物线跳跃，朝向；测试落点、朝向、不进水、跳跃最高点
- [x] 5.4 `lib/forest/scheduler.ts`：走动调度状态机（12–30 秒、同时最多一只、可暂停）；测试
- [x] 5.5 `lib/forest/gather.ts`：围着篝火 / 阳光的弧形座位（伙伴紧挨中心、全部面朝中心、中心前方留空）；测试座位不重叠、都在草地上、不进水
- [x] 5.6 场景改造：动物从纸层挪到 world 里按 (x, y, depth) 定位；纸偶支持翻转朝向和步态动画（走、扇翅、漂浮）；接触阴影贴地
- [x] 5.7 篝火（夜晚）与阳光（白天）纸艺元素：火苗定格跳动、火光照亮周围
- [x] 5.8 样板页演示：阿橘偶尔走动；「开始倾诉」→ 聚拢 → 「让大家散开」；E2E 覆盖走动朝向、聚拢 / 散开、夜晚篝火、减弱动画

## 6. 全部角色

- [x] 6.1 在 `lib/animals.ts` 中补齐其余 6 只动物和古树岁岁的设定、纸偶部件（含步态部件：腿、翅膀）、标志性点击动作
- [x] 6.2 每只动物的领地、移动习性和速度
- [x] 6.3 所有定义通过校验测试；样板页显示全部角色、走动和聚拢，截图自检

## 7. 存储与入林

- [x] 7.1 `lib/db/`：Dexie 第 1 版（profile 表）、`profile.ts` 读写与内存降级；用 fake-indexeddb 测试读写和打开失败
- [x] 7.2 Zustand stores：app、scene、forest、gameContext（测试 20 条上限）、dev
- [x] 7.3 `app/page.tsx`：仅客户端渲染的启动流程（加载 → 读资料 → 入林或森林）
- [x] 7.4 入林引导组件：晨雾镜头推进（减弱动画时改为淡入淡出）、古树欢迎、昵称（不能为空、最多 12 字）、说明卡片、7 张伙伴卡片、最后一步才写入资料、存储不可用时的提示
- [x] 7.5 组件测试：昵称校验、写入时机、存储不可用的提示

## 8. 森林主场景

- [x] 8.1 `components/forest/ForestHome`：放置 8 个角色、伙伴徽记、免责声明、「开始倾诉」（触发聚拢）与「我的年轮」的占位提示
- [x] 8.2 `components/ui/PopupCard`：立体书式折起 / 折回、焦点管理、Esc、点外部关闭
- [x] 8.3 角色卡与古树卡的内容
- [ ] 8.4 镜头推近到动物、游戏面板的打开和关闭、回到森林后动物轻跳一下
      —— 镜头推近已做（点角色卡把镜头推近、折回后缩回）；游戏面板的开关停在 store 层（`openCard` / `startGame` / `closeGame`），
      面板本身属于 9.2；「回到森林后动物轻跳一下」要等面板接上才能验，跟着第 10 组一起收
- [x] 8.5 E2E：两个视口下热区不小于 44px 且互不重叠、视差最大时不露边、入林 → 森林 → 打开角色卡 → Esc 关闭

## 9. 小游戏通用部分

- [ ] 9.1 `lib/ai/types.ts`（ForestAI 接口）与 `lib/ai/mock.ts`（固定结果、延迟、模拟失败）；测试接口约定
- [ ] 9.2 `components/games/GameShell`：标题、回到森林、请求失败时的挠头和重试（保留输入）、等待中禁止提交
- [ ] 9.3 `components/games/dnd/`：Draggable、DropZone、点选模式、键盘操作、没放进目标时弹回
- [ ] 9.4 开发模式的 gameContext 查看按钮和「模拟 AI 失败」开关

## 10. 七个小游戏（逻辑先写测试）

- [ ] 10.1 敲树洞：`tapSession` 状态机（3 秒停手 / 满 30 秒结束）测试 → 组件（纸屑、连击、震动、微震、情绪词最多选 3 个、笃笃的回应）
- [ ] 10.2 事实还是猜测：点评生成函数测试（一致 / 不一致 / 思维陷阱汇总，不出现「错了」）→ 组件（示例、气泡、两个树洞、墨墨点评）
- [ ] 10.3 翻面镜：组件（输入、尾巴一扫、rotateY 翻面、三种说法、收藏、没收藏不记录）
- [ ] 10.4 熊抱：`pickNoRepeat` 与暖光强度曲线测试 → 组件（长按、纸灯笼暖光、60 次/分心跳、震动、不足 1 秒的提示、20 句以上本地文案）
- [ ] 10.5 龟壳呼吸：`breath` 阶段计算测试 → 组件（龟壳纸层升降、阶段与倒数、1–10 轮、Web Audio 提示音、暂停 / 结束）
- [ ] 10.6 落叶漂流：组件（不保存的说明、写叶子、放进溪流、逐字晕开、多片叶子）；测试 IndexedDB 和 gameContext 里没有叶子文字
- [ ] 10.7 藏坚果：组件（啃咬动画、折纸坚果、放进树洞、「就这些」的禁用与提示、跳跳打气）

## 11. 收尾验证

- [ ] 11.1 E2E 主流程：入林 → 森林 → 逐个完成 7 个小游戏 → 检查 gameContext
- [ ] 11.2 E2E：减弱动画模式、字体分片数量少于 30、动画元素没有 filter
- [ ] 11.3 全量检查：typecheck、lint、单元测试、E2E、build 全部通过；截图自检两个视口
- [ ] 11.4 更新 README，列出第一阶段已完成的功能和待办，交给用户验收
