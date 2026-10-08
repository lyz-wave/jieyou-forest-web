# 任务：stage2-roundtable（倾诉与圆桌）

> 状态：**已完成**（24 项全勾）。2026-10-08 又按产品文档 `解忧森林-prompt.md` 逐节校对了一轮，改动见 `../doc-alignment/` 与 HANDOFF §9.10。

## 1. 前提与规格

- [x] 1.1 与用户确认四件事：模型 ID 与 `ANTHROPIC_API_KEY`、风险检测放第二阶段、语音输入是否后置、是否允许引入 zod（记录结论到 `proposal.md` 的「待用户确认」）
- [x] 1.2 写本变更的规格：`specs/talk-session/spec.md`、`specs/roundtable/spec.md`、`specs/tree-summary/spec.md`、`specs/risk-guard/spec.md`，以及 `specs/forest-ai/spec.md` 的 MODIFIED
- [x] 1.3 定 `lib/prompts.ts` 的四组模板（圆桌 / 总结 / 追问 / 风险），照 `解忧森林-prompt.md` 第十节；模板里只带这一次的内容
- [x] 1.4 写守护文案（危机时岁岁先说什么、三条出路、求助卡）与隐私说明：见 `lib/talk/guard.ts` 的 `CRISIS` / `HOTLINES` / `PRIVACY_LINE`（**按第八节写上号码** 12356 / 400-161-9995 / 110 / 120，注释标明上线前必须再核实一次；隐私说明写在输入框下面）
- [x] 1.5 按产品文档逐节校对（2026-10-08）：风险三级改回 none / concern / crisis、补危机处置（古树回应 + 求助卡 + 确认安全之后才能继续）、concern 写进总结、聆听动画与圆桌反应动画、「全部显示」按钮名、点头像点名——见 `../doc-alignment/`

## 2. 服务端（先纯逻辑，再路由）

- [x] 2.1 `lib/ai/schema.ts`：四类响应的类型 + 手写类型守卫（多余字段、类型错、缺字段、超长一律判失败）；测试覆盖每类边界
- [x] 2.2 `lib/ai/anthropic.ts`：一次调用 + JSON 校验，transport 可注入（测试不打真实网络）；Key 从环境变量读，缺失时返回失败而不是抛错
- [x] 2.3 Route Handler：倾诉四个（`/api/roundtable`、`/api/summary`、`/api/reply`、`/api/risk`）+ 小游戏三个（`/api/split-thought`、`/api/reframe`、`/api/break-down`，因为 `getForestAI()` 要换成 HTTP 实现）；入参校验（长度上限）、超时、统一错误体
- [x] 2.4 测试：入参非法 400、上游失败 502、Key 缺失时不发请求且返回降级、**服务端不把用户文本写进日志**（断言 console 未被调用）

## 3. 前端：接口切换

- [x] 3.1 `lib/ai/index.ts` 换成 HTTP 实现（`getForestAI()`），`ForestAI` 签名不变；失败沿用「风太大了没听清，能再说一次吗？」+ 重试
- [x] 3.2 `?dev=1` 的「模拟 AI 失败」继续生效（走同一个失败分支）
- [x] 3.3 测试：mock fetch 的成功 / 失败 / 超时三条路径；小游戏与 `useAiRequest` 的既有用例不改仍全绿（证明零改动）

## 4. 前端：倾诉流程

- [x] 4.1 心情打分（1–10，可跳过）+ 输入区（长度上限 `TALK_MAX=1000`、字符计数；语音输入按 1.1 的结论后置，本阶段不做）
- [x] 4.2 聆听动画：动物安静下来、纸屑停下；减弱动画下退化为静态。**按 6.3.4 补上动作**：点头、竖耳朵、团团托腮（`lib/talk/gesture.ts` 的 `LISTEN_GESTURE` + `lib/puppet/gesture.ts`）
- [x] 4.3 风险检测：**每条消息都先判一次**——本机词表先粗筛，认出危险词就当场停下、不再外发；其余调 `/api/risk` 用轻量模型再判。三档 none / concern / crisis：crisis 停下给守护文案与求助卡（1.4 的文案），concern 照常圆桌、只在总结里温和提一句
- [x] 4.4 圆桌：伙伴先说，其余按序；正在说话的动物到前方放大高亮（复用第 8 组的镜头 focus），头顶气泡打字机出字并标出思维方式；「下一位」「全部显示」；每段可点「说到心里了」；**没在说话的那几只在点头 / 偏头想 / 轻轻笑（6.3.6 的反应动画）**
- [x] 4.5 古树总结：发光 + 四档植物意象 + 开放式问题
- [x] 4.6 继续对话：默认古树；点头像或 `@名字` 指定动物；「让大家再说说」
- [x] 4.7 结束：「心结解开了」/「先放一放」→ 回到森林（本阶段不落盘）
- [x] 4.8 组件测试：圆桌顺序与打字机、下一位 / 全部显示、@ 指定动物、追问失败重试、风险分支、结束后回到森林

## 5. 无障碍与画面底线

- [x] 5.1 键盘能走完整个倾诉（打分、输入、下一位、全部显示、@、结束），热区 ≥44px；打字机在减弱动画下改为整段出现（键盘全程见 `components/talk/TalkFlow.test.tsx` 的「一路键盘走完」；热区与减弱动画见 `e2e/talk.spec.ts`）
- [x] 5.2 E2E（手机与桌面两个视口）：入林 → 开始倾诉 → 走完一轮圆桌与总结 → 追问一次 → 结束回到森林；用假的服务端（不真调模型），并断言失败时的降级文案与重试（`e2e/talk.spec.ts` 三个用例 × 两个视口，6 passed）

## 6. 验收

- [x] 6.1 `npm run typecheck`、`npm run lint`、`npm test`、生产 E2E、`npm run build` 全绿；两个视口截图自检
- [x] 6.2 更新 README（第二阶段做了什么、环境变量怎么配、还差什么）与 HANDOFF（新增一节：接口、Prompt、踩坑）
- [x] 6.3 交用户验收