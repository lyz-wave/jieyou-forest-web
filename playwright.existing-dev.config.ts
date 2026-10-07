import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/**
 * 复用已经在跑的 next dev（Next 16 同一目录只允许一个 next dev，
 * 用户开着预览时 npm run test:e2e 会起不来）。默认指向 3200，可用 DEV_URL 覆盖。
 *
 * 所有项目都指向这台 dev server，但生产特有的断言（比如样板页要 404）不能在这里跑：
 * dev 下 /style-sample 是 200。跑的时候用文件路径或 --grep 过滤掉那些用例。
 */
const DEV_URL = process.env.DEV_URL ?? "http://localhost:3200";

export default defineConfig({
  ...config,
  // 打上标记：这里的 baseURL 是开发服务器，只该跑开发环境也成立的用例
  metadata: { devServer: true },
  // dev 第一次编译比较慢，给足时间
  timeout: 90_000,
  projects: config.projects?.map((p) => ({ ...p, use: { ...p.use, baseURL: DEV_URL } })),
  webServer: [],
});
