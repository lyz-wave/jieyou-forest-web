import { expect, test, type Page } from "@playwright/test";
import { finishOnboarding } from "./helpers";

const debugToggle = (page: Page) => page.getByRole("button", { name: /gameContext/ });

test.describe("开发工具", () => {
  test("生产构建里不带 ?dev=1 就不出现调试抽屉", async ({ page }) => {
    // 开发服务器上调试抽屉一直显示（NODE_ENV=development），这条只对着生产构建跑
    const viaDevServer =
      test.info().project.name.startsWith("dev") || test.info().config.metadata.devServer === true;
    test.skip(viaDevServer, "开发服务器上调试抽屉一直显示");
    await page.goto("/");
    await finishOnboarding(page);
    await expect(debugToggle(page)).toHaveCount(0);
  });

  test("调试抽屉能看 gameContext，也能打开「模拟 AI 失败」", async ({ page }) => {
    await page.goto("/?dev=1");
    await finishOnboarding(page);

    const toggle = debugToggle(page);
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByText("还没有记录")).toBeVisible();
    const failure = page.getByRole("checkbox", { name: "模拟 AI 失败" });
    await expect(failure).not.toBeChecked();
    await failure.click();
    await expect(failure).toBeChecked();

    await page.screenshot({ path: `docs/forest/${test.info().project.name}-devtools.png` });
  });
});
