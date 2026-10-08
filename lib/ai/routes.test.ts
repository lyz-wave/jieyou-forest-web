import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANIMAL_CAST } from "@/lib/animals";
import { POST as breakDownPost } from "@/app/api/break-down/route";
import { POST as reframePost } from "@/app/api/reframe/route";
import { POST as replyPost } from "@/app/api/reply/route";
import { POST as splitThoughtPost } from "@/app/api/split-thought/route";
import { POST as riskPost } from "@/app/api/risk/route";
import { POST as roundtablePost } from "@/app/api/roundtable/route";
import { POST as memoryPost } from "@/app/api/memory/route";
import { POST as summaryPost } from "@/app/api/summary/route";
import type { ServerAi } from "./anthropic";
import type { Speech, TreeSummary } from "./schema";
import { __resetServerAIForTest, __setServerAIForTest } from "./server";

const context = { nickname: "小满", companion: "fox", text: "他两天没回我消息，他一定讨厌我了" };
const speeches: Speech[] = ANIMAL_CAST.map((animal) => ({ animal: animal.id, text: "我在。", mood: "gentle" }));
const summary: TreeSummary = {
  heard: "他两天没回消息，这件事压得你很沉。",
  voices: [{ animal: "owl", point: "分清事实和猜测" }, { animal: "bear", point: "先照顾自己" }],
  thought: "沉默不等于答案。",
  nextStep: "今天先泡杯热的。",
  question: "今晚想怎么对自己？",
};

function fakeAI(overrides: Partial<ServerAi> = {}): ServerAi {
  return {
    roundtable: async () => ({ speeches }),
    splitThought: async () => ({ bubbles: [{ id: "b1", text: "他两天没回我消息", answer: "fact" }] }),
    reframe: async () => ({ versions: [{ kind: "humor", text: "就当练手" }, { kind: "warm", text: "你已经很努力了" }, { kind: "realistic", text: "这次有几个地方没讲清" }] }),
    breakDown: async () => ({ steps: ["先把开头两句写下来", "给他发一条消息", "设个闹钟提醒自己"] }),
    summary: async () => summary,
    memory: async () => ({
      title: "汇报搞砸了",
      summary: "一次汇报没做好，被自己判成了整个人不行。",
      emotions: ["委屈"],
      themes: ["工作压力"],
      coreBelief: "汇报失败就是我这个人不行",
      shift: { from: "我整个人不行", to: "一次没做好" },
      insight: "我可以做得不好，也还是我。",
    }),
    reply: async () => ({ speaker: "tree", text: "我在听。" }),
    risk: async () => ({ risk: "none" }),
    ...overrides,
  };
}

/** 每个接口配一份合规入参：reply 必须有 target，risk 只收 text */
const BODIES = {
  "/api/roundtable": context,
  "/api/split-thought": { text: "他两天没回我消息，他一定讨厌我了" },
  "/api/reframe": { text: "我这次汇报搞砸了，我就是不行" },
  "/api/break-down": { text: "我怕明天的汇报" },
  "/api/summary": context,
  "/api/reply": { ...context, target: "tree" },
  "/api/risk": { text: "我不想活了" },
  "/api/memory": { ...context, moodAfter: 7 },
} as const;

const ROUTES = {
  "/api/roundtable": roundtablePost,
  "/api/split-thought": splitThoughtPost,
  "/api/reframe": reframePost,
  "/api/break-down": breakDownPost,
  "/api/summary": summaryPost,
  "/api/reply": replyPost,
  "/api/risk": riskPost,
  "/api/memory": memoryPost,
};

async function callRoute(url: keyof typeof ROUTES, body: unknown): Promise<{ status: number; payload: unknown }> {
  const request = new Request("http://localhost" + url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const response = await ROUTES[url](request);
  const payload: unknown = await response.json();
  return { status: response.status, payload };
}

describe("四个接口", () => {
  beforeEach(() => {
    __resetServerAIForTest();
  });

  afterEach(() => {
    __resetServerAIForTest();
    vi.restoreAllMocks();
  });

  it("拿到结果就原样给前端", async () => {
    __setServerAIForTest(fakeAI());
    expect(await callRoute("/api/roundtable", context)).toEqual({ status: 200, payload: { ok: true, data: { speeches } } });
    expect(await callRoute("/api/summary", context)).toEqual({ status: 200, payload: { ok: true, data: summary } });
    expect(await callRoute("/api/reply", { ...context, target: "owl" })).toEqual({
      status: 200,
      payload: { ok: true, data: { speaker: "tree", text: "我在听。" } },
    });
    expect(await callRoute("/api/risk", { text: "我不想活了" })).toEqual({ status: 200, payload: { ok: true, data: { risk: "none" } } });
    expect(await callRoute("/api/split-thought", { text: "他两天没回我消息" })).toEqual({
      status: 200,
      payload: { ok: true, data: { bubbles: [{ id: "b1", text: "他两天没回我消息", answer: "fact" }] } },
    });
    expect(await callRoute("/api/break-down", { text: "我怕明天的汇报" })).toEqual({
      status: 200,
      payload: { ok: true, data: { steps: ["先把开头两句写下来", "给他发一条消息", "设个闹钟提醒自己"] } },
    });
  });

  it("入参不合法给 400，而且一次都不问模型", async () => {
    const calls = { roundtable: 0, summary: 0, reply: 0, risk: 0 };
    __setServerAIForTest(
      fakeAI({
        roundtable: async () => { calls.roundtable += 1; return { speeches }; },
        summary: async () => { calls.summary += 1; return summary; },
        reply: async () => { calls.reply += 1; return { speaker: "tree", text: "我在听。" }; },
        risk: async () => { calls.risk += 1; return { risk: "none" }; },
      }),
    );
    for (const url of ["/api/roundtable", "/api/summary", "/api/reply", "/api/split-thought", "/api/reframe", "/api/break-down", "/api/memory"] as const) {
      expect(await callRoute(url, { ...context, text: "" })).toEqual({ status: 400, payload: { ok: false, reason: "invalid" } });
      expect(await callRoute(url, "这不是 JSON")).toEqual({ status: 400, payload: { ok: false, reason: "invalid" } });
    }
    expect(await callRoute("/api/risk", {})).toEqual({ status: 400, payload: { ok: false, reason: "invalid" } });
    expect(await callRoute("/api/reply", { ...context, target: "dragon" })).toEqual({ status: 400, payload: { ok: false, reason: "invalid" } });
    expect(calls).toEqual({ roundtable: 0, summary: 0, reply: 0, risk: 0 });
  });

  it("没配 Key 给 503，前端照降级文案处理", async () => {
    __setServerAIForTest(null);
    for (const [url, body] of Object.entries(BODIES) as [keyof typeof ROUTES, unknown][]) {
      expect(await callRoute(url, body)).toEqual({ status: 503, payload: { ok: false, reason: "unavailable" } });
    }
  });

  it("模型那边没给出合用的结果、或者调用直接抛错，都给 502", async () => {
    __setServerAIForTest(
      fakeAI({
        roundtable: async () => null,
        summary: async () => null,
        reply: async () => null,
        risk: async () => null,
        splitThought: async () => null,
        reframe: async () => null,
        breakDown: async () => null,
        memory: async () => null,
      }),
    );
    for (const [url, body] of Object.entries(BODIES) as [keyof typeof ROUTES, unknown][]) {
      expect(await callRoute(url, body)).toEqual({ status: 502, payload: { ok: false, reason: "upstream" } });
    }

    __setServerAIForTest(
      fakeAI({
        roundtable: async () => {
          throw new Error("上游炸了");
        },
      }),
    );
    expect(await callRoute("/api/roundtable", context)).toEqual({ status: 502, payload: { ok: false, reason: "upstream" } });
  });

  it("失败路径不写日志，用户写的话也不进日志", async () => {
    const spies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];
    __setServerAIForTest(fakeAI({ roundtable: async () => null }));
    await callRoute("/api/roundtable", { ...context, text: "我不想活了，这是个秘密" });
    __setServerAIForTest(null);
    await callRoute("/api/roundtable", context);
    await callRoute("/api/roundtable", { ...context, text: "" });
    __setServerAIForTest(
      fakeAI({
        roundtable: async () => {
          throw new Error("上游炸了");
        },
      }),
    );
    await callRoute("/api/roundtable", context);
    const printed = spies.flatMap((spy) => spy.mock.calls.flat()).join(" | ");
    expect(printed).not.toContain("我不想活了");
    expect(printed).not.toContain("秘密");
  });
});