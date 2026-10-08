import { expect, type Page } from "@playwright/test";

export interface OnboardingOptions {
  /** 选好伙伴、还没入林时的截图路径 */
  screenshot?: string;
  /** 选好伙伴、还没入林时的额外检查（比如标题和「一起入林」都在视口内） */
  atCompanionStep?: (page: Page) => Promise<void>;
}

/**
 * 走完五步入林引导，停在森林主场景（「开始倾诉」可见）。
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
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible();
}

/** 屏幕上的一个矩形（视口坐标） */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 量某个角色此刻的可点区域：纸偶按钮 ∪ 为小纸偶补出来的那圈透明热区 */
export async function hotspotBox(page: Page, testId: string): Promise<Box> {
  const box = await page.evaluate((id) => {
    const host = document.querySelector(`[data-testid="${id}"]`);
    const button = host?.querySelector("button");
    if (!button) return null;
    const b = button.getBoundingClientRect();
    let left = b.left;
    let top = b.top;
    let right = b.right;
    let bottom = b.bottom;
    const cover = button.querySelector("[data-tap-cover]");
    if (cover) {
      const c = cover.getBoundingClientRect();
      left = Math.min(left, c.left);
      top = Math.min(top, c.top);
      right = Math.max(right, c.right);
      bottom = Math.max(bottom, c.bottom);
    }
    return { x: left, y: top, width: right - left, height: bottom - top };
  }, testId);
  if (!box) throw new Error(`量不到 ${testId} 的热区`);
  return box;
}

/**
 * 点森林里的某个角色：先量出它此刻热区的中心，再直接点那个坐标。
 * 森林一直在动（相机漂移 + 动物走动），Playwright 等不到「元素静止」，只能自己量。
 */
/**
 * 等镜头停稳。镜头推进/缩回的那半秒里，热区的位置一直在变：
 * 量的时候还在原处，点下去那一刻已经挪开了（森林里这两处「点不开卡片」的偶发都是这么来的）。
 * 最多等 1.5 秒就放行 —— 手机上的漂移（李萨如曲线）本来就不会完全静止。
 */
export async function settleCamera(page: Page): Promise<void> {
  const shift = (): Promise<number[]> =>
    page.getByTestId("paper-world").evaluate((el) => {
      const t = getComputedStyle(el).transform;
      if (t === "none") return [0, 0, 0];
      const m = new DOMMatrix(t);
      return [m.m41, m.m42, m.m43];
    });
  let last = await shift();
  for (let i = 0; i < 15; i += 1) {
    await page.waitForTimeout(100);
    const now = await shift();
    if (Math.abs(now[0] - last[0]) < 0.5 && Math.abs(now[1] - last[1]) < 0.5 && Math.abs(now[2] - last[2]) < 0.5) return;
    last = now;
  }
}

export async function tapActor(page: Page, testId: string): Promise<void> {
  await settleCamera(page);
  const box = await hotspotBox(page, testId);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
