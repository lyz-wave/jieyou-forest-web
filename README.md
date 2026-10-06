# 解忧森林

一个 2.5D 剪纸风的治愈系 Web 应用：森林里的动物陪你释放情绪、换个角度想问题，再把成长沉淀进古树的年轮。

> 解忧森林不能替代专业心理咨询。

## 当前进度

第一阶段开发中：2.5D 纸雕场景、纸偶动物、入林引导、森林主场景、7 个小游戏（AI 部分使用模拟数据）。

## 环境要求

- Node.js 22+
- npm 10+

## 安装

```bash
npm install
npx playwright install chromium   # 只在需要跑 E2E 测试时
```

第一阶段不调用任何外部服务，**不需要 `.env`**。第二阶段接入 Claude API 后会补充配置说明。

## 运行

```bash
npm run dev
```

- 打开 <http://localhost:3000> 进入森林
- 打开 <http://localhost:3000/style-sample> 查看风格样板页（仅开发模式）

手机预览：手机和电脑连同一个 Wi-Fi，用 `npm run dev -- -H 0.0.0.0` 启动，然后在手机上访问 `http://<电脑的局域网 IP>:3000`。

## 测试

```bash
npm test            # 单元测试和组件测试
npm run test:e2e    # E2E 测试（会先执行生产构建）
npm run typecheck   # 类型检查
npm run lint        # 代码检查
```
