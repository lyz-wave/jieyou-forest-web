import { expect, test, type Page } from "@playwright/test";
import { finishOnboarding, tapActor } from "./helpers";

/** 玩完一盘以后 gameContext 里该出现的开头，按玩的顺序 */
const CONTEXT_PREFIXES = [
  "【敲树洞】此刻的情绪：委屈、疲惫",
  "【事实还是猜测】困扰的话：",
  "【翻面镜】原来的想法：",
  "【熊抱】和团团抱了",
  "【龟壳呼吸】完成了 1 轮盒式呼吸",
  "【落叶漂流】放走了 1 片烦恼叶子",
  "【藏坚果】让人焦虑的事：",
];

/** 落叶漂流里写下的烦恼，用来验证它不会进 gameContext */
const SECRET = "今天有点撑不住";

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `docs/games/${test.info().project.name}-${name}.png` });
}

/** 点角色 → 角色卡 → 一起玩 → 面板打开 */
async function openGame(page: Page, animal: string, title: string): Promise<void> {
  await tapActor(page, animal);
  await page.getByRole("button", { name: `一起玩：${title}` }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

/** 面板右上角的「回到森林」 */
async function backToForest(page: Page): Promise<void> {
  await page.getByRole("button", { name: "回到森林" }).click();
  await expect(page.getByRole("button", { name: "开始倾诉" })).toBeVisible();
}

/** 先把一件东西点选，再点目标 —— 拖拽游戏的替代操作，键盘之外最省事的一条 */
async function pickAndDrop(page: Page, itemSelector: string, zoneId: string): Promise<void> {
  await page.locator(itemSelector).click();
  await page.locator(`[data-drop-zone="${zoneId}"]`).click();
}

test.describe("七个小游戏", () => {
  test("入林之后逐个玩完七个小游戏，gameContext 记下七条", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/?dev=1");
    await finishOnboarding(page);

    // 1. 敲树洞 · 笃笃
    await openGame(page, "animal-woodpecker", "敲树洞");
    for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "敲一敲树干" }).click();
    await expect(page.getByTestId("knock-count")).toContainText("3");
    await expect(page.getByRole("button", { name: "委屈", exact: true })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "委屈", exact: true }).click();
    await page.getByRole("button", { name: "疲惫", exact: true }).click();
    await shot(page, "knock-tree");
    await page.getByRole("button", { name: "就是这些" }).click();
    await expect(page.getByTestId("knock-reply")).toContainText("原来你是委屈和疲惫啊");
    await backToForest(page);

    // 2. 事实还是猜测 · 墨墨
    await openGame(page, "animal-owl", "事实还是猜测");
    await page.getByRole("button", { name: "一键填示例" }).click();
    await page.getByRole("button", { name: "拆一拆" }).click();
    await expect(page.locator("[data-draggable]").first()).toBeVisible({ timeout: 15_000 });
    const bubbles = await page.locator("[data-draggable]").evaluateAll((els) => els.map((e) => e.getAttribute("data-draggable") ?? ""));
    expect(bubbles.length).toBeGreaterThan(0);
    for (const id of bubbles) await pickAndDrop(page, `[data-draggable="${id}"]`, "guess");
    await shot(page, "fact-or-guess");
    await page.getByRole("button", { name: "看看结果" }).click();
    await expect(page.getByTestId("guess-review")).toBeVisible();
    await backToForest(page);

    // 3. 翻面镜 · 阿橘
    await openGame(page, "animal-fox", "翻面镜");
    await page.getByRole("textbox", { name: "写下让你难受的想法" }).fill("我这次汇报搞砸了，我就是不行");
    await page.getByRole("button", { name: "翻一面" }).click();
    await expect(page.getByRole("button", { name: "收藏幽默版" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "收藏幽默版" }).click();
    await shot(page, "flip-mirror");
    await backToForest(page);

    // 4. 熊抱 · 团团（长按 1.5 秒）
    await openGame(page, "animal-bear", "熊抱");
    // 面板是从底边折起来的，等它落定再量按钮：hover 会等元素稳定，量出来的才是落定后的位置
    const hugButton = page.getByRole("button", { name: "抱一抱团团" });
    await hugButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    await expect(page.getByTestId("hug-line")).not.toBeEmpty();
    await shot(page, "bear-hug");
    await backToForest(page);

    // 5. 龟壳呼吸 · 慢慢（改成 1 轮，否则要等 48 秒）
    await openGame(page, "animal-turtle", "龟壳呼吸");
    await page.getByRole("combobox", { name: "轮数" }).selectOption("1");
    await page.getByRole("button", { name: "开始呼吸" }).click();
    await expect(page.getByTestId("breath-stage")).toHaveAttribute("data-phase", "inhale");
    await shot(page, "shell-breath");
    await expect(page.getByTestId("breath-closing")).toBeVisible({ timeout: 30_000 });
    await backToForest(page);

    // 6. 落叶漂流 · 漂漂
    await openGame(page, "animal-otter", "落叶漂流");
    await expect(page.getByText("叶子上的字不会被保存，漂走就真的走了")).toBeVisible();
    await page.getByRole("textbox", { name: "写一句想放走的烦恼" }).fill(SECRET);
    await page.getByRole("button", { name: "放到溪流上" }).click();
    await expect(page.locator('[data-testid^="leaf-"]').first()).toBeVisible();
    await shot(page, "leaf-float");
    await backToForest(page);

    // 7. 藏坚果 · 跳跳
    await openGame(page, "animal-squirrel", "藏坚果");
    await page.getByRole("textbox", { name: "写下让你焦虑的大事" }).fill("这周的汇报还没准备");
    await page.getByRole("button", { name: "啃一啃" }).click();
    await expect(page.locator('[data-draggable="nut-0"]')).toBeVisible({ timeout: 15_000 });
    await pickAndDrop(page, '[data-draggable="nut-0"]', "hoard");
    await shot(page, "hide-nuts");
    await page.getByRole("button", { name: "就这些" }).click();
    await expect(page.getByTestId("nut-encourage")).toBeVisible();
    await backToForest(page);

    // 七条记录都在，顺序就是玩的顺序
    await page.getByRole("button", { name: /开发工具：gameContext/ }).click();
    for (const prefix of CONTEXT_PREFIXES) {
      await expect(page.getByText(prefix, { exact: false })).toBeVisible();
    }
    // 叶子上的字不落任何记录
    await expect(page.getByText(SECRET, { exact: false })).toHaveCount(0);
    await shot(page, "game-context");
  });
});
