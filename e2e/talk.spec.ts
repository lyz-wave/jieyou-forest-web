import { expect, test, type Page, type Route } from "@playwright/test";
import { finishOnboarding } from "./helpers";

/** 降级文案（与服务端同一句，E2E 自己带一份，免得跨目录 import） */
const FAILURE_LINE = "风太大了没听清，能再说一次吗？";

/** 圆桌必须恰好七只、不重不漏（客户端和服务端用的是同一个守卫），所以假数据也要给全 */
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

/** 假的服务端：四个接口都自己回，不碰模型 */
async function serveAll(page: Page): Promise<void> {
  await page.route("**/api/roundtable", (route) => ok(route, { speeches: SPEECHES }));
  await page.route("**/api/summary", (route) => ok(route, SUMMARY));
  await page.route("**/api/reply", (route) => ok(route, REPLY));
  await page.route("**/api/risk", (route) => ok(route, { risk: "none" }));
  await page.route("**/api/memory", (route) => ok(route, MEMORY));
}

/** 打开倾诉流程：打分那一屏出来才算打开 */
async function openTalk(page: Page): Promise<void> {
  await page.getByRole("button", { name: "开始倾诉" }).click();
  await expect(page.getByRole("button", { name: "心情 5 分" })).toBeVisible({ timeout: 15_000 });
}

/** 打分、写字、说给它听 */
async function finishSpeak(page: Page, text = "汇报搞砸了，我觉得自己不行"): Promise<void> {
  await page.getByRole("button", { name: "心情 5 分" }).click();
  await page.getByLabel("想说的话").fill(text);
  await page.getByRole("button", { name: "说给它听" }).click();
}

/** 存一张截图（两个视口各自的文件名） */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `docs/talk/${test.info().project.name}-${name}.png` });
}

/** 走到圆桌：开始倾诉 → 打分 → 写字 → 说给它听 */
async function speakOnce(page: Page, text = "汇报搞砸了，我觉得自己不行"): Promise<void> {
  await openTalk(page);
  await finishSpeak(page, text);
}

test("从开始倾诉走完一轮：圆桌、总结、追问，最后回到森林", async ({ page }) => {
  test.setTimeout(120_000);
  await serveAll(page);
  await page.goto("/");
  await finishOnboarding(page);

  // 打分按钮的热区不小于 44×44
  await openTalk(page);
  const moodButton = page.getByRole("button", { name: "心情 5 分" });
  await moodButton.hover(); // 卡片是从底边折起来的，动画没停的时候量到的是压扁的盒子
  const mood = await moodButton.boundingBox();
  expect(mood?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(mood?.height ?? 0).toBeGreaterThanOrEqual(44);
  await shot(page, "talk-mood");

  // 场景右上角那个「开启体感」不能盖在对话上面：它盖着的话，那一下会落到卡片外面，把话头打断。
  // （手机上才有这个按钮；桌面视口不显示，跳过。）
  const orb = page.getByRole("button", { name: "开启体感" });
  if ((await orb.count()) > 0) {
    const onTop = await orb.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      // 点到的可能是按钮里面的纸片叶子，所以按钮的子孙也算「盖在上面」
      return top !== null && (top === el || el.contains(top));
    });
    expect(onTop, "「开启体感」盖在对话框上面了").toBe(false);
  }

  await finishSpeak(page);

  // 伙伴（今天的伙伴是阿橘）先说：头顶气泡跟着出字，说话的那只带一圈光
  await expect(page.getByTestId("talk-speech").first()).toContainText("汇报只是一次汇报", { timeout: 20_000 });
  await expect(page.getByTestId("speaking-glow").first()).toBeVisible();
  await expect(page.getByTestId("talk-bubble-text")).toContainText("汇报", { timeout: 10_000 });

  // 圆桌时其他动物在反应：点头、思考、笑（文档 6.3.6）
  await expect(page.locator('[data-gesture="nod"], [data-gesture="think"], [data-gesture="smile"]').first()).toBeVisible();
  await shot(page, "talk-roundtable");

  await page.getByRole("button", { name: "下一位" }).click();
  await expect(page.getByTestId("talk-speech")).toHaveCount(2);
  await page.getByRole("button", { name: "全部显示" }).click();
  await expect(page.getByTestId("talk-speech")).toHaveCount(7);

  // 古树总结
  await page.getByRole("button", { name: "听听古树怎么说" }).click();
  await expect(page.getByTestId("summary-heard")).toContainText("我听见你说", { timeout: 20_000 });
  await expect(page.getByTestId("tree-glow")).toBeVisible();
  await expect(page.getByTestId("summary-question")).toContainText("？");
  await shot(page, "talk-summary");

  // 总结里可以说「让大家再说说」：就同一件事再请一轮（文档 6.3.8）
  await page.getByRole("button", { name: "让大家再说说" }).click();
  await expect(page.getByTestId("talk-speech")).toHaveCount(1, { timeout: 20_000 });
  await expect(page.getByTestId("talk-speech").first()).toContainText("汇报只是一次汇报");
  await page.getByRole("button", { name: "全部显示" }).click();
  await expect(page.getByTestId("talk-speech")).toHaveCount(7);
  await page.getByRole("button", { name: "听听古树怎么说" }).click();
  await expect(page.getByTestId("summary-heard")).toContainText("我听见你说", { timeout: 20_000 });

  // 追问：@墨墨 就把话交给墨墨
  await page.getByRole("button", { name: "我还想说一句" }).click();
  await page.getByLabel(/想跟谁说一句/).fill("@墨墨 我还是想不通");
  await page.getByRole("button", { name: "说出去" }).click();
  await expect(page.getByTestId("talk-reply")).toContainText("先写一行", { timeout: 20_000 });

  // 收尾：心结解开了 → 再打一次分 → 沉淀 → 成长卡片 → 回森林（大家散开，气泡和光都不见了）
  await page.getByRole("button", { name: "心结解开了" }).click();
  await expect(page.getByRole("heading", { name: "现在心里松一点了吗？" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "跳过打分" }).click();
  await expect(page.getByTestId("growth-card")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "收好，回到森林" }).click();
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("talk-bubble")).toHaveCount(0);
  await expect(page.getByTestId("speaking-glow")).toHaveCount(0);
});

test("圆桌没接上：降级话 + 再试一次，说出去的话原样重发", async ({ page }) => {
  test.setTimeout(120_000);
  const bodies: string[] = [];
  await page.route("**/api/roundtable", async (route) => {
    bodies.push(route.request().postData() ?? "");
    if (bodies.length === 1) {
      await route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "upstream" }) });
      return;
    }
    await ok(route, { speeches: SPEECHES });
  });
  await page.route("**/api/summary", (route) => ok(route, SUMMARY));
  await page.route("**/api/reply", (route) => ok(route, REPLY));
  await page.route("**/api/risk", (route) => ok(route, { risk: "none" }));

  await page.goto("/");
  await finishOnboarding(page);
  await speakOnce(page);

  await expect(page.getByText(FAILURE_LINE)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "再试一次" }).click();
  await expect(page.getByTestId("talk-speech").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(FAILURE_LINE)).toHaveCount(0);
  // 第二次请求里带着刚才写的那句话，一个字没丢
  expect(bodies.length).toBe(2);
  expect(bodies[1]).toContain("汇报搞砸了");
});

test.describe("减弱动画", () => {
  test.use({ reducedMotion: "reduce" });

  test("头顶气泡整段出现，不一个字一个字地打", async ({ page }) => {
    test.setTimeout(120_000);
    await serveAll(page);
    await page.goto("/");
    await finishOnboarding(page);
    await speakOnce(page);
    await expect(page.getByTestId("talk-speech").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("talk-bubble-text")).toHaveText(SPEECHES[0].text);
  });
});

test("说到不想活：当场停在守护页，求助卡给号码，确认安全之后才继续说", async ({ page }) => {
  test.setTimeout(120_000);
  const riskCalls: string[] = [];
  let roundtableCalls = 0;
  await page.route("**/api/risk", (route) => {
    riskCalls.push(route.request().postData() ?? "");
    return ok(route, { risk: "none" });
  });
  await page.route("**/api/roundtable", (route) => {
    roundtableCalls += 1;
    return ok(route, { speeches: SPEECHES });
  });
  await page.route("**/api/summary", (route) => ok(route, SUMMARY));
  await page.route("**/api/reply", (route) => ok(route, REPLY));

  await page.goto("/");
  await finishOnboarding(page);
  await speakOnce(page, "我觉得撑不下去了，不想活");

  // 岁岁先认真回应，然后是三步和求助卡
  // 只认守护页那一个 alert：Next 自己的路由播报器也是 role="alert"
  const guard = page.locator('[role="alert"][data-autofocus]');
  await expect(guard).toContainText("岁岁", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "先停一下，我们慢慢来" })).toBeVisible();
  await expect(page.getByText("12356")).toBeVisible();
  await expect(page.getByText("400-161-9995")).toBeVisible();
  await expect(page.getByText("110 / 120")).toBeVisible();
  await shot(page, "talk-guard");

  // 本地就认出来了：不用再打扰服务端，也不请七只说话
  expect(riskCalls.length).toBe(0);
  expect(roundtableCalls).toBe(0);

  // 确认安全之前走不掉
  const go = page.getByRole("button", { name: "我还想说，继续吧" });
  await expect(go).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(go).toBeEnabled();
  await go.click();
  await expect(page.getByRole("heading", { name: "大家在听" })).toBeVisible({ timeout: 20_000 });
});

test("服务端判危险：一样停在守护页，也不请七只说话", async ({ page }) => {
  test.setTimeout(120_000);
  const riskCalls: string[] = [];
  let roundtableCalls = 0;
  await page.route("**/api/risk", (route) => {
    riskCalls.push(route.request().postData() ?? "");
    return ok(route, { risk: "crisis" });
  });
  await page.route("**/api/roundtable", (route) => {
    roundtableCalls += 1;
    return ok(route, { speeches: SPEECHES });
  });

  await page.goto("/");
  await finishOnboarding(page);
  // 这句话里没有本地认得出的危险词，得靠服务端判
  await speakOnce(page, "最近什么都不太对，我有点撑不住");

  await expect(page.getByRole("heading", { name: "先停一下，我们慢慢来" })).toBeVisible({ timeout: 20_000 });
  expect(riskCalls.length).toBe(1);
  expect(riskCalls[0]).toContain("撑不住");
  expect(roundtableCalls).toBe(0);
});
