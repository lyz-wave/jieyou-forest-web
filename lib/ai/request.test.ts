import { describe, expect, it } from "vitest";
import { GAME_CONTEXT_MAX, HISTORY_MAX_INPUT, MEMORY_MAX, TALK_MAX, readContext, readRiskText } from "./request";

const good = { nickname: "小满", companion: "fox", text: "他两天没回我消息，他一定讨厌我了" };

describe("读进来的上下文", () => {
  it("缺的可选字段补成空数组", () => {
    expect(readContext(good)).toEqual({ ...good, gameContext: [], memories: [], history: [] });
  });

  it("该带上的都带上", () => {
    const context = readContext({
      ...good,
      moodBefore: 3,
      gameContext: ["【敲树洞】此刻的情绪：委屈"],
      memories: ["上次也是他没回消息"],
      history: [{ speaker: "user", content: "就是这样" }, { speaker: "owl", content: "我们先看事实。" }],
    });
    expect(context).toEqual({
      ...good,
      moodBefore: 3,
      gameContext: ["【敲树洞】此刻的情绪：委屈"],
      memories: ["上次也是他没回消息"],
      history: [{ speaker: "user", content: "就是这样" }, { speaker: "owl", content: "我们先看事实。" }],
    });
  });

  it("不该进来的东西给 null", () => {
    expect(readContext(null)).toBeNull();
    expect(readContext("小满")).toBeNull();
    expect(readContext([])).toBeNull();
    expect(readContext({})).toBeNull();
    expect(readContext({ ...good, nickname: "" })).toBeNull();
    expect(readContext({ ...good, nickname: "小".repeat(13) })).toBeNull();
    expect(readContext({ ...good, companion: "dragon" })).toBeNull();
    expect(readContext({ ...good, companion: undefined })).toBeNull();
    expect(readContext({ ...good, text: "   " })).toBeNull();
    expect(readContext({ ...good, text: "嗯".repeat(TALK_MAX + 1) })).toBeNull();
    expect(readContext({ ...good, moodBefore: 0 })).toBeNull();
    expect(readContext({ ...good, moodBefore: 11 })).toBeNull();
    expect(readContext({ ...good, moodBefore: 3.5 })).toBeNull();
    expect(readContext({ ...good, moodBefore: "3" })).toBeNull();
    expect(readContext({ ...good, gameContext: "不是数组" })).toBeNull();
    expect(readContext({ ...good, gameContext: Array.from({ length: GAME_CONTEXT_MAX + 1 }, () => "一条") })).toBeNull();
    expect(readContext({ ...good, memories: Array.from({ length: MEMORY_MAX + 1 }, () => "一条") })).toBeNull();
    expect(readContext({ ...good, history: Array.from({ length: HISTORY_MAX_INPUT + 1 }, () => ({ speaker: "user", content: "嗯" })) })).toBeNull();
    expect(readContext({ ...good, history: [{ speaker: "dragon", content: "嗯" }] })).toBeNull();
    expect(readContext({ ...good, history: [{ content: "嗯" }] })).toBeNull();
    expect(readContext({ ...good, history: [{ speaker: "user", content: "" }] })).toBeNull();
  });

  it("文本两头的空白会去掉，心情分可以不填", () => {
    expect(readContext({ ...good, text: "  他两天没回我消息  " })).toMatchObject({ text: "他两天没回我消息" });
    expect(readContext(good)).not.toHaveProperty("moodBefore");
  });
});

describe("风险检测的入参", () => {
  it("只收一段话", () => {
    expect(readRiskText({ text: " 我不想活了 " })).toBe("我不想活了");
    expect(readRiskText({ text: "" })).toBeNull();
    expect(readRiskText({ text: "嗯".repeat(TALK_MAX + 1) })).toBeNull();
    expect(readRiskText({})).toBeNull();
    expect(readRiskText("我不想活了")).toBeNull();
  });
});
