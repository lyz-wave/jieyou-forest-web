import { expect, test, type Page } from "@playwright/test";
import { finishOnboarding as enterForest } from "./helpers";

const finishOnboarding = (page: Page): Promise<void> =>
  enterForest(page, {
    screenshot: `docs/onboarding/${test.info().project.name}-companion.png`,
    atCompanionStep: async (at) => {
      await expect(at.getByRole("heading", { name: "今天想先找谁玩？" })).toBeInViewport();
      await expect(at.getByRole("button", { name: "一起入林" })).toBeInViewport();
    },
  });

test("首次入林最后才保存，刷新后直接回到森林", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "走进森林" }).click();
  await page.getByRole("button", { name: "你好，岁岁" }).click();
  await page.getByRole("textbox", { name: "你的昵称" }).fill("小满");
  await page.reload();
  await expect(page.getByRole("button", { name: "走进森林" })).toBeVisible();
  await page.screenshot({ path: `docs/onboarding/${test.info().project.name}-entrance.png` });
  await finishOnboarding(page);
  await page.screenshot({ path: `docs/onboarding/${test.info().project.name}-forest.png` });
  await expect(page.getByText("小满，欢迎回到森林")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "🍃 开始倾诉" })).toBeVisible();
  await expect(page.getByRole("button", { name: "走进森林" })).toHaveCount(0);
  await expect(page.getByText("今天的伙伴 · 阿橘")).toBeVisible();
  expect(errors).toEqual([]);
});

test("IndexedDB 打开失败也能完成入林，关闭后不承诺记住资料", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("森林这次记不住你，关掉页面后需要重新认识哦");
  await finishOnboarding(page);
  await expect(page.getByRole("status")).toHaveText("森林这次记不住你，关掉页面后需要重新认识哦");
  await page.reload();
  await expect(page.getByRole("button", { name: "走进森林" })).toBeVisible();
});

test.describe("减弱动画入林", () => {
  test.use({ reducedMotion: "reduce" });
  test("晨雾仅淡出，没有镜头推进", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("onboarding-mist")).toHaveAttribute("data-motion", "fade");
    await finishOnboarding(page);
    await expect.poll(() => page.getByTestId("paper-world").evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).isIdentity)).toBe(true);
    await expect(page.getByTestId("particles")).toHaveCount(0);
  });
});
