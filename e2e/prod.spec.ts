import { expect, test } from "@playwright/test";

test("生产环境访问风格样板页返回 404", async ({ page }) => {
  const res = await page.goto("/style-sample");
  expect(res?.status()).toBe(404);
});

test("字体按分片加载，首屏少于 30 个分片", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "font") fonts.push(req.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.length).toBeLessThan(30);
});
