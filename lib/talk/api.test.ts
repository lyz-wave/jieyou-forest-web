import { describe, expect, it, vi } from "vitest";
import { ANIMAL_CAST } from "@/lib/animals";
import { AI_FAILURE_LINE } from "@/lib/ai/types";
import type { Speech } from "@/lib/ai/schema";
import type { PromptContext } from "@/lib/prompts";
import { createTalkApi } from "./api";

interface Call {
  url: string;
  init: RequestInit;
}

function stub(payload: unknown, status = 200) {
  const calls: Call[] = [];
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const ok = status >= 200 && status < 300;
    return { ok, status, json: async () => ({ ok, data: payload }) } as unknown as Response;
  });
  return { calls, fetchFn };
}

const SPEECHES = ANIMAL_CAST.map((a, i) => ({ animal: a.id, text: "第" + (i + 1) + "句", mood: "gentle" })) as Speech[];
const SUMMARY = {
  heard: "我听见你说这两天很累",
  voices: [
    { animal: "owl" as const, point: "事实和猜测分开看" },
    { animal: "bear" as const, point: "先对自己好一点" },
  ],
  thought: "累了就先歇一歇",
  nextStep: "今晚早点睡",
  question: "你愿意先做哪一件？",
};

const CONTEXT: PromptContext = { nickname: "小满", companion: "owl", text: "他两天没回我消息" };

describe("倾诉要的四件事", () => {
  it("各自打自己的接口，回话照原样交给界面", async () => {
    const round = stub({ speeches: SPEECHES });
    const api = createTalkApi({ fetch: round.fetchFn });
    await expect(api.roundtable(CONTEXT)).resolves.toEqual({ speeches: SPEECHES });
    expect(round.calls[0].url).toBe("/api/roundtable");
    expect(JSON.parse(String(round.calls[0].init.body))).toEqual(CONTEXT);

    const sum = stub(SUMMARY);
    await expect(createTalkApi({ fetch: sum.fetchFn }).summary(CONTEXT)).resolves.toEqual(SUMMARY);
    expect(sum.calls[0].url).toBe("/api/summary");

    const reply = stub({ speaker: "owl", text: "我在" });
    await expect(createTalkApi({ fetch: reply.fetchFn }).reply(CONTEXT, "owl")).resolves.toEqual({
      speaker: "owl",
      text: "我在",
    });
    expect(reply.calls[0].url).toBe("/api/reply");
    expect(JSON.parse(String(reply.calls[0].init.body))).toEqual({ ...CONTEXT, target: "owl" });

    const risk = stub({ risk: "concern", reason: "说到撑不住" });
    await expect(createTalkApi({ fetch: risk.fetchFn }).risk("我撑不住了")).resolves.toEqual({
      risk: "concern",
      reason: "说到撑不住",
    });
    expect(risk.calls[0].url).toBe("/api/risk");
    expect(JSON.parse(String(risk.calls[0].init.body))).toEqual({ text: "我撑不住了" });
  });

  it("服务端说不行、形状不对、连不上，都是同一句降级话", async () => {
    const down = stub({ ok: false, reason: "upstream" }, 502);
    await expect(createTalkApi({ fetch: down.fetchFn }).roundtable(CONTEXT)).rejects.toThrow(AI_FAILURE_LINE);

    const weird = stub({ nope: true });
    await expect(createTalkApi({ fetch: weird.fetchFn }).summary(CONTEXT)).rejects.toThrow(AI_FAILURE_LINE);

    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(createTalkApi({ fetch: offline }).risk("我撑不住了")).rejects.toThrow(AI_FAILURE_LINE);
  });
});