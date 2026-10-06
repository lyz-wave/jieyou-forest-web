import { expect, test, type Page } from "@playwright/test";

/** 风格样板页（只在开发服务器上跑） */

/**
 * 按阿橘的实际屏幕位置点击（手机上场景一直在漂移，用 locator.click 会一直等「稳定」）。
 * 用坐标点击才能发现被 3D 容器遮挡的问题。
 */
async function clickFox(page: Page) {
  const box = await page.getByRole("button", { name: /阿橘/ }).boundingBox();
  if (!box) throw new Error("找不到阿橘");
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.7;
  const hasTouch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** 阿橘身上的元素（页面上有 7 只动物，选择器都要限定在阿橘里） */
const inFox = (page: Page, selector: string) => page.getByTestId("animal-fox").locator(selector);

async function open(page: Page, time = "day") {
  await page.goto(`/style-sample?time=${time}`);
  await expect(page.getByTestId("paper-scene")).toHaveAttribute("data-time", time);
  await expect(page.getByRole("button", { name: /阿橘/ })).toBeVisible();
}

test("渲染 6 个纸层、纸张纹理和阿橘", async ({ page }) => {
  await open(page);
  // 远树层在低画质下会隐藏；样板页默认高画质
  await expect(page.locator("[data-layer]")).toHaveCount(6);
  await expect(page.getByTestId("paper-texture")).toHaveCSS("pointer-events", "none");
  await expect(page.getByTestId("paper-texture")).toHaveCSS("mix-blend-mode", "multiply");
});

test("点击阿橘的位置，命中的就是阿橘（纹理层和 3D 容器都不拦截）", async ({ page }) => {
  await open(page);
  const box = await page.getByRole("button", { name: /阿橘/ }).boundingBox();
  if (!box) throw new Error("找不到阿橘");
  // 阿橘身体（胸口和脸）所在的位置
  for (const [fx, fy] of [
    [0.5, 0.65],
    [0.5, 0.4],
  ]) {
    const hit = await page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest("button")?.getAttribute("aria-label") ?? `${el?.tagName}.${el?.className}`;
    }, [box.x + box.width * fx, box.y + box.height * fy]);
    expect(hit).toMatch(/^阿橘/);
  }
});

test("待机动画是 steps() 定格节奏，约每秒 12 步", async ({ page }) => {
  await open(page);
  const timings = await page.locator("[data-part] > g").evaluateAll((els) =>
    els
      .map((el) => {
        const s = getComputedStyle(el);
        return { timing: s.animationTimingFunction, dur: parseFloat(s.animationDuration) };
      })
      .filter((t) => t.timing.startsWith("steps(")),
  );
  expect(timings.length).toBeGreaterThanOrEqual(3);
  for (const { timing, dur } of timings) {
    const steps = Number(/steps\((\d+)/.exec(timing)?.[1]);
    expect(steps / dur).toBeGreaterThanOrEqual(10);
    expect(steps / dur).toBeLessThanOrEqual(14);
  }
});

test("点击阿橘：轻跳并甩尾，600ms 内回到原位", async ({ page }) => {
  await open(page);
  const body = inFox(page, "[data-puppet-body]");
  const tail = inFox(page, '[data-part="tail"]').first();
  await clickFox(page);
  // 触摸事件比鼠标晚一拍，轮询而不是固定时间点采样
  await expect.poll(() => body.evaluate((el) => getComputedStyle(el).transform), { timeout: 400, intervals: [30] }).not.toBe("none");
  await expect.poll(() => tail.evaluate((el) => getComputedStyle(el).transform), { timeout: 400, intervals: [30] }).not.toBe("none");
  // 结束后位移和缩放都回到原样（Motion 可能留下单位矩阵，而不是 none）
  await expect
    .poll(
      () =>
        body.evaluate((el) => {
          const m = new DOMMatrix(getComputedStyle(el).transform);
          return Math.abs(m.f) < 0.5 && Math.abs(m.d - 1) < 0.01;
        }),
      { timeout: 1500 },
    )
    .toBe(true);
});

test("键盘回车与点击效果相同", async ({ page, browserName }) => {
  // Safari 默认不让 button 获得键盘焦点（需要用户在系统里开启「按 Tab 键高亮各项」），这里只在 Chromium 上验证
  test.skip(browserName === "webkit", "WebKit 的键盘焦点行为取决于系统设置");
  await open(page);
  const fox = page.getByRole("button", { name: /阿橘/ });
  await fox.focus();
  await page.keyboard.press("Enter");
  // 和点击测试一样轮询：机器忙时动画的第一帧可能晚一点
  await expect
    .poll(() => inFox(page, "[data-puppet-body]").evaluate((el) => getComputedStyle(el).transform), { timeout: 400, intervals: [30] })
    .not.toBe("none");
});

test("做 transform 动画的元素都不带 filter", async ({ page }) => {
  await open(page);
  await clickFox(page);
  const withFilter = await page.evaluate(() =>
    [...document.querySelectorAll("[data-testid=paper-world], [data-puppet-body], [data-particle], [data-part], [data-layer]")]
      .map((el) => getComputedStyle(el).filter)
      .filter((f) => f !== "none"),
  );
  expect(withFilter).toEqual([]);
});

test("四个时段：阴影方向随光源变化，夜晚有萤火虫", async ({ page }) => {
  /** 阿橘剪影阴影的横向偏移：清晨投向右（正），黄昏投向左（负），白天几乎为 0 */
  const shadowDx = async () =>
    page
      .getByTestId("animal-fox")
      .locator("[data-puppet-body] > div > svg")
      .first()
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  await open(page, "dawn");
  expect(await shadowDx()).toBeGreaterThan(0.5);
  await open(page, "day");
  expect(Math.abs(await shadowDx())).toBeLessThan(0.01);
  await open(page, "dusk");
  expect(await shadowDx()).toBeLessThan(-0.5);
  await open(page, "night");
  await expect(page.locator('[data-particle="firefly"]').first()).toBeAttached();
  await open(page, "day");
  await expect(page.locator('[data-particle="firefly"]')).toHaveCount(0);
});

test("调试面板可以切换画质，低画质隐藏远树层", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "调试" }).click();
  await page.getByRole("button", { name: "低", exact: true }).click();
  await expect(page.getByTestId("paper-scene")).toHaveAttribute("data-quality", "low");
  await expect(page.locator("[data-layer]")).toHaveCount(5);
  await expect(page.locator('[data-layer="farTrees"]')).toHaveCount(0);
});

test.describe("减弱动画", () => {
  test.use({ reducedMotion: "reduce" });

  test("没有视差、没有粒子，点击只高亮不跳动", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("paper-scene")).toHaveAttribute("data-parallax", "none");
    await expect(page.getByTestId("particles")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "🍃 开启体感" })).toHaveCount(0);
    // 呼吸和摆动关闭，只保留眨眼
    const running = await page.locator("[data-part] > g").evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).animationName).filter((n) => n !== "none"),
    );
    expect(running.every((n) => n.includes("blink"))).toBe(true);
    await clickFox(page);
    await page.waitForTimeout(120);
    const t = await inFox(page, "[data-puppet-body]").evaluate((el) => getComputedStyle(el).transform);
    expect(t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
  });
});

test.describe("视差", () => {
  test.skip(({ isMobile }) => isMobile, "只在有鼠标的桌面端跑");

  test("鼠标移到最边上时，任何纸层都不露边", async ({ page }) => {
    await open(page);
    const vp = page.viewportSize();
    if (!vp) throw new Error("没有视口");
    for (const [x, y] of [
      [0, 0],
      [vp.width - 1, vp.height - 1],
      [0, vp.height - 1],
      [vp.width - 1, 0],
    ]) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(900);
      const rects = await page.locator("[data-layer]").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { id: el.getAttribute("data-layer"), left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        }),
      );
      for (const r of rects) {
        expect(r.left, `${r.id} 左边露出`).toBeLessThanOrEqual(0.5);
        expect(r.top, `${r.id} 上边露出`).toBeLessThanOrEqual(0.5);
        expect(r.right, `${r.id} 右边露出`).toBeGreaterThanOrEqual(vp.width - 0.5);
        expect(r.bottom, `${r.id} 下边露出`).toBeGreaterThanOrEqual(vp.height - 0.5);
      }
    }
  });

  test("近处纸层的视差位移大于远处", async ({ page }) => {
    await open(page);
    const vp = page.viewportSize();
    if (!vp) throw new Error("没有视口");
    const leftOf = (id: string) =>
      page.locator(`[data-layer="${id}"]`).evaluate((el) => el.getBoundingClientRect().left);
    await page.mouse.move(vp.width / 2, vp.height / 2);
    await page.waitForTimeout(900);
    const [fore0, sky0] = [await leftOf("fore"), await leftOf("sky")];
    await page.mouse.move(0, vp.height / 2);
    await page.waitForTimeout(900);
    const [fore1, sky1] = [await leftOf("fore"), await leftOf("sky")];
    expect(Math.abs(fore1 - fore0)).toBeGreaterThan(Math.abs(sky1 - sky0));
    expect(Math.sign(fore1 - fore0)).toBe(Math.sign(sky1 - sky0));
  });
});
