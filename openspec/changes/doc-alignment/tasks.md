# 任务：doc-alignment（按产品文档逐节校对）

> 状态：**已完成**（2026-10-08）。用户当天的要求：严格按 `解忧森林-prompt.md` 实现，文档没写的地方自己设计，不复用本地那个同名的 Electron 项目。

## 1. 先审计，别急着改

- [x] 1.1 查清有没有读过 `/Users/lang/Desktop/比赛/jieyou-forest` 的源码：关键词全 0 次，两边动物数量、数据结构、path 全不同（证据见 proposal.md）
- [x] 1.2 逐节读 `解忧森林-prompt.md`（284 行），列出七处偏离并回报用户（风险等级命名 / crisis 处置 / concern / 聆听动画 / 反应动画 / 按钮名 / 点头像点名）

## 2. 风险三级与危机处置（第八节）

- [x] 2.1 `lib/ai/schema.ts` 的 `RISK_LEVELS` 改成 none / concern / crisis；`lib/prompts.ts` 的 `riskPrompt` 与总结模板跟着改（concern 时多写一句温和提醒）
- [x] 2.2 `lib/talk/flow.ts`：词表改名 `CRISIS_MARKERS` / `CONCERN_MARKERS`；`needsServerCheck(local) = local !== "crisis"`
- [x] 2.3 `lib/talk/guard.ts` 重写：`CRISIS`（岁岁先回应、三步、求助卡、确认安全）+ `HOTLINES`（12356 / 400-161-9995 / 110 / 120，注释标明上线前必须核实）+ `CONCERN_LINE`
- [x] 2.4 `RiskStage` 加求助卡与「我现在是安全的」复选框；`useTalkFlow.checkRisk` 改成顺序，crisis 时不发圆桌请求；`SummaryStage` 显示 concern 提醒
- [x] 2.5 相关单测全部改写（TDD：先红后绿，8 个失败起步）：`lib/talk/{guard,flow}.test.*`、`lib/stores/talk.test.ts`、`components/talk/{useTalkFlow,TalkFlow}.test.tsx`、`lib/prompts.test.ts`

## 3. 聆听与反应动作（6.3.4 / 6.3.6）

- [x] 3.1 `lib/talk/gesture.ts`：`LISTEN_GESTURE`（点头 / 竖耳朵 / 托腮）+ `REACTIONS` + `reactionPlan()` + `gestureFor()`
- [x] 3.2 `lib/puppet/gesture.ts`：五种动作的关键帧与节奏；`PaperPuppet` 加 `gesture` / `gestureLoop` 与 `data-gesture`，减弱动画下不播
- [x] 3.3 `ForestAnimals` / `ForestAnimal` 透传动作；圆桌时没说话的动物在点头 / 偏头想 / 轻轻笑
- [x] 3.4 测试：两个 gesture 纯逻辑、`PaperPuppet.test.tsx`、E2E 断言 `data-gesture`

## 4. 文案与交互（6.3.6 / 6.3.8）

- [x] 4.1 「一起说完吧」→「全部显示」（组件、单测、E2E、README、HANDOFF）
- [x] 4.2 `mentionsTarget()` + `ask(question, chosen)`；`FollowUpStage` 加 8 个纸偶头像（≥44px、`aria-pressed`、「这句话会交给：X」），写了 @名字 时以文字为准
- [x] 4.3 测试：`lib/talk/flow.test.ts` 的 `mentionsTarget`；`components/talk/TalkFlow.test.tsx` 的「点头像点名」两条

## 5. 验证与文档

- [x] 5.1 E2E 新增两条守护页用例（本机认出 / 服务端判出，都断言不发圆桌请求）；修掉 `getByRole("alert")` 撞 Next 路由播报器的问题（改用 `[role="alert"][data-autofocus]`）
- [x] 5.2 `npm test`（74 文件 526 用例）、`npm run typecheck`、`npm run lint`、生产 E2E 50 个全部通过；截图 docs/talk/*-talk-guard.png
- [x] 5.4 第二次校对补的两处：第四节的语气进 Prompt；「让大家再说说」再请一轮带上已经说过的（`startRoundtable(text, history)` + `again()`）
- [x] 5.3 更新 README、HANDOFF §9.10 与 §2 进度、`stage2-roundtable/tasks.md` 的 1.4 / 4.2 / 4.3 / 4.4

## 6. 还没做（等用户拍板）

- [ ] 6.1 6.3.3 的可选语音输入（Web Speech API）——用户未表态，不擅自开工
- [ ] 6.2 第 5 步「不知道找谁？帮我看看」引导选伙伴的去留（文档之外的一步）

