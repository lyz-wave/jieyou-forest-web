import { expect, type Page } from "@playwright/test";

export interface OnboardingOptions {
  /** 选好伙伴、还没入林时的截图路径 */
  screenshot?: string;
  /** 选好伙伴、还没入林时的额外检查（比如标题和「一起入林」都在视口内） */
  atCompanionStep?: (page: Page) => Promise<void>;
}

/**
 * 走完五步入林引导，停在森林主场景（「🍃 开始倾诉」可见）。
 * 每个视口下首次入林都要走一遍，所以抽出来共用。
 */
export async function finishOnboarding(page: Page, options: OnboardingOptions = {}): Promise<void> {
  await page.getByRole("button", { name: "走进森林" }).click();
  await page.getByRole("button", { name: "你好，岁岁" }).click();
  await page.getByRole("textbox", { name: "你的昵称" }).fill("小满");
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await page.getByRole("button", { name: "我知道了" }).click();
  await page.getByRole("radio", { name: /阿橘/ }).check();
  await options.atCompanionStep?.(page);
  if (options.screenshot) await page.screenshot({ path: options.screenshot });
  await page.getByRole("button", { name: "一起入林" }).click();
  await expect(page.getByRole("button", { name: "🍃 开始倾诉" })).toBeVisible();
}
