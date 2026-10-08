# 按产品文档逐节校对第一、二阶段（doc-alignment）

## Why

用户 2026-10-08 提出：感觉不少设计思路复用了本地另一个叫「解忧森林」的项目；要求**严格按产品文档 `解忧森林-prompt.md` 实现**，文档没有写的地方自己设计，不要复用那个项目。

于是先把「有没有读过那个项目」这件事查清楚（结论：没有），再拿产品文档逐节对照第一阶段与第二阶段的实现，把偏离文档的地方改回文档写法。

## Audit：我们到底碰没碰那个项目

- 那个项目在 `/Users/lang/Desktop/比赛/jieyou-forest`（Electron + Capacitor，remote 指向 github.com/lyz-wave/jieyou-forest.git，最近提交是「修复围炉动物不能动/形态失真/聚拢涣散/无纵深感四问题」与「实现 8 种思维动物全套矢量剪纸与围炉思辨场景 (CampfireCouncil)」）；另有一份改动包在 `/Users/lang/Downloads/解忧森林-动物围炉修复-改动文件`。
- 源码零读取：导入的 claude-code 历史（`~/.claude/projects/-Users-lang-Desktop-jieyou/f7c3c11b-*.jsonl`，turn 1–34）里 `CampfireCouncil` / `AnimalSprite` / `RingFacts` / `TrunkRingsDisc` / `VentingWorkshop` 出现 0 次；「灵狐 / 白鹿 / 刺猬 / 探索破局者 / 边界守护者」也是 0 次。DSH 会话里 `CampfireCouncil` 只出现过两次，来自 turn 36 我用 `gh api` 列它的提交标题挑仓库名。
- 两边的东西不一样：它是 8 只动物、每只一个剪影色块（`src/renderer/paper/AnimalSprite.tsx` 的 `ANIMAL_METAS`）；我们这边是产品文档第四节那张表里的 7 只，`lib/animals.ts` 用 PuppetPart + 关节点 + `roughPath()` / `seeded()` 程序化毛边，**两边的 path 数据没有一条相同**。
- 结论：偏离不是「抄错了」，是我自己按工程习惯把文档条款改写或省略了（下面七处）。

## What Changes

| 文档条款 | 原来的写法 | 改成 |
| --- | --- | --- |
| 第八节：每条用户消息先做风险检测，三级 none / concern / crisis | 本机词表命中才问服务端；等级叫 none / low / high | `RISK_LEVELS = ["none","concern","crisis"]`；`riskPrompt` 三档定义重写；`needsServerCheck(local) = local !== "crisis"`（**每句都问服务端**，只有本机已认出危险词才不外发） |
| 第八节 crisis：暂停游戏化、不圆桌、古树认真温和回应、求助卡 12356 / 400-161-9995 / 110 / 120（上线前核实）、确认安全后才能继续 | 三条出路 +「我还想说，继续吧」直接继续，且不写号码 | `CRISIS`（岁岁先说话 + 三步 + 求助卡 +「我现在是安全的」）与 `HOTLINES`；`RiskStage` 加求助卡与复选框，勾上才能继续；crisis 时**不发圆桌请求** |
| 第八节 concern：照常进行，古树在总结里温和提一句 | 没有这一档 | store 加 `concern` + `markConcern()`；`PromptContext.concern` 传给 `summaryPrompt`；`SummaryStage` 显示 `CONCERN_LINE` |
| 6.3.4 聆听动画：点头、竖耳朵、团团托腮 | 没做 | `lib/talk/gesture.ts` 的 `LISTEN_GESTURE`（松鼠竖耳朵、团团托腮、其余点头）+ `lib/puppet/gesture.ts` 的关键帧 |
| 6.3.6 其他动物反应动画：点头、思考、笑 | 没做 | `REACTIONS` + `reactionPlan(cast, speaker, round)`；`ForestAnimals` 给每只算 `gestureFor(phase, id, reactions)` |
| 6.3.6 按钮名「全部显示」 | 我写成「一起说完吧」 | 改名（组件、单测、E2E、README、HANDOFF） |
| 6.3.8 点动物头像指定回答人 | 只支持 `@名字` | `FollowUpStage` 加 8 个纸偶头像（`aria-pressed`、热区 ≥44px）；写了 `@名字` 时以文字为准（`mentionsTarget()` + `ask(question, chosen)`） |

## Capabilities

### Modified Capabilities

- `risk-guard`：三级判定改名并接通服务端逐句检测；crisis 处置按第八节补齐（古树回应、求助卡、确认安全）；concern 落进总结。
- `talk-session` / `roundtable`：聆听与反应动作、按钮名、点头像点名。

## Impact

- 代码：`lib/ai/schema.ts`、`lib/prompts.ts`、`lib/talk/{flow,guard}.ts`、`lib/stores/talk.ts`、`lib/talk/gesture.ts`(新)、`lib/puppet/gesture.ts`(新)、`components/puppet/PaperPuppet.tsx`、`components/forest/{ForestAnimals,ForestAnimal}.tsx`、`components/talk/{RiskStage,SummaryStage,RoundtableStage,FollowUpStage,useTalkFlow}.tsx`。
- 测试：`npm test` 74 文件 523 用例全过；`npm run typecheck`、`npm run lint` 零报错；生产 E2E 50 个全过（含两条新的守护页用例）；截图 `docs/talk/{mobile,desktop}-talk-guard.png`。
- 文档：README 风险守护与圆桌两条重写、HANDOFF §9.10、`stage2-roundtable/tasks.md` 的 1.4 / 4.2 / 4.3 / 4.4。

## 还没做（等用户拍板）

- 6.3.3 的可选语音输入（Web Speech API）。
- 第 5 步「不知道找谁？帮我看看」引导选伙伴是产品文档之外加的一步，去留由用户定。

