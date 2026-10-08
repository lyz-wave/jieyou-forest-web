import { cleanup, renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RiskResult, RoundtableResult, TreeSummary } from "@/lib/ai/schema";
import { useForestStore } from "@/lib/stores/forest";
import { useTalkStore } from "@/lib/stores/talk";

afterEach(cleanup);

const api = vi.hoisted(() => ({
  roundtable: vi.fn<(context: unknown) => Promise<RoundtableResult>>(),
  summary: vi.fn<(context: unknown) => Promise<TreeSummary>>(),
  reply: vi.fn<(context: unknown, target: unknown) => Promise<{ speaker: string; text: string }>>(),
  risk: vi.fn<(text: string) => Promise<RiskResult>>(),
}));

vi.mock("@/lib/talk/client", () => ({ talkApi: api }));

import { useTalkFlow } from "./useTalkFlow";

const SPEECHES: RoundtableResult = {
  speeches: [
    { animal: "owl", text: "事实和猜测可以分开看。", mood: "thinking" },
    { animal: "bear", text: "先对自己好一点。", mood: "gentle" },
  ],
};

const SUMMARY: TreeSummary = {
  heard: "我听见你说，汇报搞砸了。",
  voices: [{ animal: "owl", point: "分开看" }, { animal: "bear", point: "对自己好一点" }],
  thought: "一次汇报不等于你这个人。",
  nextStep: "明天先写三行提纲。",
  question: "如果朋友搞砸了，你会怎么说他？",
};

beforeEach(() => {
  vi.clearAllMocks();
  useForestStore.setState({ companion: "fox" });
  useTalkStore.getState().finish();
  api.roundtable.mockResolvedValue(SPEECHES);
  api.summary.mockResolvedValue(SUMMARY);
  api.reply.mockResolvedValue({ speaker: "owl", text: "那我们先分一分。" });
  api.risk.mockResolvedValue({ risk: "none" });
});

describe("一次倾诉的来去", () => {
  it("提交后先聆听，每句都问一次风险检测，七只的发言到了就按顺序排好", async () => {
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("这次汇报我觉得搞砸了。");
    });
    expect(useTalkStore.getState().phase).toBe("listening");
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    expect(useTalkStore.getState().speeches.map((s) => s.animal)).toEqual(["owl", "bear"]);
    expect(api.risk).toHaveBeenCalledWith("这次汇报我觉得搞砸了。");
    expect(result.current.roundStatus).toBe("idle");
  });

  it("说了很沉但没到危险的话：问一次服务端，它说没事就不打断", async () => {
    api.risk.mockResolvedValue({ risk: "none" });
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("我最近真的很绝望。");
    });
    await waitFor(() => {
      expect(api.risk).toHaveBeenCalledWith("我最近真的很绝望。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
  });

  it("服务端判危险时先停在守护页，不请七只说话", async () => {
    api.risk.mockResolvedValue({ risk: "crisis", reason: "提到了不想活" });
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("我觉得我撑不住了。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("risk");
    });
    expect(useTalkStore.getState().risk).toBe("crisis");
    expect(api.roundtable).not.toHaveBeenCalled();
    expect(useTalkStore.getState().speeches).toEqual([]);
  });

  it("服务端说 concern：照常圆桌，只在总结里记一笔", async () => {
    api.risk.mockResolvedValue({ risk: "concern", reason: "很沉" });
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("我最近真的很绝望。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    expect(useTalkStore.getState().concern).toBe(true);
  });

  it("说到不想活这类话：当场守护，不等服务端，也不请七只说话", async () => {
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("我不想活了。");
    });
    expect(useTalkStore.getState().phase).toBe("risk");
    expect(useTalkStore.getState().risk).toBe("crisis");
    expect(api.risk).not.toHaveBeenCalled();
    expect(api.roundtable).not.toHaveBeenCalled();
    act(() => {
      useTalkStore.getState().resume();
    });
    expect(useTalkStore.getState().phase).toBe("listening");
  });

  it("圆桌没接上：状态变成失败，写的话还在，能再来一次", async () => {
    api.roundtable.mockRejectedValueOnce(new Error("风太大了"));
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("我还是想不通。");
    });
    await waitFor(() => {
      expect(result.current.roundStatus).toBe("failed");
    });
    expect(useTalkStore.getState().text).toBe("我还是想不通。");
    expect(useTalkStore.getState().phase).toBe("roundtable");
    act(() => {
      result.current.retryRound();
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
  });

  it("总结拿到五段就进总结页", async () => {
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("这次汇报我觉得搞砸了。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    act(() => {
      result.current.summarize();
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("summary");
    });
    expect(useTalkStore.getState().summary?.heard).toBe(SUMMARY.heard);
    const context = api.summary.mock.calls[0][0] as { history: unknown[] };
    expect(context.history).toEqual([
      { speaker: "owl", content: "事实和猜测可以分开看。" },
      { speaker: "bear", content: "先对自己好一点。" },
    ]);
  });

  it("追问可以把话指名给某一只，回答进对话记录", async () => {
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("这次汇报我觉得搞砸了。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    act(() => {
      result.current.ask("@墨墨 那我要怎么跟领导说？");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().replies.length).toBe(1);
    });
    expect(api.reply.mock.calls[0][1]).toBe("owl");
    const context = api.reply.mock.calls[0][0] as { text: string };
    expect(context.text).toBe("那我要怎么跟领导说？");
    expect(useTalkStore.getState().replies[0]).toEqual({ speaker: "owl", text: "那我们先分一分。" });
  });

  it("追问没接上：失败状态可重试，重试用的是同一句", async () => {
    api.reply.mockRejectedValueOnce(new Error("风太大了"));
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("这次汇报我觉得搞砸了。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    act(() => {
      result.current.ask("那我要怎么跟领导说？");
    });
    await waitFor(() => {
      expect(result.current.replyStatus).toBe("failed");
    });
    act(() => {
      result.current.retryReply();
    });
    await waitFor(() => {
      expect(useTalkStore.getState().replies.length).toBe(1);
    });
    expect(api.reply.mock.calls[1][0]).toMatchObject({ text: "那我要怎么跟领导说？" });
  });

  it("让大家再说一轮：还在同一件事上，但要重新请七只说话", async () => {
    const { result } = renderHook(() => useTalkFlow());
    act(() => {
      result.current.speak("这次汇报我觉得搞砸了。");
    });
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    act(() => {
      result.current.again();
    });
    expect(useTalkStore.getState().phase).toBe("listening");
    await waitFor(() => {
      expect(useTalkStore.getState().phase).toBe("roundtable");
    });
    expect(api.roundtable).toHaveBeenCalledTimes(2);
  });
});