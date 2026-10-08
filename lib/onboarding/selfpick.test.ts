import { describe, expect, it } from "vitest";
import { ANIMALS, type AnimalId } from "../animals";
import {
  EMPTY_ANSWERS,
  SELF_PICK_QUESTIONS,
  isComplete,
  recommend,
  recommendLine,
  type SelfPickAnswers,
} from "./selfpick";

/** 只选第一题、后两题都不表态 —— 用来验证第一题的六只动物都能被推荐出来 */
function wantOnly(kind: string): SelfPickAnswers {
  const option = SELF_PICK_QUESTIONS[0].options.find((o) => o.kind === kind);
  if (!option) throw new Error(`第 1 题里没有 ${kind}`);
  return { ...EMPTY_ANSWERS, want: [kind as never] };
}

const NEUTRAL = SELF_PICK_QUESTIONS[1].options.find((o) => o.animal === null)!;
const LONG_VIEW = SELF_PICK_QUESTIONS[2].options.find((o) => o.animal === "turtle")!;

describe("自选问题的题目", () => {
  it("一共三道题，第一题最多选两个，每题 2–6 个选项", () => {
    expect(SELF_PICK_QUESTIONS).toHaveLength(3);
    expect(SELF_PICK_QUESTIONS[0].max).toBe(2);
    for (const q of SELF_PICK_QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(6);
    }
  });

  it("问的是此刻，不问人格", () => {
    const text = SELF_PICK_QUESTIONS.flatMap((q) => [q.ask, ...q.options.map((o) => o.label)]).join("");
    for (const word of ["性格", "人格", "类型", "星座", "MBTI"]) expect(text).not.toContain(word);
  });
});

describe("推荐", () => {
  it("没答完就不给推荐", () => {
    expect(isComplete(EMPTY_ANSWERS)).toBe(false);
    expect(recommend(EMPTY_ANSWERS)).toBeNull();
  });

  it("答完三道题就算完整", () => {
    const answers: SelfPickAnswers = { ...wantOnly("understood"), now: [NEUTRAL.kind!], long: [LONG_VIEW.kind!] };
    expect(isComplete(answers)).toBe(true);
  });

  it("同样的答案永远得到同一只动物", () => {
    const answers = { ...wantOnly("let-go"), now: [NEUTRAL.kind!], long: [LONG_VIEW.kind!] } as SelfPickAnswers;
    const first = recommend(answers);
    for (let i = 0; i < 5; i += 1) expect(recommend(answers)).toBe(first);
  });

  it("七只动物都可达", () => {
    const cases: [string, SelfPickAnswers, AnimalId][] = [
      ["understood", { ...wantOnly("understood"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] }, "woodpecker"],
      ["comforted", { ...wantOnly("comforted"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] }, "bear"],
      ["reframe", { ...wantOnly("reframe"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] }, "fox"],
      ["small-step", { ...wantOnly("small-step"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] }, "squirrel"],
      ["let-go", { ...wantOnly("let-go"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] }, "otter"],
      ["see-clearly", { ...wantOnly("see-clearly"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] }, "owl"],
      ["long-view", { ...wantOnly("understood"), now: [NEUTRAL.kind!], long: [LONG_VIEW.kind!] }, "turtle"],
    ];
    for (const [name, answers, expected] of cases) {
      expect(recommend(answers as SelfPickAnswers), name).toBe(expected);
    }
  });

  it("两个都想时两票都算，后答的题在平票时优先", () => {
    const answers: SelfPickAnswers = { want: ["understood", "comforted"], now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] };
    expect(recommend(answers)).toBe("bear");
  });
});

describe("推荐文案", () => {
  it("说清为什么是它，用当时的说法，不做人格判断", () => {
    const answers: SelfPickAnswers = { ...wantOnly("see-clearly"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] };
    const line = recommendLine(answers, "owl");
    expect(line).toContain("看清那件事");
    expect(line).toContain(ANIMALS.owl.name);
    for (const word of ["性格", "人格", "类型", "你是"]) expect(line).not.toContain(word);
  });

  it("推荐给哪只就说哪只的名字", () => {
    const answers: SelfPickAnswers = { ...wantOnly("let-go"), now: [NEUTRAL.kind!], long: [NEUTRAL.kind!] };
    expect(recommendLine(answers, "otter")).toContain(ANIMALS.otter.name);
  });
});
