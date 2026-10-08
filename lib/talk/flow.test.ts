import { describe, expect, it } from "vitest";
import type { Speech } from "@/lib/ai/schema";
import { ANIMAL_CAST } from "@/lib/animals";
import {
  localGuard,
  mentionsTarget,
  needsServerCheck,
  parseMention,
  replyHistory,
  reveal,
  roundtableOrder,
  speechesAsHistory,
} from "./flow";

describe("圆桌的顺序", () => {
  it("今天的伙伴先说，其余按固定顺序，同一次会话里两次算出来一样", () => {
    const order = roundtableOrder("turtle");
    expect(order[0]).toBe("turtle");
    expect(order.length).toBe(ANIMAL_CAST.length);
    expect(new Set(order).size).toBe(ANIMAL_CAST.length);
    expect(roundtableOrder("turtle")).toEqual(order);

    const rest = ANIMAL_CAST.map((a) => a.id).filter((id) => id !== "turtle");
    expect(order.slice(1)).toEqual(rest);
  });

  it("伙伴本来就在队列最前时也不重复", () => {
    const order = roundtableOrder(ANIMAL_CAST[0].id);
    expect(order.length).toBe(ANIMAL_CAST.length);
    expect(new Set(order).size).toBe(ANIMAL_CAST.length);
  });
});

describe("@ 谁", () => {
  it("写了 @墨墨，问题就交给墨墨，@ 那一段不留在话里", () => {
    expect(parseMention("@墨墨 我还是想不通")).toEqual({ target: "owl", rest: "我还是想不通" });
  });

  it("没有 @ 就交给古树，原话一个字不动", () => {
    expect(parseMention("我还是想不通")).toEqual({ target: "tree", rest: "我还是想不通" });
    expect(parseMention("  我还是想不通  ")).toEqual({ target: "tree", rest: "我还是想不通" });
  });

  it("也能 @ 古树岁岁", () => {
    expect(parseMention("@岁岁 你说呢")).toEqual({ target: "tree", rest: "你说呢" });
  });
  it("认不出来的名字还是交给古树，而且不把话吃掉", () => {
    expect(parseMention("@阿猫 你说呢")).toEqual({ target: "tree", rest: "@阿猫 你说呢" });
  });
});

describe("本地粗筛", () => {
  it("说到不想活这类话，本地就当成危险信号", () => {
    expect(localGuard("我真的不想活了")).toBe("crisis");
    expect(localGuard("有时候会想消失掉")).toBe("crisis");
  });

  it("很沉但没到危险，算 concern", () => {
    expect(localGuard("最近每天都撑不住")).toBe("concern");
  });

  it("每句都交给服务端再判一次，只有本地已认定危险时才不打扰它", () => {
    expect(localGuard("他两天没回我消息")).toBe("none");
    expect(needsServerCheck("none")).toBe(true);
    expect(needsServerCheck("concern")).toBe(true);
    expect(needsServerCheck("crisis")).toBe(false);
  });
});

describe("一个字一个字地出", () => {
  it("还没到就只给前头几个字，够了就给全", () => {
    expect(reveal("他两天没回我消息", 0)).toBe("");
    expect(reveal("他两天没回我消息", 3)).toBe("他两天");
    expect(reveal("他两天没回我消息", 99)).toBe("他两天没回我消息");
    expect(reveal("他两天没回我消息", -1)).toBe("");
  });
});
describe("交给模型的对话记录", () => {
  it("七只的发言按名字排成记录", () => {
    const speeches = [
      { animal: "owl", text: "事实和猜测分开看", mood: "calm" },
      { animal: "bear", text: "先对自己好一点", mood: "gentle" },
    ] as Speech[];
    expect(speechesAsHistory(speeches)).toEqual([
      { speaker: "owl", content: "事实和猜测分开看" },
      { speaker: "bear", content: "先对自己好一点" },
    ]);
  });

  it("追问时先放用户这次说的，再放七只说的和来回过的", () => {
    const speeches = [{ animal: "owl", text: "分开看", mood: "calm" }] as Speech[];
    expect(replyHistory("我还是想不通", speeches, [{ speaker: "tree", text: "慢慢来" }])).toEqual([
      { speaker: "user", content: "我还是想不通" },
      { speaker: "owl", content: "分开看" },
      { speaker: "tree", content: "慢慢来" },
    ]);
  });
});


describe("指名到某一位", () => {
  it("@ 到认识的才算指名，@ 了不认识的不算", () => {
    expect(mentionsTarget("@墨墨 我还是想不通")).toBe(true);
    expect(mentionsTarget("@岁岁 你在吗")).toBe(true);
    expect(mentionsTarget("@某个陌生人 在吗")).toBe(false);
    expect(mentionsTarget("我还是想不通")).toBe(false);
  });
});
