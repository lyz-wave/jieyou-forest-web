import { describe, expect, it, vi } from "vitest";
import { createHttpAI, type FetchLike } from "./http";
import { AI_FAILURE_LINE } from "./types";

interface Call {
  url: string;
  init: RequestInit;
}

function stubFetch(payload: unknown, status = 200) {
  const calls: Call[] = [];
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const ok = status >= 200 && status < 300;
    return { ok, status, json: async () => ({ ok, data: payload }) } as unknown as Response;
  });
  return { calls, fetchFn: fetchFn as unknown as FetchLike };
}

const BUBBLES = { bubbles: [{ id: "b1", text: "他两天没回我消息", answer: "fact" }] };
const VERSIONS = {
  versions: [
    { kind: "humor", text: "就当练手" },
    { kind: "warm", text: "你已经很努力了" },
    { kind: "realistic", text: "这次有几个地方没讲清" },
  ],
};
const STEPS = { steps: ["先把开头两句写下来", "给他发一条消息", "设个闹钟提醒自己"] };

describe("走服务端的森林 AI", () => {
  it("三件事各自打自己的接口，服务端给什么就用什么", async () => {
    const split = stubFetch(BUBBLES);
    const bubbles = await createHttpAI({ fetch: split.fetchFn }).splitThought("他两天没回我消息，他一定讨厌我了");
    expect(bubbles).toEqual(BUBBLES);
    expect(split.calls[0].url).toBe("/api/split-thought");
    expect(split.calls[0].init.method).toBe("POST");
    expect(split.calls[0].init.body).toBe(JSON.stringify({ text: "他两天没回我消息，他一定讨厌我了" }));

    const reframe = stubFetch(VERSIONS);
    await expect(createHttpAI({ fetch: reframe.fetchFn }).reframe("我这次汇报搞砸了")).resolves.toEqual(VERSIONS);
    expect(reframe.calls[0].url).toBe("/api/reframe");

    const steps = stubFetch(STEPS);
    await expect(createHttpAI({ fetch: steps.fetchFn }).breakDown("我怕明天的汇报")).resolves.toEqual(STEPS);
    expect(steps.calls[0].url).toBe("/api/break-down");
  });

  it("取消信号原样交给 fetch", async () => {
    const { calls, fetchFn } = stubFetch(STEPS);
    const controller = new AbortController();
    await createHttpAI({ fetch: fetchFn }).breakDown("我怕明天的汇报", { signal: controller.signal });
    expect(calls[0].init.signal).toBe(controller.signal);
  });

  it("服务端说不行，或者根本没连上，都给同一句人话", async () => {
    for (const status of [400, 502, 503]) {
      const { fetchFn } = stubFetch({ ok: false, reason: "upstream" }, status);
      const failed = createHttpAI({ fetch: fetchFn }).breakDown("我怕明天的汇报");
      await expect(failed).rejects.toThrow(AI_FAILURE_LINE);
      await expect(failed).rejects.not.toThrow("upstream");
    }

    const offline: FetchLike = async () => {
      throw new TypeError("Failed to fetch");
    };
    await expect(createHttpAI({ fetch: offline }).breakDown("我怕明天的汇报")).rejects.toThrow(AI_FAILURE_LINE);
  });

  it("服务端给的形状不对，也算这一趟没听清", async () => {
    const { fetchFn } = stubFetch({ nope: true });
    await expect(createHttpAI({ fetch: fetchFn }).splitThought("他两天没回我消息")).rejects.toThrow(AI_FAILURE_LINE);
    await expect(createHttpAI({ fetch: fetchFn }).reframe("我这次汇报搞砸了")).rejects.toThrow(AI_FAILURE_LINE);
    await expect(createHttpAI({ fetch: fetchFn }).breakDown("我怕明天的汇报")).rejects.toThrow(AI_FAILURE_LINE);
  });

  it("开发模式打开模拟失败：一次请求都不发", async () => {
    const { calls, fetchFn } = stubFetch(STEPS);
    const ai = createHttpAI({ fetch: fetchFn, shouldFail: () => true });
    await expect(ai.breakDown("我怕明天的汇报")).rejects.toThrow(AI_FAILURE_LINE);
    expect(calls.length).toBe(0);
  });

  it("是自己取消的，就把取消原样抛出去，不换成那句话", async () => {
    const abort = new Error("请求已取消");
    abort.name = "AbortError";
    const cancelled: FetchLike = async () => {
      throw abort;
    };
    const failed = createHttpAI({ fetch: cancelled }).breakDown("我怕明天的汇报");
    await expect(failed).rejects.toThrow("请求已取消");
    await expect(failed).rejects.toHaveProperty("name", "AbortError");
  });
});