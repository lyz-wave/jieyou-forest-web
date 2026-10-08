## 1. 选题与规格

- [x] 1.1 与用户确认方向：不做性格测试 / MBTI / 星座，改成问「此刻想被怎么对待」（2026-10-08 用户拍板「就按你说的做」）
- [x] 1.2 写本变更的 proposal、companion-choice 规格与 onboarding 规格修改

## 2. 纯逻辑（TDD）

- [x] 2.1 `lib/onboarding/selfpick.ts`：三道题与选项（第 1 题多选，最多两项）、`recommend(answers)` 返回恰好一只动物；测试：同答案同结果、七只动物都可达、两个都想时两票都算、没答完不给推荐
- [x] 2.2 推荐文案 `recommendLine(answers, animal)`：一句「为什么是它」，只用当时的答案措辞；测试：不含「性格 / 类型 / 人格」这类词，含被选中的陪伴方式

## 3. 界面

- [x] 3.1 第 5 步加「不知道找谁？帮我看看」入口与三道题的界面（可用键盘完成，热区 ≥44px）
- [x] 3.2 推荐卡：一只动物 + 一句为什么 + 「就是它」/「还是想自己挑」
- [x] 3.3 组件测试：不用引导时与第一阶段一致；走引导接受推荐后伙伴是推荐的那只；点「还是想自己挑」回到卡片且不留 guided 记录

## 4. 数据

- [x] 4.1 `lib/db/profile.ts` 的 `Profile` 增加 `selfPicks: SelfPick[]`（默认空数组），读写往返测试；Dexie 不升版本
- [x] 4.2 入林完成时写入一条记录（self 或 guided）

## 5. 验收

- [x] 5.1 E2E：走一遍「帮我看看」并接受推荐，断言伙伴与 `selfPicks`（两个视口）
- [x] 5.2 `npm test`、`npm run typecheck`、`npm run lint` 全绿；更新 README 与 HANDOFF
