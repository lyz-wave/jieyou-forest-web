import { expect, test, type Page } from "@playwright/test";
import { finishOnboarding } from "./helpers";

const MIN_TAP = 44;

/** 森林里该有点击热区的东西：古树、7 只动物（+ 开始倾诉，量的时候一起带上） */
const HOTSPOTS = [
  "tree-spot",
  "animal-fox",
  "animal-owl",
  "animal-bear",
  "animal-squirrel",
  "animal-woodpecker",
  "animal-otter",
  "animal-turtle",
];

interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 量可点区域：纸偶按钮，加上为小纸偶补出来的那圈透明热区（data-tap-cover） */
async function hotspots(page: Page): Promise<Hotspot[]> {
  return page.evaluate((ids) => {
    type Box = { left: number; top: number; right: number; bottom: number };
    const union = (a: Box, b: Box): Box => ({
      left: Math.min(a.left, b.left),
      top: Math.min(a.top, b.top),
      right: Math.max(a.right, b.right),
      bottom: Math.max(a.bottom, b.bottom),
    });
    const out = ids.map((id) => {
      const host = document.querySelector(`[data-testid="${id}"]`);
      const button = host?.querySelector("button") ?? host;
      if (!button) return { id, x: Number.NaN, y: Number.NaN, width: 0, height: 0 };
      let r: Box = button.getBoundingClientRect();
      const cover = button.querySelector("[data-tap-cover]");
      if (cover) r = union(r, cover.getBoundingClientRect());
      return { id, x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top };
    });
    const gather = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("开始倾诉"));
    if (gather) {
      out.push({ id: "start-gather", x: gather.getBoundingClientRect().left, y: gather.getBoundingClientRect().top, width: gather.offsetWidth, height: gather.offsetHeight });
    }
    return out;
  }, HOTSPOTS);
}

/** 量单个热区（纸偶按钮 ∪ 补出来的透明热区，或者开始倾诉按钮） */
async function hotspotBox(page: Page, id: string): Promise<Hotspot> {
  const box = (await hotspots(page)).find((b) => b.id === id);
  if (!box) throw new Error(`量不到 ${id} 的热区`);
  return box;
}

/**
 * 点某个角色：先在它此刻的热区里量出中心，再直接点那个坐标。
 * 森林一直在动（相机漂移 + 动物走动），Playwright 的稳定性检查等不到「元素不动」，只能自己量。
 */
async function tapActor(page: Page, id: string): Promise<void> {
  const box = await hotspotBox(page, id);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** 纸偶自己的按钮盒子，和补过以后的完整热区（屏幕上本来就够大时两者一样大） */
async function hotAndPuppet(page: Page, id: string): Promise<{ hot: Hotspot; puppet: Hotspot }> {
  return page.evaluate((testId) => {
    type Box = { left: number; top: number; right: number; bottom: number };
    const host = document.querySelector(`[data-testid="${testId}"]`);
    const button = host?.querySelector("button");
    if (!button) throw new Error(`${testId} 里没有可点的纸偶`);
    const b = button.getBoundingClientRect();
    let hot: Box = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    const cover = button.querySelector("[data-tap-cover]");
    if (cover) {
      const c = cover.getBoundingClientRect();
      hot = {
        left: Math.min(hot.left, c.left),
        top: Math.min(hot.top, c.top),
        right: Math.max(hot.right, c.right),
        bottom: Math.max(hot.bottom, c.bottom),
      };
    }
    const sized = (r: Box) => ({ id: testId, x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top });
    return { hot: sized(hot), puppet: sized({ left: b.left, top: b.top, right: b.right, bottom: b.bottom }) };
  }, id);
}

/** 每张纸层的边缘有没有露进视口（有露边就把那层的信息带出来） */
async function layerGaps(page: Page): Promise<{ count: number; gaps: string[] }> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const layers = [...document.querySelectorAll<HTMLElement>("[data-layer]")];
    const gaps = layers
      .map((el) => {
        const r = el.getBoundingClientRect();
        const outside = r.left > 0.5 || r.top > 0.5 || r.right < vw - 0.5 || r.bottom < vh - 0.5;
        return outside
          ? `${el.dataset.layer}: left=${r.left.toFixed(1)} top=${r.top.toFixed(1)} right=${r.right.toFixed(1)} bottom=${r.bottom.toFixed(1)}（视口 ${vw}×${vh}）`
          : "";
      })
      .filter(Boolean);
    return { count: layers.length, gaps };
  });
}

/** 读出 world 的平移（相机），用来确认视差真的推到了 */
async function cameraShift(page: Page): Promise<{ x: number; y: number }> {
  return page.getByTestId("paper-world").evaluate((el) => {
    const t = getComputedStyle(el).transform;
    if (t === "none") return { x: 0, y: 0 };
    const m = new DOMMatrix(t);
    return { x: m.m41, y: m.m42 };
  });
}

/** 等相机弹簧停稳（连续两次读数一样） */
async function settle(page: Page): Promise<void> {
  let last = await cameraShift(page);
  for (let i = 0; i < 30; i += 1) {
    await page.waitForTimeout(120);
    const now = await cameraShift(page);
    if (Math.abs(now.x - last.x) < 0.05 && Math.abs(now.y - last.y) < 0.05) return;
    last = now;
  }
}

const PARALLAX_MAX = 32.4; // PARALLAX_MARGIN * 0.9

test.describe("森林主场景", () => {
  test.describe("布局与热区", () => {
    test.use({ reducedMotion: "reduce" });

    test("古树、7 只动物和开始倾诉都在视口内，可点区域不小于 44×44 且互不重叠", async ({ page }) => {
      await page.goto("/");
      await finishOnboarding(page);
      await page.waitForTimeout(300);

      const size = page.viewportSize();
      expect(size).not.toBeNull();
      const viewport = size ?? { width: 0, height: 0 };

      const boxes = await hotspots(page);
      expect(boxes.map((b) => b.id)).toEqual([...HOTSPOTS, "start-gather"]);

      const problems: string[] = [];
      for (const box of boxes) {
        const label = `${box.width.toFixed(1)}×${box.height.toFixed(1)}`;
        if (box.width < MIN_TAP - 0.5 || box.height < MIN_TAP - 0.5) {
          problems.push(`${box.id} 的可点区域只有 ${label}`);
        }
        if (
          box.x < -0.5 ||
          box.y < -0.5 ||
          box.x + box.width > viewport.width + 0.5 ||
          box.y + box.height > viewport.height + 0.5
        ) {
          problems.push(`${box.id} 没有完整落在视口里：${box.x.toFixed(1)},${box.y.toFixed(1)} ${label}`);
        }
      }
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i];
          const b = boxes[j];
          const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
          const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
          if (ox > 1 && oy > 1) problems.push(`${a.id} 和 ${b.id} 的可点区域重叠 ${ox.toFixed(1)}×${oy.toFixed(1)}`);
        }
      }
      expect(problems).toEqual([]);

      // 免责声明：看得见，但不吃点击
      const notice = page.getByText("解忧森林不能替代专业心理咨询");
      await expect(notice).toBeVisible();
      expect(await notice.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");

      await page.screenshot({ path: `docs/forest/${test.info().project.name}-home.png` });
    });

    test("补出来的热区真的点得到（树上最小的笃笃）", async ({ page }) => {
      await page.goto("/");
      await finishOnboarding(page);
      await page.waitForTimeout(300);

      const { hot, puppet } = await hotAndPuppet(page, "animal-woodpecker");
      expect(hot.width).toBeGreaterThanOrEqual(MIN_TAP - 0.5);
      expect(hot.height).toBeGreaterThanOrEqual(MIN_TAP - 0.5);

      // 点热区的左上角：补过热区时它在纸偶盒子外面（说明这 44px 是补出来的那圈接住的）
      const x = hot.x + 3;
      const y = hot.y + 3;
      const padded = hot.width > puppet.width + 0.5 || hot.height > puppet.height + 0.5;
      if (padded) expect(x < puppet.x || y < puppet.y).toBe(true);

      await page.mouse.click(x, y);
      await expect(page.getByRole("dialog").getByRole("heading", { name: "笃笃" })).toBeVisible();
    });
  });

  test("伙伴徽记只挂在伙伴身上，它的角色卡写着我的伙伴", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);

    await expect(page.getByTestId("companion-badge")).toHaveCount(1);
    await expect(page.getByTestId("animal-fox").getByTestId("companion-badge")).toBeVisible();
    await expect(page.getByTestId("animal-owl").getByTestId("companion-badge")).toHaveCount(0);

    await tapActor(page, "animal-fox");
    const card = page.getByRole("dialog");
    await expect(card.getByRole("heading", { name: "阿橘" })).toBeVisible();
    await expect(card.getByText("我的伙伴", { exact: true })).toBeVisible();
  });

  test("点墨墨打开角色卡：镜头推近、内容齐全、Esc 折回并把焦点还给墨墨", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);

    const owl = page.getByTestId("animal-owl").locator("button");
    await tapActor(page, "animal-owl");

    const card = page.getByRole("dialog");
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: "墨墨" })).toBeVisible();
    await expect(card.locator("p", { hasText: "猫头鹰 · 理性分析" })).toBeVisible();
    await expect(card.locator("p", { hasText: "心理学依据" })).toBeVisible();
    await expect(card.locator("p", { hasText: "哪些是真的发生了" })).toBeVisible();
    await expect(card.getByRole("button", { name: "一起玩：事实还是猜测" })).toBeVisible();

    // 镜头推近：world 的 z 变正
    await expect
      .poll(() => page.getByTestId("paper-world").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m43))
      .toBeGreaterThan(60);
    await page.keyboard.press("Escape");
    await expect(card).toHaveCount(0);
    await expect(owl).toBeFocused();
    // 折回后镜头缩回远景：只看 z（鼠标留在原地时视差的横向偏移还在，平面矩阵不会是 identity）
    await expect
      .poll(() => page.getByTestId("paper-world").evaluate((el) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m43)))
      .toBeLessThan(1);
  });

  test("关闭按钮和点卡片外部都能折回", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);

    await tapActor(page, "animal-owl");
    await page.getByRole("button", { name: "关闭" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const size = page.viewportSize() ?? { width: 0, height: 0 };
    await tapActor(page, "animal-owl");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.mouse.click(size.width - 6, Math.round(size.height * 0.45));
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("点古树看岁岁：我的年轮只给提示，不跳转", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);

    const url = page.url();
    await tapActor(page, "tree-spot");
    const card = page.getByRole("dialog");
    await expect(card.getByRole("heading", { name: "岁岁" })).toBeVisible();

    await card.getByRole("button", { name: "🌳 我的年轮" }).click();
    await expect(card.getByRole("status")).toHaveText("年轮还在生长，过些日子再来看看");
    await expect(card).toBeVisible();
    expect(page.url()).toBe(url);
  });

  test("点开始倾诉：按钮收起来，大家聚拢过来", async ({ page }) => {
    await page.goto("/");
    await finishOnboarding(page);

    const start = page.getByRole("button", { name: "🍃 开始倾诉" });
    await expect(start).toBeVisible();
    const box = await hotspotBox(page, "start-gather");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(start).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("大家都在听啦，倾诉功能下个版本开放", { timeout: 45_000 });
  });

  test("视差推到最大时纸层不露边", async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === "mobile";
    if (mobile) {
      // 装上能带 beta/gamma 的假事件，才能把陀螺仪视差推到最大
      await page.addInitScript(() => {
        class FakeTiltEvent extends Event {
          beta: number;
          gamma: number;
          constructor(type: string, init: { beta?: number; gamma?: number } = {}) {
            super(type);
            this.beta = init.beta ?? 0;
            this.gamma = init.gamma ?? 0;
          }
        }
        Object.defineProperty(window, "DeviceOrientationEvent", { value: FakeTiltEvent, configurable: true });
      });
    }
    await page.goto("/");
    const scene = page.getByTestId("paper-scene");
    await expect(scene).toHaveAttribute("data-parallax", mobile ? "orientation" : "pointer");

    const directions: { name: string; beta: number; gamma: number; point?: [number, number] }[] = mobile
      ? [
          { name: "左下", beta: 0, gamma: -15 },
          { name: "右上", beta: 15, gamma: 15 },
          { name: "左上", beta: 15, gamma: -15 },
          { name: "右下", beta: -15, gamma: 15 },
        ]
      : [
          { name: "左上", beta: 0, gamma: 0, point: [1, 1] },
          { name: "右下", beta: 0, gamma: 0, point: [1439, 899] },
        ];

    if (mobile) {
      await page.evaluate(() => {
        window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { beta: 0, gamma: 0 }));
      });
    }

    for (const dir of directions) {
      if (mobile) {
        await page.evaluate(
          ([beta, gamma]) => {
            window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { beta, gamma }));
          },
          [dir.beta, dir.gamma],
        );
      } else {
        await page.mouse.move(dir.point?.[0] ?? 0, dir.point?.[1] ?? 0);
      }
      await settle(page);
      const shift = await cameraShift(page);
      expect(Math.hypot(shift.x, shift.y), `视差没推到最大（${dir.name}）：相机只挪了 ${shift.x.toFixed(1)},${shift.y.toFixed(1)}`).toBeGreaterThan(25);
      // 两个轴可以同时推满，所以逐轴比（hypot 的极限是 PARALLAX_MAX*√2）
      expect(Math.abs(shift.x), `${dir.name}的横向偏移超了`).toBeLessThanOrEqual(PARALLAX_MAX + 1);
      expect(Math.abs(shift.y), `${dir.name}的纵向偏移超了`).toBeLessThanOrEqual(PARALLAX_MAX + 1);

      const { count, gaps } = await layerGaps(page);
      expect(count).toBeGreaterThan(3);
      expect(gaps, `视差推到${dir.name}时露出纸层边缘`).toEqual([]);
    }
  });
});
