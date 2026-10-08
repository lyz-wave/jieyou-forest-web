import { expect, test, type Locator, type Page, type Route } from "@playwright/test";
import { finishOnboarding, tapActor } from "./helpers";

/** 圆桌必须恰好七只、不重不漏，所以假数据也要给全（与 talk.spec.ts 同形） */
const SPEECHES = [
  { animal: "fox", text: "汇报只是一次汇报，不等于你这个人。", mood: "gentle" },
  { animal: "woodpecker", text: "我听见你说的时候，声音是往下沉的。", mood: "gentle" },
  { animal: "owl", text: "哪部分是事实，哪部分只是猜测？可以分开看。", mood: "gentle" },
  { animal: "squirrel", text: "先做最小的一步：明天写三行提纲。", mood: "gentle" },
  { animal: "otter", text: "那句话像一片叶子，先让它漂一会儿。", mood: "gentle" },
  { animal: "turtle", text: "十年后再看这次汇报，大概只是一阵风。", mood: "gentle" },
  { animal: "bear", text: "今天已经很不容易了，先对自己温柔一点。", mood: "gentle" },
];

const SUMMARY = {
  heard: "我听见你说，汇报搞砸了，你觉得自己不行。",
  voices: [
    { animal: "owl", point: "分清事实和猜测" },
    { animal: "bear", point: "先对自己好一点" },
  ],
  thought: "像一片叶子落下来，先不用急着扫走它。",
  nextStep: "明天先写三行提纲。",
  question: "如果是朋友搞砸了，你会怎么对他说？",
};

const REPLY = { speaker: "owl", text: "那就从最小的一步开始，先写一行。" };

/** 沉淀：模型给的那几样（帮助最大的动物与两次心情分由客户端补） */
const MEMORY = {
  title: "汇报搞砸了",
  summary: "一次汇报没做好，就觉得自己整个人不行。",
  emotions: ["委屈", "疲惫"],
  themes: ["工作压力"],
  coreBelief: "我不行",
  shift: { from: "我整个人不行", to: "一次没做好" },
  insight: "我可以做得不好，也还是我。",
  action: "明天先写三行提纲",
};

const ok = (route: Route, data: unknown): Promise<void> =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data }) });

/** 假的服务端：五个接口都自己回，不碰模型 */
async function serveAll(page: Page): Promise<void> {
  await page.route("**/api/roundtable", (route) => ok(route, { speeches: SPEECHES }));
  await page.route("**/api/summary", (route) => ok(route, SUMMARY));
  await page.route("**/api/reply", (route) => ok(route, REPLY));
  await page.route("**/api/risk", (route) => ok(route, { risk: "none" }));
  await page.route("**/api/memory", (route) => ok(route, MEMORY));
}

/** 存一张截图（两个视口各自的文件名） */
async function shot(page: Page, name: string): Promise<void> {
  // 纸卡是从底边折起展开的（rotateX -88 -> 0）：等它落定再截图，否则会拍到压扁的中间帧
  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll(".paper-card")).every((node) => {
          const transform = getComputedStyle(node).transform;
          return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)";
        }),
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => undefined);
  await page.screenshot({ path: `docs/rings/${test.info().project.name}-${name}.png` });
}

/** 一路走到总结：开始倾诉 → 打分 → 写字 → 全部显示 → 听听古树怎么说 */
async function toSummary(page: Page): Promise<void> {
  await page.getByRole("button", { name: "开始倾诉" }).click();
  await expect(page.getByRole("button", { name: "心情 5 分" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "心情 5 分" }).click();
  await page.getByLabel("想说的话").fill("汇报搞砸了，我觉得自己不行。");
  await page.getByRole("button", { name: "说给它听" }).click();
  await expect(page.getByTestId("talk-speech").first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "全部显示" }).click();
  await page.getByRole("button", { name: "听听古树怎么说" }).click();
  await expect(page.getByTestId("summary-heard")).toBeVisible({ timeout: 20_000 });
}

/** 打开年轮：点古树 → 角色卡 → 我的年轮 */
async function openRings(page: Page): Promise<void> {
  await tapActor(page, "tree-spot");
  const card = page.getByRole("dialog");
  await expect(card.getByRole("heading", { name: "岁岁" })).toBeVisible({ timeout: 15_000 });
  await card.getByRole("button", { name: "我的年轮" }).click();
  await expect(page.getByRole("heading", { name: "我的年轮" })).toBeVisible({ timeout: 15_000 });
}

/**
 * 纸卡是从底边折起展开的（rotateX -88 -> 0）：等它落定再量、再点，
 * 否则量到的是压扁的中间帧，算出来的坐标是错的。
 */
async function settleCards(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll(".paper-card")).every((node) => {
          const transform = getComputedStyle(node).transform;
          return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)";
        }),
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => undefined);
}
/** 一圈纸：在纸边上找一点确实落在这圈热区上的地方（环的中心是空的，纸上的装饰不接点击） */
async function clickRing(target: Locator): Promise<void> {
  const page = target.page();
  await settleCards(page);
  await target.scrollIntoViewIfNeeded();
  const point = await target.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = node.querySelector("[data-ring-hit]");
    if (hit === null) return null;
    const x = Math.round(box.x + box.width / 2);
    for (let step = 2; step <= 40; step += 1) {
      const y = Math.round(box.y + step);
      if (document.elementsFromPoint(x, y)[0] === hit) return { x, y };
    }
    return null;
  });
  if (point === null) throw new Error("这一圈上没有点得到的纸");
  // 直接按坐标点：Playwright 的稳定性检查在折起的卡片上会一直等下去
  await page.mouse.click(point.x, point.y);
}

test("心结解开了：再打一次分，年轮长出新的一圈，卡片收进年轮里", async ({ page }) => {
  test.setTimeout(180_000);
  await serveAll(page);
  await page.goto("/");
  await finishOnboarding(page);
  await toSummary(page);

  // 结束：先再打一次分，再沉淀
  await page.getByRole("button", { name: "心结解开了" }).click();
  await expect(page.getByRole("heading", { name: "现在心里松一点了吗？" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("进来的时候是 5 分。")).toBeVisible();
  await page.getByRole("button", { name: "心情 8 分" }).click();
  await page.getByRole("button", { name: "看看这次留下了什么" }).click();

  // 沉淀走的是本地假接口，生长那一屏一闪而过，所以这里只认结果：成长卡片
  await expect(page.getByTestId("growth-card")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("growth-mood")).toContainText("8");
  await expect(page.getByTestId("growth-card")).toContainText("从「我整个人不行」到「一次没做好」");
  await shot(page, "rings-growth-card");

  // 从卡片直接走进年轮：今年这一圈里就有刚才那一条
  await page.getByRole("button", { name: "看看我的年轮" }).click();
  const year = page.getByTestId("ring-year");
  await expect(year).toHaveCount(1);
  // 名字挂在纸上那圈热区上（组是 <g>，读屏读到的是热区）
  await expect(page.locator('[data-testid="ring-year"] [data-ring-hit]')).toHaveAttribute(
    "aria-label",
    /^[0-9]{4} 年，1 条记录$/,
  );
  await shot(page, "rings-year");

  // 年层 → 月层：空着的月份是细线
  await clickRing(year);
  await expect(page.getByTestId("ring-month").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("month-line").first()).toBeVisible();
  await shot(page, "rings-month");

  // 月层 → 日层：点出那一天的成长卡片
  await clickRing(page.getByTestId("ring-month").first());
  const day = page.getByTestId("ring-day").first();
  await expect(day).toBeVisible({ timeout: 10_000 });
  await clickRing(day);
  await expect(page.getByTestId("growth-card")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("growth-mood")).toContainText("8");
  await shot(page, "rings-day");

  // 对话原文默认折着，展开能看到当时说的话
  const talk = page.getByTestId("day-talk").first();
  await talk.locator("summary").click();
  await expect(talk).toContainText("汇报搞砸了");
  await shot(page, "rings-talk");

  // 面包屑逐级退回去
  await page.getByRole("button", { name: "全部" }).click();
  await expect(page.getByTestId("ring-year")).toHaveCount(1);
});

test("年轮空着的时候说第一圈正在生长；生成演示数据后长出跨年的圈", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/?dev=1");
  await finishOnboarding(page);

  // 还没沉淀过：空状态
  await openRings(page);
  const rings = page.getByRole("dialog");
  await expect(rings.getByRole("status")).toHaveText("你的第一圈年轮，正在生长");
  await shot(page, "rings-empty");
  await page.getByRole("button", { name: "关闭年轮" }).click();
  await expect(page.getByRole("heading", { name: "我的年轮" })).toHaveCount(0);

  // 开发模式下的演示数据：跨 2–3 年
  await page.getByRole("button", { name: "生成演示数据" }).click();
  await expect(page.getByText(/（[0-9]+ 条）/)).toBeVisible({ timeout: 15_000 });
  await openRings(page);
  const years = page.getByTestId("ring-year");
  await expect(years.first()).toBeVisible({ timeout: 10_000 });
  expect(await years.count()).toBeGreaterThanOrEqual(2);
  await shot(page, "rings-demo");

  // 按主题筛选：有记录的那几年亮起来
  await page.getByRole("button", { name: "工作压力" }).click();
  expect(await page.locator("[data-testid=ring-year][data-highlighted=true]").count()).toBeGreaterThanOrEqual(1);
  await shot(page, "rings-theme");
});
