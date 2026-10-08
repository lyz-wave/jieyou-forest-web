# forest-ai

## ADDED Requirements

### Requirement: 换成 HTTP 实现时接口不变
`getForestAI()` 返回的 `ForestAI` 接口签名 SHALL 保持不变：调用方（七个小游戏、`useAiRequest`、`GameShell`）SHALL 不改一行代码就能从本地 mock 切到真实接口。

#### Scenario: 游戏代码零改动
- **WHEN** 只替换 `lib/ai/index.ts` 的实现
- **THEN** 小游戏与通用组件的既有测试不改仍然全绿

### Requirement: 失败与小游戏共用同一句降级文案
HTTP 实现失败时 SHALL 返回 `AI_FAILURE_LINE`（「风太大了没听清，能再说一次吗？」），调用方据此显示重试；系统 SHALL NOT 使用第二套文案。

#### Scenario: 接口失败
- **WHEN** 请求失败或者响应不是合法 JSON
- **THEN** 调用方拿到降级文案并显示重试
- **AND** 界面上不出现模型返回的原始报错

### Requirement: 开发开关仍然生效
`?dev=1` 的「模拟 AI 失败」开关 SHALL 在 HTTP 实现下同样生效，并走同一个失败分支。

#### Scenario: 打开模拟失败
- **WHEN** 用户打开调试抽屉并勾上「模拟 AI 失败」
- **THEN** 下一次 AI 请求直接走失败分支（不发网络请求）
