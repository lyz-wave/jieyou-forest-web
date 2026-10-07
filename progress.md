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

**调用数 / planning 占比**（数字来源：`~/.dsh/sessions/--Users-lang-Desktop-jieyou--/import-f7c3c11b-2a2e-485b-9830-8fa2c60341b8/session.v4.jsonl.zstd`，解压后按 `tool/call` + `tool/ptc-dispatch` 计数）

本组对应这条 DSH 会话的 **turn 37**（10-06 13:39–15:50，「开始」那一轮），**444 次工具调用**：

- 按工具：run_code 149｜read 106｜bash 63｜edit 42｜grep 37｜write 26｜compress 6｜job_output 6｜glob 5｜read_image 2｜skill 1｜acp_status 1
- planning 占比 **35%**（155 次；口径：read / grep / glob / compress / skill 这类只读的规划与探索调用）｜写盘 15%（68 次）｜验证类 bash 7%（31 次：vitest / playwright / typecheck / lint / build）
- 口径说明：一条 `run_code` 里内联调用的工具也算在内，所以总数比「模型轮次」大得多；只统计工具调用，不含思考与文字输出。

## 2026-10-06 · 第 9–11 组：小游戏通用部分、七个小游戏、第一阶段收尾（同一条 DSH 会话的 turn 40）

**交付**

- 第 9 组（9.1–9.4）小游戏通用部分：`lib/ai/{types,mock,index}.ts`、`lib/dev.ts`、`lib/games/dnd.ts`、`components/games/useAiRequest.ts`、`components/games/GameShell.tsx`、`components/games/dnd/{DndProvider,Draggable,DropZone}.tsx`、`components/dev/{GameContextTray,DevTools}.tsx`
- 第 10 组（10.1–10.7）七个小游戏 + 第 8 组 8.4 的收尾：`components/games/GameHost.tsx`、`lib/forest/play.ts`（`playTokenFor`）、森林里的游戏面板开关与「回到森林后轻跳一次」；七个游戏本体（敲树洞、事实还是猜测、翻面镜、熊抱、龟壳呼吸、落叶漂流、藏坚果）
- 11.1 `e2e/games.spec.ts`（入林后逐个玩完七个小游戏、gameContext 记下七条）
- 11.2 `e2e/quality.spec.ts`（字体分片 < 30 且入林后仍成立、动画元素不带 filter、减弱动画下无视差/无粒子/相机不漂移）
- 11.3 全量检查 + 两个视口的截图自检；11.4 `README.md` 改写成验收版
- 文档：`openspec/changes/stage1-paper-forest/tasks.md` 勾到 63/63（8.4、10.1–10.7、11.1–11.4）；`HANDOFF.md` 881 → 917 行（新增 §9.6，第 1 阶段状态改为已完成）

**验证（都是实跑结果）**

- `npx vitest run`：52 个文件、**371 个测试全部通过**
- `npm run typecheck`、`npm run lint`：0 报错
- 生产 E2E（`playwright.prod.config.ts`）：mobile + desktop **38 个全部通过（2.5 分钟）**
- 开发 E2E（`playwright.existing-dev.config.ts`，复用 3200 上用户开着的 dev server）：**30 通过、2 跳过**；`dev-iphone` 的 WebKit 命中测试 **1 通过**
- `e2e/games.spec.ts` 单独跑：mobile 46.7s、desktop 52.5s，各 1 个用例通过
- `npm run build` 成功；截图 docs/onboarding 6 张、docs/forest 4 张、docs/games 16 张，已自检手机与桌面两个视口的森林主场景

**返工次数：10**（6 条是代码／测试的问题，4 条是环境与工具链）

1. 第 9 组 DevTools 在 effect 里 setState，撞上 eslint 的 `react-hooks/set-state-in-effect` → 改成 `useSyncExternalStore`
2. 第 9 组两处类型签名：mock 的入参签名和 `AiOptions` 不匹配（TS2345）、`vi.fn()` 空元组（TS2493）→ 改成带参签名
3. 第 10 组 E2E：游戏面板是从底边折起（rotateX −88°→0）的，动画刚开始时 `boundingBox()` 量到的是被压扁的盒子（实测按钮 179×1.2px），按那个坐标点不到 → 先 `hover()` 等元素稳定再量
4. 第 10 组 E2E：AI 游戏要等 mock 的 600–1200ms，没等 `[data-draggable]` 可见就收集气泡，拿到 0 个 → 加显式等待
5. 11.2 新写的三个用例漏了 `page.goto("/")`（helpers 里的 `finishOnboarding` 不含导航）→ 每个用例在等「走进森林」时各超时 90 秒，6 failed，白花 9 分钟
6. 直接跑 `npm run test:e2e` 会自己起 3101 的 `next dev`，而 Next 16 同一目录只允许一个 dev server（用户机器上开着 3200）→ 整套 E2E 死在 `Process from config.webServer was not able to start`，改用生产配置和复用 3200 的开发配置
7. WebKit 的 `dev-iphone` 必须先设 `PLAYWRIGHT_BROWSERS_PATH=0`，否则会去找 `~/Library/Caches/ms-playwright` 里不存在的浏览器
8. `run_code` 默认 deadline 120 秒，跑 E2E 到一半被打断（命令被提升成后台 job 但输出丢了）→ 长命令改 `run_in_background: true` 再用 `job_output` 收
10. `components/games/GameShell.test.tsx` 的「失败时动物挠挠头…」在全量并行跑时约 1/11 出现「…，真」少最后一个字：userEvent 默认 `delay: 0`，最后一个字还没落进 DOM 就走到断言 → 改成 `userEvent.setup({ delay: null })`，复跑单文件 15 次、全量 6 次全绿（这条是提交前做逐 commit 验证时才发现的）
9. `HANDOFF.md` 被 `read` 静默截断（约 600 行），照截断内容 `write` 回写导致尾部 269 行丢失 → 用会话日志（`zstd -d` 后重放历次 write/edit）恢复，并按这条教训改了习惯：大文件只用 `edit` 改，回写前先 `wc -l` 比对

**diff 行数**（对比远端 main 的 `a36bd31`）

- 已跟踪文件：20 个文件，**+334 / −52**（`git diff --shortstat`，不含 PNG）
- 新增文件：56 个文本文件、**4124 行**（`wc -l`；其中非测试的生产代码 2380 行）
- 未提交：按用户规则，没有明确要求就不 commit / push

**调用数 / planning 占比**

本组对应 **turn 40**（10-06 16:47 起，「继续」那一轮，一直到 11.4 收尾），**643 次工具调用**：

- 按工具：run_code 176｜read 145｜edit 103｜bash 82｜write 66｜grep 42｜job_output 10｜compress 8｜read_image 4｜glob 3｜job_list 2｜mnemon_runtime_memory 1｜job_kill 1
- planning 占比 **31%**（198 次，同上口径）｜写盘 26%（169 次）｜验证类 bash 6%（41 次）

这条 DSH 会话（10-06，turn 35–40）合计 **1142 次**工具调用：turn 35 建仓库名 6 次、turn 36 推送 25 次、turn 37 第 8 组 444 次、turn 38 打开预览 12 次、turn 39 提交推送 12 次、turn 40 第 9–11 组 643 次。迁移进来的 claude-code 历史（10-03 / 10-04，turn 1–34）另有 820 次，整个日志共 1962 次。

