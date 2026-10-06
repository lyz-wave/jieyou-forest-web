@AGENTS.md

# 解忧森林 · 项目约定

完整产品需求见 `解忧森林-prompt.md`。当前进度和任务清单见 `openspec/changes/`（先运行 `openspec list`）。

## 技术栈
- Next.js 16（App Router）+ React 19 + TypeScript strict + Tailwind 4
- 动画：`motion`（从 `motion/react` 导入，即 Framer Motion）
- 状态：Zustand；本地存储：Dexie（IndexedDB）
- 测试：Vitest + Testing Library（单元 / 组件），Playwright（E2E，跑生产构建）

## 目录
- `app/` 路由。`/` 是唯一的产品页；`/style-sample` 只在开发模式可访问
- `components/scene/` 2.5D 纸雕场景引擎；`components/puppet/` 纸偶；`components/forest/` 森林主场景；`components/onboarding/` 入林；`components/games/` 小游戏；`components/ui/` 通用纸艺 UI
- `lib/paper/` 纸边与形状生成（纯函数）；`lib/scene/` 景深、光影、画质（纯函数）；`lib/ai/` AI 接口与 mock；`lib/db/` Dexie；`lib/stores/` Zustand
- `hooks/` 客户端 hooks
- `e2e/` Playwright 测试

## 硬性规则
- **素材集中**：所有角色设定和纸偶部件只写在 `lib/animals.ts`；所有场景纸层只写在 `lib/scene.ts`。组件不得内联动物或场景形状。
- **性能**：只对 transform / opacity 做动画；做 transform 动画的元素不加 CSS filter；阴影用静态的偏移副本。
- **随机必须带种子**：形状和粒子用 `lib/paper/random.ts`，禁止直接用 `Math.random()` 生成会渲染的形状（会导致水合不一致、无法测试）。
- **减弱动画**：所有动画组件都要处理 `useReducedMotion()`。
- **AI**：小游戏只通过 `lib/ai` 的 `ForestAI` 接口取数据。
- 不用 `any`；纯逻辑先写测试（TDD）。

## 命令
- `npm run dev` 开发
- `npm test` 单元测试；`npm run test:e2e` E2E（会先 build）
- `npm run typecheck`、`npm run lint`
