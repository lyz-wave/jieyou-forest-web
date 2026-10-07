import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AiOptions } from "@/lib/ai/types";
import { useAiRequest } from "./useAiRequest";

describe("AI 请求状态", () => {
  it("跑一次请求：思考中 → 拿到结果", async () => {
    const call = vi.fn(async (text: string) => "回：" + text);
    const { result } = renderHook(() => useAiRequest(call));

    expect(result.current.status).toBe("idle");
    await act(async () => {
      await result.current.run("你好");
    });
    expect(call).toHaveBeenCalledWith("你好", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(result.current.status).toBe("ready");
    expect(result.current.result).toBe("回：你好");
    expect(result.current.error).toBeNull();
  });

  it("失败时留下错误，重试复用上一次的输入", async () => {
    const call = vi
      .fn<(text: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("风太大了"))
      .mockResolvedValueOnce("这回听清了");
    const { result } = renderHook(() => useAiRequest(call));

    await act(async () => {
      await result.current.run("我怕明天的汇报");
    });
    expect(result.current.status).toBe("failed");
    expect(result.current.error?.message).toBe("风太大了");

    await act(async () => {
      await result.current.retry();
    });
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[1][0]).toBe("我怕明天的汇报");
    expect(result.current.status).toBe("ready");
    expect(result.current.result).toBe("这回听清了");
    expect(result.current.error).toBeNull();
  });

  it("等待中重复提交会被忽略（只发一次请求）", async () => {
    let release: (value: string) => void = () => {};
    const call = vi.fn((text: string) => {
      void text;
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    });
    const { result } = renderHook(() => useAiRequest(call));

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.run("第一次");
    });
    expect(result.current.status).toBe("thinking");
    await act(async () => {
      await result.current.run("第二次");
    });
    expect(call).toHaveBeenCalledTimes(1);
    expect(call.mock.calls[0][0]).toBe("第一次");

    await act(async () => {
      release("好了");
      await first;
    });
    expect(result.current.status).toBe("ready");
  });

  it("reset 回到未开始的样子", async () => {
    const call = vi.fn(async (text: string) => {
      void text;
      return "结果";
    });
    const { result } = renderHook(() => useAiRequest(call));
    await act(async () => {
      await result.current.run("你好");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("还没拿到结果就离开时中止请求", async () => {
    const call = vi.fn((_text: string, options: AiOptions) =>
      new Promise<string>((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    );
    const { result, unmount } = renderHook(() => useAiRequest(call));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.run("还在想");
    });
    const signal = call.mock.calls[0][1].signal;
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      await pending.catch(() => undefined);
    });
  });
});
