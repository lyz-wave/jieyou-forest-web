# 第二阶段：倾诉与圆桌（stage2-roundtable）

## Why

第一阶段做完了「进得来、玩得动」，但**最核心的那件事还是空的**：「开始倾诉」按下去只是让七只动物聚拢倾听，古树只回一句「年轮还在生长」。用户打开这个产品是为了把心里的事说出来、被听见、被从不同角度陪一遍——现在这一段还是桩子。

这一阶段要把桩子接上：说一句话 → 七只动物各自用自己的方式回应 → 古树总结 → 可以继续追问 → 结束。为此引入真实模型调用（服务端 Route Handler 持有 API Key），但**保留第一阶段所有的安全底线**：失败就是同一句「风太大了没听清，能再说一次吗？」+ 重试，小游戏代码一行不改（`ForestAI` 接口不变）。

## What Changes

1. **服务端四个接口**（Route Handlers，API Key 只在服务端）：`POST /api/roundtable`（一次调用返回全部动物的发言，避免重复观点）、`POST /api/summary`（古树总结）、`POST /api/reply`（追问，默认古树或指定动物）、`POST /api/risk`（风险检测）。
2. **严格 JSON + 手写类型守卫**：不引入第三方向依赖（zod 之类的库要先按用户的依赖规则确认维护状态并征得同意，本轮先不引）；非法 JSON 一律当失败处理，走同一句降级文案。
3. **Prompt 模板集中放在 `lib/prompts.ts`**，照 `解忧森林-prompt.md` 第十节的四组模板；模板里不塞用户的长期资料，只带这一次倾诉的内容与游戏上下文。
4. **前端 `getForestAI()` 换成 HTTP 实现**：`lib/ai/index.ts` 换实现，`ForestAI` 接口与调用点不动，所以七个小游戏、`useAiRequest`、`GameShell` 全部零改动；`?dev=1` 的「模拟 AI 失败」开关继续生效。
5. **倾诉流程**：心情打分（1–10，可跳过）→ 输入（长文本，可选语音输入）→ 聆听动画 → 风险检测 → 圆桌（伙伴先说，正在说话的动物走到前方放大高亮，头顶气泡打字机出字并标出思维方式；「下一位」「全部显示」；每段可点「说到心里了」）→ 古树总结（发光 + 四档植物意象 + 开放式问题）→ 继续对话（默认古树，点头像或 `@名字` 指定动物，「让大家再说说」）→ 结束（「心结解开了」/「先放一放」，本阶段只回到森林，**落盘是第三阶段的事**）。
6. **风险守护**：先做本地粗筛（不把每一句话都传上去），命中可疑才调 `/api/risk`；高风险时给出固定的守护文案与求助资源入口。这一条涉及伦理底线，文案与资源入口必须由用户确认后再上线。
7. **隐私说明同步改**：入林说明卡（`components/onboarding/Onboarding.tsx`）与森林里的隐私说明要讲清楚「你写的话会发给模型服务商，服务端不保存、不写日志」。

## Capabilities

- **New `talk-session`**：从「开始倾诉」到结束的整段流程（心情打分、输入、聆听、结束）。
- **New `roundtable`**：七只动物按序发言、正在说话的高亮、下一位 / 全部显示、说到心里了、追问与指定动物。
- **New `tree-summary`**：古树的四档总结与开放式问题。
- **New `risk-guard`**：本地粗筛 + 服务端风险检测 + 高风险守护文案。
- **Modified `forest-ai`**：`lib/ai/index.ts` 从本地 mock 换成 HTTP 实现，接口签名不变。
- **Modified `onboarding`**：入林说明卡的隐私文案。

## Impact

- 新增：`app/api/{roundtable,summary,reply,risk}/route.ts`、`lib/ai/{schema,anthropic}.ts`、`lib/prompts.ts`、`components/talk/**`、`lib/stores/talk.ts`、`e2e/talk.spec.ts`、`.env.example`。
- 修改：`lib/ai/index.ts`（换实现）、`lib/ai/types.ts`（新增圆桌与总结所需类型，旧类型保持兼容）、`components/forest/ForestHome.tsx`（「开始倾诉」进入流程）、`components/forest/CharacterCard.tsx`（可选：把「说到心里了」挂上去）、`components/onboarding/Onboarding.tsx`（隐私文案）、`README.md`、`HANDOFF.md`。
- 环境变量：`ANTHROPIC_API_KEY`、`JIEYOU_MODEL_MAIN`、`JIEYOU_MODEL_LIGHT`（模型名不写死在代码里）。**Key 只在服务端读，前端拿不到；服务端不保存用户文本、不写日志。**
- 不引入新依赖；不改 Dexie 结构（存储是第三阶段）；游戏代码零改动。

## 待用户确认（动手前）

1. **模型与 Key**：你有可用的 Anthropic API Key 吗？放 `.env.local`。原需求里写了具体模型名，**需要确认这些模型 ID 现在可用**（不可用就用你能提供的型号，环境变量留出位置）。
2. **风险检测放哪一阶段**：我建议放第二阶段（它决定危险情况下用户看到什么），但求助资源入口要想好——热线号码属于第 8 节第 9 条遗留问题，**上线前必须核实**；没核实之前只显示「找人陪着你」这类不指名的引导。
3. **要不要语音输入**（Web Speech API，浏览器支持不一）：我建议先做文本，语音作为可选增强放在后面。
4. **是否允许引入 zod**：我建议不引，手写类型守卫就够（四类响应、字段固定）。
