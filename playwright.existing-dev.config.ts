import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/**
 * 复用已经在跑的 next dev（Next 16 同一目录只允许一个 next dev，
 * 用户开着预览时 npm run test:e2e 会起不来）。默认指向 3200，可用 DEV_URL 覆盖。
 */
const DEV_URL = process.env.DEV_URL ?? "http://localhost:3200";

export default defineConfig({
  ...config,
  projects: config.projects
    ?.filter((p) => (p.name ?? "").startsWith("dev-"))
    .map((p) => ({ ...p, use: { ...p.use, baseURL: DEV_URL } })),
  webServer: [],
});
