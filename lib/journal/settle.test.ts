import { describe, expect, it } from "vitest";
import type { MemoryDraft, Message } from "./types";
import { helpfulAnimalsOf, localDate, memoryFromDraft, messagesFromTalk, sessionFromTalk } from "./settle";

const TALK = {
  startedAt: 1_700_000_000_000,
  text: "这次汇报我觉得搞砸了。",
  speeches: [
    { speaker: "fox" as const, text: "汇报只是一次汇报，不等于你这个人。" },
    { speaker: "owl" as const, text: "事实和猜测可以分开看。" },
  ],
  summary: "我听见你说，你觉得这次汇报毁了一切。",
  replies: [{ speaker: "tree" as const, text: "你想先做哪一件？" }],
  marked: ["owl" as const],
};

describe("对话转成消息", () => {
  it("原话、七只的发言、古树总结、追问按顺序排好，时间递增", () => {
    const messages = messagesFromTalk(TALK);
    expect(messages.map((m) => m.speaker)).toEqual(["user", "fox", "owl", "tree", "tree"]);
    expect(messages.map((m) => m.id)).toEqual(["m-0", "m-1", "m-2", "m-3", "m-4"]);
    expect(messages[0].content).toBe(TALK.text);
    expect(messages[3].content).toBe(TALK.summary);
    expect(messages[4].content).toBe("你想先做哪一件？");
    const times = messages.map((m) => m.createdAt);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("点过「说到心里了」的那只标上 resonated", () => {
    const messages = messagesFromTalk(TALK);
    expect(messages[2].resonated).toBe(true);
    expect(messages[1].resonated ?? false).toBe(false);
  });

  it("没有总结、没有追问时不留空消息", () => {
    expect(messagesFromTalk({ ...TALK, summary: null, replies: [], marked: [] })).toHaveLength(3);
  });
});

describe("帮助最大的动物", () => {
  it("只算被标过的七只，按出现顺序去重", () => {
    const messages: Message[] = [
      { id: "m-0", speaker: "user", content: "嗯", createdAt: 1 },
      { id: "m-1", speaker: "owl", content: "a", resonated: true, createdAt: 2 },
      { id: "m-2", speaker: "tree", content: "b", resonated: true, createdAt: 3 },
      { id: "m-3", speaker: "owl", content: "c", resonated: true, createdAt: 4 },
      { id: "m-4", speaker: "bear", content: "d", resonated: true, createdAt: 5 },
      { id: "m-5", speaker: "fox", content: "e", createdAt: 6 },
    ];
    expect(helpfulAnimalsOf(messages)).toEqual(["owl", "bear"]);
  });
});

describe("成长卡片", () => {
  const draft: MemoryDraft = {
    title: "汇报搞砸了",
    summary: "一次汇报没做好，被自己判成了整个人不行。",
    emotions: ["委屈", "疲惫"],
    themes: ["工作压力"],
    coreBelief: "汇报失败就是我这个人不行",
    shift: { from: "我整个人不行", to: "一次没做好" },
    insight: "我可以做得不好，也还是我。",
    action: "明天先写三行提纲",
  };

  it("补上 id、日期、帮助最大的动物与心情变化", () => {
    const memory = memoryFromDraft({ draft, sessionId: "s-1", date: "2026-03-05", helpfulAnimals: ["owl"], moodBefore: 4, moodAfter: 7 });
    expect(memory.id).toBe("mem-s-1");
    expect(memory.sessionId).toBe("s-1");
    expect(memory.date).toBe("2026-03-05");
    expect(memory.helpfulAnimals).toEqual(["owl"]);
    expect(memory.moodBefore).toBe(4);
    expect(memory.moodAfter).toBe(7);
    expect(memory.title).toBe("汇报搞砸了");
  });

  it("标签只留库里的，没有就说「其他」", () => {
    const memory = memoryFromDraft({ draft: { ...draft, themes: ["瞎编的"] }, sessionId: "s-1", date: "2026-03-05", helpfulAnimals: [] });
    expect(memory.themes).toEqual(["其他"]);
  });
});

describe("会话", () => {
  it("结起来时记下状态、结束时间、心情变化与消息", () => {
    const session = sessionFromTalk({
      id: "s-1",
      startedAt: 1,
      endedAt: 2,
      status: "resolved",
      companion: "owl",
      moodBefore: 4,
      moodAfter: 7,
      gameContext: ["【熊抱】和团团抱了 2 秒"],
      messages: messagesFromTalk(TALK),
    });
    expect(session.status).toBe("resolved");
    expect(session.endedAt).toBe(2);
    expect(session.moodAfter).toBe(7);
    expect(session.messages).toHaveLength(5);
    expect(session.matchedMemoryIds).toEqual([]);
  });
});

describe("本地日期", () => {
  it("按本机时区算，不用 UTC", () => {
    expect(localDate(new Date(2026, 2, 5, 23, 30))).toBe("2026-03-05");
    expect(localDate(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });
});
