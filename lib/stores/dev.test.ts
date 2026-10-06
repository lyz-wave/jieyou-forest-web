import { beforeEach, describe, expect, it } from "vitest";
import { useDevStore } from "./dev";

describe("useDevStore", () => {
  beforeEach(() => useDevStore.setState({ simulateAIFailure: false }));
  it("可以开启及关闭模拟 AI 失败", () => {
    useDevStore.getState().setSimulateAIFailure(true);
    expect(useDevStore.getState().simulateAIFailure).toBe(true);
    useDevStore.getState().setSimulateAIFailure(false);
    expect(useDevStore.getState().simulateAIFailure).toBe(false);
  });
});
