## MODIFIED Requirements

### Requirement: 入林引导流程
入林引导 SHALL 依次包含：
1. 晨雾转场：镜头向前推进，穿过几层纸做的晨雾，纸雾向两侧拉开
2. 古树欢迎：不超过 3 句话
3. 输入昵称
4. 说明卡片：「这里不是心理治疗；遇到紧急情况请联系热线；你的数据只保存在你的设备上」，用户点「我知道了」继续
5. 选择「今天想先找谁玩」：7 张卡片，每张显示动物名字、一句话思维方式和小游戏名；卡片之外另有一个可选入口「不知道找谁？帮我看看」（见 `companion-choice` 能力）

用户选好伙伴后，系统 SHALL 把资料 { nickname, companion, onboardedAt, selfPicks } 存入 IndexedDB，然后进入森林主场景。资料 SHALL 只在最后一步完成时写入。`selfPicks` 是数组，记录每次入林选择伙伴的依据。

#### Scenario: 完整走完
- **WHEN** 用户输入昵称「小满」、读完说明卡片、选择阿橘
- **THEN** 本地保存 { nickname: "小满", companion: "fox", selfPicks: [{ source: "self", animalId: "fox" }] } 和入林时间，并进入森林主场景

#### Scenario: 走引导选伙伴
- **WHEN** 用户点「帮我看看」、答完 3 题、在推荐卡上点「就是它」
- **THEN** 推荐的动物成为伙伴，资料里的 `selfPicks` 末条为 guided 来源

#### Scenario: 中途刷新
- **WHEN** 用户在选择伙伴之前刷新页面
- **THEN** 入林引导从头开始，`selfPicks` 里不会留下半途的记录
