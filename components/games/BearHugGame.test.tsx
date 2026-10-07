import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BEAR_HUG_PHRASES, TOO_SHORT_LINE } from "@/lib/games/bear-hug";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { BearHugGame } from "./BearHugGame";

afterEach(cleanup);

function open() {
  render(<BearHugGame onClose={vi.fn()} />);
}

function holdFor(ms: number) {
  const bear = screen.getByRole("button", { name: "抱一抱团团" });
  fireEvent.pointerDown(bear);
  act(() => {
    vi.advanceTimersByTime(ms);
  });
  fireEvent.pointerUp(bear);
}

describe("熊抱", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameContextStore.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("按住 6 秒再松开，团团说一句自我关怀的话，并记下抱了多久", () => {
    open();
    holdFor(6000);
    const said = screen.getByTestId("hug-line");
    expect(BEAR_HUG_PHRASES).toContain(said.textContent ?? "");
    expect(useGameContextStore.getState().entries).toEqual(["【熊抱】和团团抱了 6 秒"]);
  });

  it("按住不到 1 秒就松开，只提示抱久一点，不记账", () => {
    open();
    holdFor(500);
    expect(screen.getByRole("status")).toHaveTextContent(TOO_SHORT_LINE);
    expect(useGameContextStore.getState().entries).toEqual([]);
  });

  it("同一次访问里不连续说同一句", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    open();
    holdFor(2000);
    const first = screen.getByTestId("hug-line").textContent;
    holdFor(2000);
    const second = screen.getByTestId("hug-line").textContent;
    expect(second).not.toBe(first);
  });

  it("按得越久暖光越亮，10 秒时最亮", () => {
    open();
    const bear = screen.getByRole("button", { name: "抱一抱团团" });
    fireEvent.pointerDown(bear);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(Number(screen.getByTestId("hug-glow").style.opacity)).toBeCloseTo(0.75, 2);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(Number(screen.getByTestId("hug-glow").style.opacity)).toBeCloseTo(1, 2);
    fireEvent.pointerUp(bear);
  });

  it("这个游戏不调用 AI（只从本地文案库说话）", () => {
    open();
    holdFor(3000);
    expect(screen.queryByText(/正在想/)).toBeNull();
  });
});