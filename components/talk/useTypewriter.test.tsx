import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTypewriter } from "./useTypewriter";

afterEach(() => { cleanup(); vi.useRealTimers(); });

function Line({ text, reducedMotion = false }: { text: string; reducedMotion?: boolean }) {
  return <p data-testid="line">{useTypewriter(text, reducedMotion)}</p>;
}

describe("useTypewriter", () => {
  it("一个字一个字地出，出完就停", () => {
    vi.useFakeTimers();
    render(<Line text="你好呀" />);
    expect(screen.getByTestId("line")).toHaveTextContent("");
    act(() => { vi.advanceTimersByTime(28); });
    expect(screen.getByTestId("line")).toHaveTextContent("你");
    act(() => { vi.advanceTimersByTime(56); });
    expect(screen.getByTestId("line")).toHaveTextContent("你好呀");
    act(() => { vi.advanceTimersByTime(280); });
    expect(screen.getByTestId("line")).toHaveTextContent("你好呀");
  });

  it("换一段话从头开始", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Line text="先说这句" />);
    act(() => { vi.advanceTimersByTime(28 * 4); });
    expect(screen.getByTestId("line")).toHaveTextContent("先说这句");
    rerender(<Line text="换一句" />);
    expect(screen.getByTestId("line")).toHaveTextContent("");
    act(() => { vi.advanceTimersByTime(28); });
    expect(screen.getByTestId("line")).toHaveTextContent("换");
  });

  it("减弱动画时整段直接出现", () => {
    vi.useFakeTimers();
    render(<Line text="一次说完" reducedMotion />);
    expect(screen.getByTestId("line")).toHaveTextContent("一次说完");
  });
});