import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useSceneStore } from "@/lib/stores/scene";
import { ListeningStage } from "./ListeningStage";

afterEach(() => {
  cleanup();
  useSceneStore.setState({ reducedMotionOverride: null });
});

describe("聆听那一下", () => {
  it("平时有三个慢慢亮起来的小点，配一句话说明它们在听", () => {
    useSceneStore.setState({ reducedMotionOverride: false });
    render(<ListeningStage />);
    expect(screen.getByText(/森林安静下来了/)).toBeTruthy();
    expect(screen.getAllByTestId("talk-dot")).toHaveLength(3);
  });

  it("减弱动画时只有静态的一句话，没有小点", () => {
    useSceneStore.setState({ reducedMotionOverride: true });
    render(<ListeningStage />);
    expect(screen.getByText(/森林安静下来了/)).toBeTruthy();
    expect(screen.queryAllByTestId("talk-dot")).toHaveLength(0);
  });
});
