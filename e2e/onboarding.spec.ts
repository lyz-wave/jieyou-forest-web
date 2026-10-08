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
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible();
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

test("走「帮我看看」入林，推荐的那只成为今天的伙伴，selfPicks 记下是引导来的", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "走进森林" }).click();
  await page.getByRole("button", { name: "你好，岁岁" }).click();
  await page.getByRole("textbox", { name: "你的昵称" }).fill("小满");
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await page.getByRole("button", { name: "我知道了" }).click();

  await page.getByRole("button", { name: "不知道找谁？帮我看看" }).click();
  await expect(page.getByText("第 1 / 3 问")).toBeVisible();
  // 一句话都没选时走不到下一问
  await expect(page.getByRole("button", { name: "下一问" })).toBeDisabled();
  await page.getByRole("button", { name: "看清那件事是真的，还是我想的" }).click();
  await page.getByRole("button", { name: "下一问" }).click();
  await page.getByRole("button", { name: "说不好，先看看" }).click();
  await page.getByRole("button", { name: "下一问" }).click();
  await page.getByRole("button", { name: "不用，先看眼前" }).click();
  await page.getByRole("button", { name: "看看推荐" }).click();

  await expect(page.getByText(/墨墨的办法是/)).toBeVisible();
  await expect(page.getByText("看的是你此刻的需要，不代表你是什么样的人。")).toBeVisible();
  await page.screenshot({ path: `docs/onboarding/${test.info().project.name}-guided.png` });

  await page.getByRole("button", { name: "就是它" }).click();
  await expect(page.getByRole("radio", { name: /墨墨/ })).toBeChecked();
  await page.getByRole("button", { name: "一起入林" }).click();
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible();
  await expect(page.getByText("今天的伙伴 · 墨墨")).toBeVisible();

  const picks = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("jieyou");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const row = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
      const store = db.transaction("profile", "readonly").objectStore("profile").get("me");
      store.onsuccess = () => resolve(store.result as Record<string, unknown> | undefined);
      store.onerror = () => reject(store.error);
    });
    db.close();
    return row?.selfPicks;
  });
  expect(picks).toEqual([{ at: expect.any(Number), want: ["see-clearly"], animalId: "owl", source: "guided" }]);

  await page.reload();
  await expect(page.getByText("今天的伙伴 · 墨墨")).toBeVisible();
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
