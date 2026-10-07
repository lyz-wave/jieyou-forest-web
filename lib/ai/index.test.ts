import { afterEach, describe, expect, it, vi } from "vitest";
import { useDevStore } from "@/lib/stores/dev";
import { forestAI } from "./index";
import { AI_FAILURE_LINE } from "./types";

describe("默认的森林 AI", () => {
  afterEach(() => {
    useDevStore.setState({ simulateAIFailure: false });
    vi.useRealTimers();
  });

  it("跟着开发模式的「模拟 AI 失败」开关走", async () => {
    vi.useFakeTimers();
    useDevStore.setState({ simulateAIFailure: true });
    const failed = forestAI.breakDown("明天要汇报");
    const rejected = expect(failed).rejects.toThrow(AI_FAILURE_LINE);
    await vi.advanceTimersByTimeAsync(1300);
    await rejected;

    useDevStore.setState({ simulateAIFailure: false });
    const ok = forestAI.breakDown("明天要汇报");
    await vi.advanceTimersByTimeAsync(1300);
    const result = await ok;
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
