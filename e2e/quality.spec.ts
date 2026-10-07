import { expect, test } from "@playwright/test";
import { finishOnboarding } from "./helpers";

/** 11.2 的三条画面底线：字体分片 < 30、做动画的元素不带 filter、减弱动画真的减 */
test.describe("画面底线", () => {
  test("字体按分片加载，入林之后首屏也少于 30 个分片", async ({ page }) => {
    const fonts: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() === "font") fonts.push(req.url());
    });
    await page.goto("/");
    await finishOnboarding(page);
    await page.waitForLoadState("networkidle");
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.length).toBeLessThan(30);
  });

  test("森林里做动画的元素都不带 filter", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);
    const withFilter = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "[data-testid=paper-world], [data-puppet-body], [data-particle], [data-part], [data-layer]",
        ),
      ]
        .map((el) => getComputedStyle(el).filter)
        .filter((f) => f !== "none"),
    );
    expect(withFilter).toEqual([]);
  });
});

test.describe("减弱动画", () => {
  test.use({ reducedMotion: "reduce" });

  test("入林之后没有视差、没有粒子、相机不漂移、动物不迈步", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);
    await expect(page.getByTestId("paper-scene")).toHaveAttribute("data-parallax", "none");
    await expect(page.getByTestId("particles")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "开启体感" })).toHaveCount(0);
    // 相机不再自动漂移：隔一会儿再量，世界层的 transform 必须一模一样
    const world = () => page.getByTestId("paper-world").evaluate((el) => getComputedStyle(el).transform);
    const before = await world();
    await page.waitForTimeout(400);
    expect(await world()).toBe(before);
    // 步态动画关闭，只保留眨眼
    const running = await page
      .locator("[data-part] > g")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName).filter((n) => n !== "none"));
    expect(running.filter((n) => !n.includes("blink"))).toEqual([]);
  });
});
