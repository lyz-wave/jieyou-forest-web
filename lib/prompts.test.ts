import { describe, expect, it } from "vitest";
import { ANIMALS, ANIMAL_CAST } from "@/lib/animals";
import { HISTORY_MAX, breakDownPrompt, memoryPrompt, reframePrompt, replyPrompt, riskPrompt, roundtablePrompt, splitThoughtPrompt, summaryPrompt } from "./prompts";

const context = {
  nickname: "小满",
  companion: "fox" as const,
  text: "他两天没回我消息，他一定讨厌我了",
  moodBefore: 3,
  gameContext: ["【敲树洞】此刻的情绪：委屈、疲惫"],
  memories: ["去年五月说过和同事的误会"],
  history: [{ speaker: "tree" as const, content: "我在听。" }],
};

describe("圆桌 Prompt", () => {
  it("带上这一次的昵称、伙伴、原话、心情、小游戏上下文和记忆", () => {
    const prompt = roundtablePrompt(context);
    expect(prompt.user).toContain("小满");
    expect(prompt.user).toContain(ANIMALS.fox.name);
    expect(prompt.user).toContain(context.text);
    expect(prompt.user).toContain("3");
    expect(prompt.user).toContain("委屈、疲惫");
    expect(prompt.user).toContain("去年五月说过和同事的误会");
    expect(prompt.user).toContain("我在听。");
  });

  it("没有小游戏上下文和记忆时不写空标签", () => {
    const prompt = roundtablePrompt({ ...context, gameContext: [], memories: [], history: [] });
    expect(prompt.user).not.toContain("小游戏留下的");
    expect(prompt.user).not.toContain("以前说过");
    expect(prompt.user).not.toContain("对话记录");
  });

  it("写清每只动物的规矩：伙伴先说、每段不超过 80 字、先共情、不说教、动作放括号", () => {
    const prompt = roundtablePrompt(context);
    expect(prompt.system).toContain("第一个发言");
    expect(prompt.system).toContain("80 字");
    expect(prompt.system).toContain("先共情");
    expect(prompt.system).toContain("不说教");
    expect(prompt.system).toContain("首先");
    expect(prompt.system).toContain("括号");
    expect(prompt.system).toContain("万能");
  });

  it("把七只动物各自的思维方式写进 system，模型才知道谁是谁", () => {
    const prompt = roundtablePrompt(context);
    for (const animal of ANIMAL_CAST) {
      expect(prompt.system).toContain(animal.name);
      expect(prompt.system).toContain(animal.mindset);
    }
  });

  it("写清输出形状与 mood 的六个取值", () => {
    const prompt = roundtablePrompt(context);
    expect(prompt.system).toContain("speeches");
    expect(prompt.system).toContain("animal");
    expect(prompt.system).toContain("text");
    expect(prompt.system).toContain("mood");
    for (const mood of ["gentle", "thinking", "playful", "excited", "calm", "serious"]) {
      expect(prompt.system).toContain(mood);
    }
    expect(prompt.system).toContain("JSON");
  });

  it("对话记录只带最近若干条，越长越贵的那部分不留着", () => {
    const history = Array.from({ length: HISTORY_MAX + 5 }, (_, i) => ({ speaker: "user" as const, content: `第 ${i} 句` }));
    const prompt = roundtablePrompt({ ...context, history });
    expect(prompt.user).not.toContain("第 0 句");
    expect(prompt.user).toContain(`第 ${HISTORY_MAX + 4} 句`);
  });
});

describe("古树总结 Prompt", () => {
  it("五段结构与四档植物意象都写清", () => {
    const prompt = summaryPrompt(context);
    expect(prompt.system).toContain("我听到了");
    expect(prompt.system).toContain("森林的声音");
    expect(prompt.system).toContain("一个可以带走的念头");
    expect(prompt.system).toContain("一个小小的下一步");
    expect(prompt.system).toContain("开放式问题");
    for (const image of ["草", "叶", "树", "苗"]) expect(prompt.system).toContain(image);
    expect(prompt.system).toContain("200 字");
  });

  it("写清输出字段", () => {
    const prompt = summaryPrompt(context);
    for (const key of ["heard", "voices", "thought", "nextStep", "question"]) expect(prompt.system).toContain(key);
  });
});

describe("追问 Prompt", () => {
  it("默认由古树回答，指定动物时换成那只动物", () => {
    expect(replyPrompt({ ...context, target: "tree" }).system).toContain(ANIMALS.tree.name);
    const owl = replyPrompt({ ...context, target: "owl" });
    expect(owl.system).toContain(ANIMALS.owl.name);
    expect(owl.system).toContain(ANIMALS.owl.mindset);
  });

  it("限长 150 字，并说清 @ 指定动物的用法", () => {
    const prompt = replyPrompt({ ...context, target: "tree" });
    expect(prompt.system).toContain("150 字");
    expect(prompt.system).toContain("@");
  });
});

describe("风险检测 Prompt", () => {
  it("宁可多报也不漏报，输出三档", () => {
    const prompt = riskPrompt("我不想活了");
    expect(prompt.system).toContain("宁可多报");
    expect(prompt.system).toContain("漏报");
    for (const level of ["none", "concern", "crisis"]) expect(prompt.system).toContain(level);
    expect(prompt.user).toContain("我不想活了");
  });
});

describe("确定性", () => {
  it("同样的上下文生成同样的 Prompt", () => {
    expect(roundtablePrompt(context)).toEqual(roundtablePrompt(context));
    expect(summaryPrompt(context)).toEqual(summaryPrompt(context));
  });
});
describe("小游戏的 Prompt", () => {
  it("事实还是猜测：只拆句子，标出事实与猜测，猜测再标陷阱", () => {
    const prompt = splitThoughtPrompt("他两天没回我消息，他一定讨厌我了");
    expect(prompt.user).toContain("他两天没回我消息，他一定讨厌我了");
    for (const key of ["bubbles", "fact", "guess", "trap"]) expect(prompt.system).toContain(key);
    expect(prompt.system).toContain("不要改写");
    expect(prompt.system).toContain("1");
  });

  it("翻面镜：三种说法，每种不超过 60 字", () => {
    const prompt = reframePrompt("我这次汇报搞砸了，我就是不行");
    expect(prompt.user).toContain("我这次汇报搞砸了，我就是不行");
    for (const key of ["versions", "humor", "warm", "realistic"]) expect(prompt.system).toContain(key);
    expect(prompt.system).toContain("60");
  });

  it("藏坚果：3–5 步，每步今天就能做", () => {
    const prompt = breakDownPrompt("我怕明天的汇报");
    expect(prompt.user).toContain("我怕明天的汇报");
    expect(prompt.system).toContain("steps");
    expect(prompt.system).toContain("3");
    expect(prompt.system).toContain("5");
    expect(prompt.system).toContain("今天");
  });
});

describe("concern 写进总结", () => {
  it("风险检测记了一笔时，古树要多写一句找真人支持", () => {
    const withConcern = summaryPrompt({ nickname: "小满", companion: "fox", text: "我最近真的很绝望。", concern: true });
    expect(withConcern.system).toContain("真人");
    const plain = summaryPrompt({ nickname: "小满", companion: "fox", text: "他两天没回我消息。" });
    expect(plain.system).not.toContain("更沉");
  });
});

describe("语气（第四节那一列）", () => {
  it("圆桌把每只动物各自的语气也写进去", () => {
    const prompt = roundtablePrompt(context);
    for (const animal of ANIMAL_CAST) {
      expect(prompt.system).toContain(animal.tone);
    }
  });

  it("追问时按那只动物的语气说话，古树也一样", () => {
    expect(replyPrompt({ ...context, target: "owl" }).system).toContain(ANIMALS.owl.tone);
    expect(replyPrompt({ ...context, target: "tree" }).system).toContain(ANIMALS.tree.tone);
  });
});

describe("记忆沉淀 Prompt", () => {
  const talk = {
    nickname: "小满",
    companion: "owl" as const,
    text: "这次汇报我觉得搞砸了。",
    moodBefore: 4,
    moodAfter: 7,
    history: [
      { speaker: "user" as const, content: "这次汇报我觉得搞砸了。" },
      { speaker: "owl" as const, content: "事实和猜测可以分开看。" },
    ],
  };

  it("带上整段对话与心情变化", () => {
    const prompt = memoryPrompt(talk);
    expect(prompt.user).toContain("这次汇报我觉得搞砸了。");
    expect(prompt.user).toContain("事实和猜测可以分开看。");
    expect(prompt.user).toContain("4");
    expect(prompt.user).toContain("7");
  });

  it("规矩：第一人称、字数上限、标签只能从库里挑、只输出 JSON", () => {
    const prompt = memoryPrompt(talk);
    expect(prompt.system).toContain("第一人称");
    expect(prompt.system).toContain("12");
    expect(prompt.system).toContain("20");
    expect(prompt.system).toContain("工作压力");
    expect(prompt.system).toContain("其他");
    expect(prompt.system).toContain("不要 Markdown");
    for (const key of ["title", "summary", "emotions", "themes", "coreBelief", "shift", "insight", "action"]) {
      expect(prompt.system).toContain(key);
    }
  });
});
