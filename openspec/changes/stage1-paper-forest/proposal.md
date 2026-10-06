## Why

「解忧森林」从零开始，第一阶段要先把最没把握的部分做出来并验证：2.5D 剪纸画风能不能做好看、手机上能不能跑流畅。画风确认后，再搭出用户能玩的森林：入林引导、7 只纸偶动物、7 个释放情绪的小游戏。倾诉、年轮等后续功能都建立在这套场景和纸偶上。

## What Changes

- 搭建 Next.js 项目骨架（TypeScript strict、Tailwind、Vitest、Playwright），写好项目级 CLAUDE.md 和 README
- 新增 2.5D 纸雕场景引擎：CSS 3D 分层、视差（鼠标 / 陀螺仪 / 自动漂移）、随真实时间变化的光影、纸张纹理、纸片粒子、减弱动画与自动降画质
- 新增纸偶系统：动物由部件 + 关节点组成，带定格感的待机动画和点击反馈
- 新增风格样板页（`/style-sample`，仅开发模式）：一组完整纸层场景 + 阿橘纸偶。**样板页完成后暂停，等画风确认再继续**
- 新增入林引导：晨雾转场、古树欢迎、昵称、说明卡片、选择伙伴动物，数据存本地 IndexedDB
- 新增森林主场景：7 只动物 + 古树、角色卡（立体书式弹出）、「我的年轮」入口（本阶段只提示"即将开放"）
- 新增森林生活（用户确认画风时追加）：每只动物待在符合习性的位置，偶尔按自己的方式走动；跳跃、飞行遵循重力；点「开始倾诉」时大家聚到空地坐成半圆，白天坐在阳光里，夜晚围着篝火。倾诉对话本身仍在第二阶段
- 新增 7 个小游戏，产出的 gameContext 暂存在本次浏览中；需要 AI 的 3 个游戏通过 mock 实现，接口与第二阶段的真实 AI 一致

## Capabilities

### New Capabilities
- `paper-scene`: 2.5D 纸雕场景——分层与景深、视差输入、时间光影与投影、纸张纹理、粒子、无障碍与性能降级、风格样板页
- `paper-puppet`: 纸偶动物——部件与关节结构、待机动画、点击反馈、按深度定位
- `onboarding`: 首次入林引导与本地用户资料（昵称、伙伴动物）
- `forest-home`: 森林主场景——动物布局、角色卡、入口按钮、场景与浮层之间的转场
- `forest-life`: 森林生活——各安其所、偶尔走动、遵循重力的跳跃飞行、聚拢倾听（白天阳光 / 夜晚篝火）
- `mini-games`: 7 个小游戏、gameContext 产出、AI 接口的 mock 实现与失败降级

### Modified Capabilities
（无，这是第一个变更）

## Impact

- 新建整个代码库：`app/`、`components/`、`lib/`、`e2e/`
- 新依赖：next、react、tailwindcss、motion、zustand、dexie、lxgw-wenkai-screen-webfont（霞鹜文楷屏幕阅读版，按 unicode-range 分片）；开发依赖：vitest、@testing-library/react、jsdom、fake-indexeddb、@playwright/test
- 本阶段不调用任何外部服务，不需要 API Key
