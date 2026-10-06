import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/** 仅运行产品页：不额外启动可能与手工预览冲突的开发服务器。 */
export default defineConfig({
  ...config,
  projects: config.projects?.filter((project) => project.name === "mobile" || project.name === "desktop"),
  webServer: Array.isArray(config.webServer) ? config.webServer.slice(0, 1) : config.webServer,
});
