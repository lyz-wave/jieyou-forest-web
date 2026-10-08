import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TreeSummary } from "@/lib/ai/schema";
import { useTalkStore } from "@/lib/stores/talk";
import { CrownGlow } from "./CrownGlow";

const summary: TreeSummary = {
  heard: "我听见你今天很累。",
  voices: [
    { animal: "bear", point: "先温柔地对待自己。" },
    { animal: "owl", point: "分清事实和猜测。" },
  ],
  thought: "像一片叶子，先落在水面上。",
  nextStep: "今晚早点睡。",
  question: "你想先从哪一件小事开始？",
};

afterEach(() => {
  cleanup();
  useTalkStore.getState().finish();
});

describe("CrownGlow", () => {
  it("平时跟着时段亮，古树总结的时候自己亮起来", () => {
    const { container } = render(<CrownGlow />);
    expect(screen.queryByTestId("tree-glow")).toBeNull();
    expect(container.querySelector("path")?.getAttribute("style")).toContain("--crown-glow-on");

    act(() => {
      useTalkStore.getState().open();
      useTalkStore.getState().toSummary(summary);
    });
    expect(screen.getByTestId("tree-glow")).toBeTruthy();
    expect(screen.getByTestId("tree-glow").getAttribute("style")).toContain("opacity: 1");
  });
});