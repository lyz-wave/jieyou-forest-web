import { defineConfig, devices } from "@playwright/test";

/**
 * 两套服务器：
 * - prod（3100）：生产构建，跑主流程和「样板页 404」检查
 * - dev（3101）：开发服务器，只跑风格样板页（生产环境不可访问）
 */
const PROD = 3100;
const DEV = 3101;

const mobile = { ...devices["iPhone SE"], browserName: "chromium" as const, viewport: { width: 375, height: 667 } };
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
/** iPhone 上所有浏览器都是 WebKit 内核；3D 命中测试和 Chromium 不同，必须单独测 */
const iphone = { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // 开发服务器上的测试全是动画（走动、聚拢），多个浏览器同时跑会互相拖慢、导致超时；
  // 这里限制并发，换取稳定
  workers: 2,
  retries: 0,
  reporter: "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "mobile", testIgnore: /\.dev\.spec\.ts$/, use: { ...mobile, baseURL: `http://localhost:${PROD}` } },
    { name: "desktop", testIgnore: /\.dev\.spec\.ts$/, use: { ...desktop, baseURL: `http://localhost:${PROD}` } },
    { name: "dev-mobile", testMatch: /\.dev\.spec\.ts$/, use: { ...mobile, baseURL: `http://localhost:${DEV}` } },
    { name: "dev-desktop", testMatch: /\.dev\.spec\.ts$/, use: { ...desktop, baseURL: `http://localhost:${DEV}` } },
    {
      // headless WebKit 渲染重场景时会间歇停帧，动画时序类测试不稳定；这里只验证命中测试
      name: "dev-iphone",
      testMatch: /\.dev\.spec\.ts$/,
      grep: /命中/,
      use: { ...iphone, baseURL: `http://localhost:${DEV}` },
    },
  ],
  webServer: [
    {
      command: `npm run build && npm run start -- -p ${PROD}`,
      url: `http://localhost:${PROD}`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
    {
      // next dev 使用 .next/dev，和生产构建互不影响
      command: `npx next dev -p ${DEV}`,
      url: `http://localhost:${DEV}/style-sample`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
