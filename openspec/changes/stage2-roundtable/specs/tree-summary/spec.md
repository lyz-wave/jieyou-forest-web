# tree-summary

## ADDED Requirements

### Requirement: 古树在最后总结
七只动物说完之后，古树 SHALL 发光并给出总结；总结使用的意象 SHALL 只来自四档植物意象（草 / 叶 / 树 / 苗），SHALL NOT 自造别的比喻体系。

#### Scenario: 总结出现在圆桌之后
- **WHEN** 最后一只动物说完
- **THEN** 古树发光并给出总结
- **AND** 总结里能认出四档意象中的一档

### Requirement: 总结以开放式问题收尾
总结的最后一句 SHALL 是开放式问题，SHALL NOT 使用命令句、诊断或「你应该」。

#### Scenario: 收尾是提问
- **WHEN** 总结展示完
- **THEN** 最后一句以提问结束
- **AND** 用户可以直接在输入框里回答它
