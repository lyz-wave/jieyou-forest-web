import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLOSING_LINE, PHASE_MS } from "@/lib/games/shell-breath";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { ShellBreathGame } from "./ShellBreathGame";

afterEach(cleanup);

function open() {
  render(<ShellBreathGame onClose={vi.fn()} />);
}

function begin(rounds?: number) {
  if (rounds !== undefined) {
    fireEvent.change(screen.getByLabelText("轮数"), { target: { value: String(rounds) } });
  }
  fireEvent.click(screen.getByRole("button", { name: "开始呼吸" }));
}

function breathe(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("龟壳呼吸", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameContextStore.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("吸气 4 秒、屏息 4 秒、呼气 4 秒依次进行，并显示倒数秒数", () => {
    open();
    begin();
    const stage = screen.getByTestId("breath-stage");
    expect(stage).toHaveAttribute("data-phase", "inhale");
    expect(stage).toHaveTextContent("吸气");
    expect(stage).toHaveTextContent("4");
    breathe(4000);
    expect(screen.getByTestId("breath-stage")).toHaveAttribute("data-phase", "hold");
    expect(screen.getByTestId("breath-stage")).toHaveTextContent("屏息");
    breathe(4000);
    expect(screen.getByTestId("breath-stage")).toHaveAttribute("data-phase", "exhale");
    breathe(4000);
    expect(screen.getByTestId("breath-stage")).toHaveTextContent("屏息");
  });

  it("默认 3 轮，48 秒后收尾并记下轮数", () => {
    open();
    begin();
    breathe(PHASE_MS * 4 * 3);
    expect(screen.getByTestId("breath-closing")).toHaveTextContent(CLOSING_LINE);
    expect(useGameContextStore.getState().entries).toEqual(["【龟壳呼吸】完成了 3 轮盒式呼吸"]);
  });

  it("轮数可以调到 1 轮", () => {
    open();
    begin(1);
    breathe(PHASE_MS * 4);
    expect(useGameContextStore.getState().entries).toEqual(["【龟壳呼吸】完成了 1 轮盒式呼吸"]);
  });

  it("中途结束不产生记录", () => {
    open();
    begin();
    breathe(20000);
    fireEvent.click(screen.getByRole("button", { name: "结束" }));
    breathe(60000);
    expect(useGameContextStore.getState().entries).toEqual([]);
    expect(screen.getByRole("button", { name: "开始呼吸" })).toBeInTheDocument();
  });

  it("提示音默认关闭", () => {
    open();
    const sound = screen.getByRole("button", { name: "提示音" });
    expect(sound).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(sound);
    expect(screen.getByRole("button", { name: "提示音" })).toHaveAttribute("aria-pressed", "true");
  });
});