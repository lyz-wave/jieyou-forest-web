import { expect, test, type Page } from "@playwright/test";

/** 森林生活：走动、聚拢倾听（只在开发服务器的样板页上跑） */

async function open(page: Page, time = "day") {
  await page.goto(`/style-sample?time=${time}`);
  await expect(page.getByTestId("paper-scene")).toHaveAttribute("data-time", time);
  await expect(page.getByRole("button", { name: /阿橘/ })).toBeVisible();
}

const fox = (page: Page) => page.getByRole("button", { name: /阿橘/ });
const foxBox = (page: Page) =>
  page.getByTestId("animal-fox").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, bottom: r.bottom, width: r.width };
  });

/** 阿橘在 3D 世界里的横向位置（px），取自它自己的 transform，和镜头无关 */
const foxWorldX = (page: Page) =>
  page.getByTestId("animal-fox").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

test.describe("走动", () => {
  // 把页面时钟加速 25 倍，12–30 秒一次的走动在 2 秒内就会发生
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const real = performance.now.bind(performance);
      const start = real();
      performance.now = () => start + (real() - start) * 25;
    });
  });

  test("动物会自己走动：同一时间只有一只在动，朝着前进方向，停下后回到待机", async ({ page }) => {
    await open(page);
    type Sample = { id: string; pose: string; facing: string; x: number };
    const read = () =>
      page.locator("[data-testid^=animal-]").evaluateAll((els) =>
        els.map((el) => {
          const btn = el.querySelector("button");
          const r = el.getBoundingClientRect();
          return {
            id: el.getAttribute("data-testid") ?? "",
            pose: btn?.getAttribute("data-pose") ?? "",
            facing: btn?.getAttribute("data-facing") ?? "",
            x: r.x + r.width / 2,
          };
        }),
      );
    const frames: Sample[][] = [];
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(150);
      frames.push(await read());
    }
    // 至少有一只动物动过
    const moving = (f: Sample[]) => f.filter((s) => s.pose !== "idle");
    expect(frames.some((f) => moving(f).length > 0)).toBe(true);
    // 任意时刻最多一只在动
    for (const f of frames) expect(moving(f).length).toBeLessThanOrEqual(1);
    // 在地上走的动物：朝向和横向移动方向一致
    for (let i = 1; i < frames.length; i++) {
      for (const s of frames[i]) {
        if (s.pose !== "walk" && s.pose !== "run") continue;
        const prev = frames[i - 1].find((p) => p.id === s.id);
        const dx = prev ? s.x - prev.x : 0;
        if (Math.abs(dx) > 2) expect(s.facing, s.id).toBe(dx > 0 ? "right" : "left");
      }
    }
    // 最后都停下来
    await expect.poll(async () => moving(await read()).length, { timeout: 15_000 }).toBe(0);
  });
});

test("白天聚拢：大家走到空地坐好，空地上有阳光；散开后回到原处", async ({ page }) => {
  await open(page, "day");
  const homeWorldX = await foxWorldX(page);
  await page.getByRole("button", { name: "开始倾诉" }).click();
  await expect(page.getByRole("button", { name: "开始倾诉" })).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("大家都在听啦", { timeout: 8000 });
  await expect(page.locator('[data-kind="sunlight"]')).toBeAttached();
  await expect(page.locator('[data-kind="campfire"]')).toHaveCount(0);
  // 坐下后面朝空地中心
  const seat = await foxBox(page);
  const spot = await page.getByTestId("gathering-spot").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.x + r.width / 2;
  });
  expect(await fox(page).getAttribute("data-facing")).toBe(seat.x < spot ? "right" : "left");
  expect(await fox(page).getAttribute("data-pose")).toBe("idle");

  await page.getByRole("button", { name: "让大家散开" }).click();
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible({ timeout: 8000 });
  await expect(page.locator("[data-kind]")).toHaveCount(0);
  // 回到原处：比较的是阿橘在 3D 世界里的位置（transform），不受镜头拉回和视差漂移影响。
  // 散开后平时的走动会恢复，阿橘可能又在自己领地里挪了一步，所以只要求回到领地附近
  await expect.poll(async () => Math.abs((await foxWorldX(page)) - homeWorldX), { timeout: 4000 }).toBeLessThan(40);
});

test("夜晚聚拢：空地中央是篝火", async ({ page }) => {
  await open(page, "night");
  await page.getByRole("button", { name: "开始倾诉" }).click();
  await expect(page.getByRole("status")).toContainText("大家都在听啦", { timeout: 8000 });
  await expect(page.locator('[data-kind="campfire"]')).toBeAttached();
  await expect(page.locator('[data-kind="sunlight"]')).toHaveCount(0);
});

test("散开后回到原来的大小（大小只由远近决定）", async ({ page }) => {
  await open(page);
  const home = await foxBox(page);
  await page.getByRole("button", { name: "开始倾诉" }).click();
  await expect(page.getByRole("status")).toContainText("大家都在听啦", { timeout: 8000 });
  await page.getByRole("button", { name: "让大家散开" }).click();
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible({ timeout: 8000 });
  await expect.poll(async () => Math.abs((await foxBox(page)).width - home.width), { timeout: 4000 }).toBeLessThan(2);
});

test.describe("减弱动画", () => {
  test.use({ reducedMotion: "reduce" });

  test("聚拢时不走过去，直接出现在座位上", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "开始倾诉" }).click();
    // 立刻到位：没有行走姿态
    await expect(page.getByRole("status")).toContainText("大家都在听啦", { timeout: 2000 });
    expect(await fox(page).getAttribute("data-pose")).toBe("idle");
  });
});
