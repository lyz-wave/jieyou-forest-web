# 开发进度记录（progress.md）

> 用户规则：每个会话结束时记录调用数 / planning 占比 / 返工次数 / diff 行数。
> 本文件从 2026-10-06 起建立（此前没有这个文件）。数字都写明来源，"待补"就是没测到，不猜。

## 2026-10-06 · 第 8 组「森林主场景」（会话从 claude-code 迁移到 DSH 之后）

**交付**

- 8.1 森林主场景浮层：`components/forest/ForestHome.tsx`（欢迎条、存储不可用提示、开始倾诉、免责声明、角色卡）
- 8.3 角色卡与古树卡：`components/forest/CharacterCard.tsx`（含「我的伙伴」和在年轮占位纸条）；古树热区 `components/forest/TreeSpot.tsx` + `lib/scene.ts` 的 `TREE_HOTSPOT`
- 伙伴徽记 `components/forest/CompanionBadge.tsx`
- 8.4 的一半：`lib/stores/forest.ts` 增加 `opened / openedAt / pendingGame` 与 `openCard / closeCard / startGame / closeGame`；点角色卡把镜头推近、折回后缩回。游戏面板本体属 9.2，`tasks.md` 的 8.4 **未勾选**
- 8.5 E2E：`e2e/forest-home.spec.ts`（8 个用例 × 2 个视口）
- 44px 可点区域：`lib/scene/tap.ts` + `components/scene/ActorContext.ts` + `WorldActor` / `PaperPuppet` 改动（屏幕缩放的推导见 HANDOFF.md 9.3）
- 横屏把乌龟的落脚点从 `bank(220, 24)` 挪到 `bank(190, 24)`，让补过热区的可点矩形不再和水獭相交

**验证（都是实跑结果）**

- `npx vitest run`：27 个文件、225 个测试通过
- `npm run typecheck`、`npm run lint`：通过
- 生产 E2E（`playwright.prod.config.ts`，mobile + desktop）：26 个全部通过
- 开发服务器 E2E：30 通过、2 跳过（视差两项按设计只跑桌面）；`dev-iphone` 命中测试单独重跑通过（需 `PLAYWRIGHT_BROWSERS_PATH=0`）
- 截图自检：`docs/forest/mobile-home.png`、`docs/forest/desktop-home.png`

**返工次数：4**

1. 把 `WorldActor` transform 里的 `s·k` 当成屏幕缩放，`tapTip` 补量算小了 3px，笃笃的热区补完仍不足 44px → 改成 `screenScale`（`perspective: 1000px` 的投影又乘了一次 `1/s`，两道正好抵消）
2. `playwright.existing-dev.config.ts` 第一版只保留 `dev-*` 项目，非 `.dev.spec.ts` 的用例没法用用户开着的 dev server 跑 → 改成所有项目都指向 `DEV_URL`
3. 把入林流程抽成 `e2e/helpers.ts` 时，第一版把「勾伙伴卡」写进本地函数里，丢掉了前面四步 → 重写
4. 交互用例用 `locator.click()`：手机上是漂移视差，元素一直在动，稳定性检查必然 90 秒超时 → 改成量出热区再用 `page.mouse.click()`；顺带修了 3 处断言（视差逐轴比较、关卡片后只看相机 z、热区角点只在真的补过时断言在盒外）

**diff 行数**

- 已跟踪文件：13 个文件，**+205 / −90**（`git diff --numstat`，不含 PNG）
- 新增文件：11 个，**783 行**（`wc -l`，含两个测试文件 95 行、E2E 351 行、helpers 25 行）
- 未提交：按用户规则，没有明确要求就不 commit / push

**调用数 / planning 占比**

待补：本段在 DSH 里无法取到可靠的工具调用计数（会话从 claude-code 迁移过来，前面的统计不在同一份日志里），不编数字。会话结束时如果 DSH 能给出统计，再回填。
