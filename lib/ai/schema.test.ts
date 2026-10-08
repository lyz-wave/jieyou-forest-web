import { describe, expect, it } from "vitest";
import { ANIMAL_CAST } from "@/lib/animals";
import { HEARD_MAX, REPLY_MAX, SPEECH_MAX, SUMMARY_TOTAL_MAX, VOICE_MAX, parseBreakDown, parseReframe, parseReply, parseRisk, parseRoundtable, parseMemory, parseSplitThought, parseSummary } from "./schema";
import { BREAKDOWN_MAX, BUBBLE_MAX, REFRAME_MAX } from "./types";

const speech = (animal: string, text = "我在听。", mood = "gentle") => ({ animal, text, mood });
const allSpeeches = ANIMAL_CAST.map((a, i) => speech(a.id, `第 ${i + 1} 句`));

describe("圆桌响应守卫", () => {
  it("七只各一句就通过", () => {
    expect(parseRoundtable({ speeches: allSpeeches })).toEqual({ speeches: allSpeeches });
  });

  it("少一只、重复一只、多一个陌生动物都不通过", () => {
    expect(parseRoundtable({ speeches: allSpeeches.slice(0, 6) })).toBeNull();
    expect(parseRoundtable({ speeches: [allSpeeches[0], ...allSpeeches.slice(0, 6)] })).toBeNull();
    expect(parseRoundtable({ speeches: [...allSpeeches.slice(0, 6), speech("dragon")] })).toBeNull();
  });

  it("mood 必须是六个里的一个", () => {
    const good = ANIMAL_CAST.map((a) => speech(a.id, "我在听。", "serious"));
    expect(parseRoundtable({ speeches: good })).not.toBeNull();
    expect(parseRoundtable({ speeches: ANIMAL_CAST.map((a) => speech(a.id, "我在听。", "angry")) })).toBeNull();
  });

  it("空话、超长、非字符串都不通过", () => {
    expect(parseRoundtable({ speeches: allSpeeches.map((s, i) => (i === 0 ? { ...s, text: "  " } : s)) })).toBeNull();
    expect(parseRoundtable({ speeches: allSpeeches.map((s, i) => (i === 0 ? { ...s, text: "好".repeat(SPEECH_MAX + 1) } : s)) })).toBeNull();
    expect(parseRoundtable({ speeches: allSpeeches.map((s, i) => (i === 0 ? { ...s, text: 1 } : s)) })).toBeNull();
  });

  it("多余的字段、缺字段、根本不是对象都不通过", () => {
    expect(parseRoundtable({ speeches: allSpeeches, extra: 1 })).toBeNull();
    expect(parseRoundtable({ speeches: allSpeeches.map((s, i) => (i === 0 ? { animal: "owl", text: "好" } : s)) })).toBeNull();
    expect(parseRoundtable({ speeches: allSpeeches.map((s, i) => (i === 0 ? { ...s, note: "嘿嘿" } : s)) })).toBeNull();
    expect(parseRoundtable(null)).toBeNull();
    expect(parseRoundtable("speeches")).toBeNull();
    expect(parseRoundtable({})).toBeNull();
  });
});

describe("古树总结守卫", () => {
  const summary = {
    heard: "你说了他两天没回消息，这件事压得你很沉。",
    voices: [{ animal: "owl", point: "分清事实和猜测" }, { animal: "bear", point: "先照顾自己" }],
    thought: "他的沉默不等于你的答案。",
    nextStep: "今天先给自己泡杯热的。",
    question: "如果这句话成立，你今晚想怎么对自己？",
  };

  it("五段齐全就通过", () => {
    expect(parseSummary(summary)).toEqual(summary);
  });

  it("缺一段、voices 为空、字数超限都不通过", () => {
    expect(parseSummary({ ...summary, question: undefined })).toBeNull();
    expect(parseSummary({ ...summary, voices: [] })).toBeNull();
    expect(parseSummary({ ...summary, heard: "好".repeat(HEARD_MAX + 1) })).toBeNull();
    expect(parseSummary({ ...summary, voices: [{ animal: "owl", point: "好".repeat(VOICE_MAX + 1) }] })).toBeNull();
    expect(parseSummary({ ...summary, question: "好".repeat(SUMMARY_TOTAL_MAX) })).toBeNull();
  });

  it("voices 里的动物必须是七只之一", () => {
    expect(parseSummary({ ...summary, voices: [{ animal: "dragon", point: "看看" }] })).toBeNull();
  });
});

describe("追问守卫", () => {
  it("古树或七只动物都能当说话的人", () => {
    expect(parseReply({ speaker: "tree", text: "我在。" })).toEqual({ speaker: "tree", text: "我在。" });
    expect(parseReply({ speaker: "otter", text: "那就先漂一会儿。" })).not.toBeNull();
    expect(parseReply({ speaker: "dragon", text: "我在。" })).toBeNull();
  });

  it("空话与超过 150 字的都不通过", () => {
    expect(parseReply({ speaker: "tree", text: " " })).toBeNull();
    expect(parseReply({ speaker: "tree", text: "好".repeat(REPLY_MAX + 1) })).toBeNull();
  });
});

describe("风险检测守卫", () => {
  it("三档通过，别的都不通过", () => {
    for (const risk of ["none", "concern", "crisis"]) expect(parseRisk({ risk })).toEqual({ risk });
    expect(parseRisk({ risk: "maybe" })).toBeNull();
    expect(parseRisk({ risk: null })).toBeNull();
    expect(parseRisk({})).toBeNull();
  });

  it("可以带一句理由，但不能超长", () => {
    expect(parseRisk({ risk: "crisis", reason: "提到了不想活" })).not.toBeNull();
    expect(parseRisk({ risk: "crisis", reason: "好".repeat(61) })).toBeNull();
  });
});
describe("小游戏的三份响应", () => {
  const bubbles = {
    bubbles: [
      { id: "b1", text: "他两天没回我消息", answer: "fact" },
      { id: "b2", text: "他一定讨厌我了", answer: "guess", trap: "mind-reading" },
    ],
  };

  it("拆一拆：1–5 片、id 不重复、answer 只有两种、trap 可省", () => {
    expect(parseSplitThought(bubbles)).toEqual(bubbles);
    expect(parseSplitThought({ bubbles: [{ id: "b1", text: "就一句", answer: "guess" }] })).not.toBeNull();
  });

  it("拆一拆：形状不对一律不通过", () => {
    expect(parseSplitThought(null)).toBeNull();
    expect(parseSplitThought({ bubbles: [] })).toBeNull();
    expect(parseSplitThought({ bubbles: Array.from({ length: BUBBLE_MAX + 1 }, (_v, i) => ({ id: "b" + String(i), text: "一句", answer: "fact" })) })).toBeNull();
    expect(parseSplitThought({ bubbles: [{ id: "b1", text: "", answer: "fact" }] })).toBeNull();
    expect(parseSplitThought({ bubbles: [{ id: "b1", text: "一句", answer: "maybe" }] })).toBeNull();
    expect(parseSplitThought({ bubbles: [{ id: "b1", text: "一句", answer: "guess", trap: "算命" }] })).toBeNull();
    expect(parseSplitThought({ bubbles: [{ id: "b1", text: "一句", answer: "guess", mood: "gentle" }] })).toBeNull();
    expect(parseSplitThought({ bubbles: [{ id: "b1", text: "一句", answer: "fact" }, { id: "b1", text: "又一句", answer: "guess" }] })).toBeNull();
    expect(parseSplitThought({ bubbles: [{ text: "一句", answer: "fact" }] })).toBeNull();
  });

  it("翻面镜：三种说法各一条，不重不漏", () => {
    const versions = { versions: [{ kind: "humor", text: "就当练手" }, { kind: "warm", text: "你已经很努力了" }, { kind: "realistic", text: "这次汇报有几个地方没讲清" }] };
    expect(parseReframe(versions)).toEqual(versions);
    expect(parseReframe({ versions: [{ kind: "humor", text: "a" }, { kind: "warm", text: "b" }] })).toBeNull();
    expect(parseReframe({ versions: [{ kind: "humor", text: "a" }, { kind: "humor", text: "b" }, { kind: "warm", text: "c" }] })).toBeNull();
    expect(parseReframe({ versions: [{ kind: "搞笑", text: "a" }, { kind: "warm", text: "b" }, { kind: "realistic", text: "c" }] })).toBeNull();
    expect(parseReframe({ versions: [{ kind: "humor", text: "啊".repeat(REFRAME_MAX + 1) }, { kind: "warm", text: "b" }, { kind: "realistic", text: "c" }] })).toBeNull();
    expect(parseReframe({ versions: [{ kind: "humor", text: "a", extra: 1 }, { kind: "warm", text: "b" }, { kind: "realistic", text: "c" }] })).toBeNull();
  });

  it("藏坚果：3–5 步，每步 1–60 字", () => {
    const steps = { steps: ["先把开头两句写下来", "给他发一条消息", "设个闹钟提醒自己"] };
    expect(parseBreakDown(steps)).toEqual(steps);
    expect(parseBreakDown({ steps: ["一步", "两步"] })).toBeNull();
    expect(parseBreakDown({ steps: ["一", "二", "三", "四", "五", "六"] })).toBeNull();
    expect(parseBreakDown({ steps: ["一", "", "三"] })).toBeNull();
    expect(parseBreakDown({ steps: ["一", "二", "啊".repeat(BREAKDOWN_MAX + 1)] })).toBeNull();
    expect(parseBreakDown({ steps: ["一", "二", 3] })).toBeNull();
  });
});
describe("沉淀：成长卡片", () => {
  const draft = {
    title: "汇报搞砸了",
    summary: "一次汇报没做好，被自己判成了整个人不行。",
    emotions: ["委屈", "疲惫"],
    themes: ["工作压力"],
    coreBelief: "汇报失败就是我这个人不行",
    shift: { from: "我整个人不行", to: "一次没做好" },
    insight: "我可以做得不好，也还是我。",
    action: "明天先写三行提纲",
  };

  it("该有的都有就通过", () => {
    expect(parseMemory(draft)).toEqual(draft);
  });

  it("多一个字段、标题超 12 字、转变超过 20 字、没有情绪都不通过", () => {
    expect(parseMemory({ ...draft, extra: 1 })).toBeNull();
    expect(parseMemory({ ...draft, title: "一二三四五六七八九十十一十二十三" })).toBeNull();
    expect(parseMemory({ ...draft, shift: { from: "一二三四五六七八九十十一十二十三十四十五十六十七十八十九二十二十一", to: "一次没做好" } })).toBeNull();
    expect(parseMemory({ ...draft, emotions: [] })).toBeNull();
  });

  it("标签只留库里的；不在库里就退回「其他」", () => {
    expect(parseMemory({ ...draft, themes: ["瞎编的", "工作压力"] })).toEqual({ ...draft, themes: ["工作压力"] });
    expect(parseMemory({ ...draft, themes: ["瞎编的"] })).toEqual({ ...draft, themes: ["其他"] });
  });

  it("没有小行动也行", () => {
    const { action, ...rest } = draft;
    expect(parseMemory(rest)).toEqual(rest);
    expect(action).toBe("明天先写三行提纲");
  });
});
