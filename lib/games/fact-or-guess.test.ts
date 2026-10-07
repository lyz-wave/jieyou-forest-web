import { describe, expect, it } from "vitest";
import type { ThoughtBubble } from "@/lib/ai/types";
import {
  agreeLine,
  differLine,
  factOrGuessContext,
  reviewPlacements,
  trapSummary,
} from "./fact-or-guess";

const bubbles: ThoughtBubble[] = [
  { id: "b1", text: "他今天没回我消息", answer: "fact" },
  { id: "b2", text: "他肯定是不想理我了", answer: "guess", trap: "mind-reading" },
  { id: "b3", text: "我永远都做不好", answer: "guess", trap: "overgeneralize" },
];

describe("事实还是猜测的点评", () => {
  it("全部放对时另一个桶是空的", () => {
    const r = reviewPlacements(bubbles, { b1: "fact", b2: "guess", b3: "guess" });
    expect(r.agreed).toEqual(["b1", "b2", "b3"]);
    expect(r.disagreed).toEqual([]);
  });

  it("放得不一样的气泡进 disagreed", () => {
    const r = reviewPlacements(bubbles, { b1: "fact", b2: "fact", b3: "guess" });
    expect(r.agreed).toEqual(["b1", "b3"]);
    expect(r.disagreed).toEqual(["b2"]);
  });

  it("思维陷阱按气泡顺序列出（不管放得对不对）", () => {
    const r = reviewPlacements(bubbles, { b1: "fact", b2: "fact", b3: "guess" });
    expect(r.traps).toEqual(["mind-reading", "overgeneralize"]);
  });

  it("没放的气泡既不算一致也不算不一致", () => {
    const r = reviewPlacements(bubbles, { b1: "fact" });
    expect(r.agreed).toEqual(["b1"]);
    expect(r.disagreed).toEqual([]);
    expect(r.pending).toEqual(["b2", "b3"]);
  });

  it("肯定的话不为空，而且每个气泡的说法不一样", () => {
    const a = agreeLine("b1");
    const b = agreeLine("b2");
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });

  it("不一样的那句用提问的语气，说话/猜测，不说「错了」", () => {
    const guess = differLine("guess");
    const fact = differLine("fact");
    expect(guess).toContain("猜测");
    expect(guess).toContain("？");
    expect(fact).toContain("事实");
    expect(guess).not.toContain("错了");
    expect(fact).not.toContain("错了");
  });

  it("陷阱汇总给出名称和一句话解释", () => {
    const s = trapSummary(["catastrophe"]);
    expect(s).toContain("灾难化");
    expect(s.length).toBeGreaterThan(4);
  });

  it("没有陷阱时汇总为空", () => {
    expect(trapSummary([])).toBe("");
  });

  it("gameContext 按规格拼装", () => {
    expect(factOrGuessContext("我肯定要搞砸了", ["他肯定是不想理我了"], ["mind-reading"])).toBe(
      "困扰的话：我肯定要搞砸了；其中的猜测：他肯定是不想理我了；可能的思维陷阱：读心术",
    );
  });

  it("没有陷阱 / 没有猜测时有兜底说法", () => {
    expect(factOrGuessContext("我肯定要搞砸了", ["他不想理我"], [])).toContain("没有发现明显的思维陷阱");
    expect(factOrGuessContext("我肯定要搞砸了", [], ["mind-reading"])).toContain("没有明显的猜测");
  });
});