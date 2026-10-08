import { afterEach, describe, expect, it, vi } from "vitest";
import { useDevStore } from "@/lib/stores/dev";
import { forestAI, getForestAI } from "./index";
import { AI_FAILURE_LINE } from "./types";

type FakeFetch = (input: string, init?: RequestInit) => Promise<Response>;

const STEPS = { steps: ["先把开头两句写下来", "给他发一条消息", "设个闹钟提醒自己"] };

describe("默认的森林 AI", () => {
  afterEach(() => {
    useDevStore.setState({ simulateAIFailure: false });
    vi.unstubAllGlobals();
  });

  it("开发模式打开模拟失败：一次请求都不发，直接给那句话", async () => {
    const fetchFn = vi.fn<FakeFetch>(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, data: STEPS }) }) as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);
    useDevStore.setState({ simulateAIFailure: true });

    await expect(forestAI.breakDown("明天要汇报")).rejects.toThrow(AI_FAILURE_LINE);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("没打开模拟失败：打的是自己的接口，服务端给什么就用什么", async () => {
    const fetchFn = vi.fn<FakeFetch>(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, data: STEPS }) }) as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const result = await forestAI.breakDown("明天要汇报");
    expect(result.steps).toEqual(STEPS.steps);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe("/api/break-down");
    expect(getForestAI()).toBe(forestAI);
  });

  it("服务端回 503（还没配 Key）：同样是那句人话", async () => {
    const fetchFn = vi.fn<FakeFetch>(async () => ({ ok: false, status: 503, json: async () => ({ ok: false, reason: "unavailable" }) }) as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    await expect(forestAI.breakDown("明天要汇报")).rejects.toThrow(AI_FAILURE_LINE);
  });
});
