## ADDED Requirements

### Requirement: 「帮我看看」是可选入口
第 5 步 SHALL 保留七张伙伴卡片，并在卡片之外提供一个可选入口「不知道找谁？帮我看看」。不点它时，入林流程与第一阶段完全一致。

#### Scenario: 完全不用引导
- **WHEN** 用户直接用卡片选了团团并点「一起入林」
- **THEN** 正常入林，并且 `selfPicks` 记下一条 { source: "self", animalId: "bear", want: [] }

#### Scenario: 点开又退回去
- **WHEN** 用户点「帮我看看」，随后点「还是想自己挑」
- **THEN** 回到七张卡片，不写入任何 guided 记录

### Requirement: 问的是此刻，不是人格
引导 SHALL 依次问 3 道题，每题 2–6 个选项；题目与选项只涉及「此刻想被怎么对待」，SHALL NOT 询问或推断人格类型、星座、年龄、性别等任何可用来给用户分类的信息。第 1 题最多选两项（允许「两个都想」），第 2、3 题单选。

#### Scenario: 选项文案
- **WHEN** 用户点「帮我看看」
- **THEN** 3 道题依次出现，选项里只有「被理解」「被抱一下」这类当下需要，不出现「性格」「类型」「你是什么样的人」这类措辞

#### Scenario: 两个都想
- **WHEN** 用户在第 1 题同时选中两个选项
- **THEN** 两个选项都算数，推荐算法把两者的权重一起计入

### Requirement: 推荐算法只由答案决定
推荐 SHALL 是一个纯函数：输入 3 道题的答案，输出恰好一只动物；同样的答案永远得到同样的推荐（无随机、无时间、无外部数据）。七只动物 SHALL 都可达。

#### Scenario: 确定性与可达性
- **WHEN** 同样的答案代入两次
- **THEN** 得到同一只动物；并且存在一组答案能推荐出七只中的每一只

### Requirement: 推荐之后有两条出路
答完 3 题 SHALL 显示推荐结果：一只动物 + 一句「为什么是它」（使用当时的答案措辞，不做人格判断），并提供「就是它」与「还是想自己挑」两个按钮。

#### Scenario: 接受推荐
- **WHEN** 用户在推荐卡上点「就是它」
- **THEN** 该动物成为伙伴，并且 `selfPicks` 记下一条 { source: "guided", want: [选中的陪伴方式], animalId }

#### Scenario: 不接受
- **WHEN** 用户在推荐卡上点「还是想自己挑」
- **THEN** 回到七张卡片，可以自己选；最终按 source "self" 记录

### Requirement: selfPicks 只存在本地
每次完成入林 SHALL 在本地资料里追加一条 `selfPicks` 记录，字段为 { at, want, animalId, source }；SHALL NOT 上传，且 SHALL NOT 用它做任何推荐之外的事。数据随资料一起存在 IndexedDB，隐私模式下退回内存。

#### Scenario: 记录内容
- **WHEN** 用户按引导选了墨墨
- **THEN** 资料里 `selfPicks` 末条为 { source: "guided", animalId: "owl", want: [...] , at: 数字 }
