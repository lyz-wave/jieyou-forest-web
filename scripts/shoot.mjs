// 开发自检用：截图样板页。用法：node scripts/shoot.mjs <url> <输出目录> [时段...]
// 浏览器装在 node_modules 里（系统缓存会被定期清理）
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "0";
const { chromium } = await import("@playwright/test");
import { mkdirSync } from "node:fs";

const [, , url = "http://localhost:3200/style-sample", out = "shots", ...times] = process.argv;
mkdirSync(out, { recursive: true });

const viewports = [
  { name: "mobile", width: 375, height: 667, isMobile: true, hasTouch: true },
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`[${vp.name}] console error:`, m.text());
  });
  page.on("pageerror", (e) => console.log(`[${vp.name}] page error:`, e.message));
  for (const t of times.length ? times : ["day"]) {
    await page.goto(`${url}${url.includes("?") ? "&" : "?"}time=${t}`);
    await page.waitForSelector("[data-testid=paper-scene]");
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${out}/${vp.name}-${t}.png` });
    console.log(`saved ${out}/${vp.name}-${t}.png`);
  }
  await ctx.close();
}
await browser.close();
