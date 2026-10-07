import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAF_MAX_CHARS, LEAF_NOTICE, leafFadeMs } from "@/lib/games/leaf-float";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { LeafFloatGame } from "./LeafFloatGame";

const LINE = "今天有点累";

afterEach(cleanup);

beforeEach(() => {
  useGameContextStore.getState().clear();
});

function floatLeaf(text: string): void {
  fireEvent.change(screen.getByLabelText("写一句想放走的烦恼"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "放到溪流上" }));
}

describe("落叶漂流", () => {
  it("一开始就写明叶子上的字不会被保存", () => {
    render(<LeafFloatGame onClose={vi.fn()} />);
    expect(screen.getByText(LEAF_NOTICE)).toBeInTheDocument();
  });

  it("叶子漂走以后字就不在了，只留下放走了几片", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<LeafFloatGame onClose={onClose} />);
    floatLeaf(LINE);
    expect(screen.getByTestId("leaf-1")).toHaveTextContent(LINE);
    act(() => {
      vi.advanceTimersByTime(leafFadeMs([...LINE].length) + 300);
    });
    expect(screen.queryByTestId("leaf-1")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useGameContextStore.getState().entries).toEqual(["【落叶漂流】放走了 1 片烦恼叶子"]);
    expect(JSON.stringify(useGameContextStore.getState().entries)).not.toContain(LINE);
    vi.useRealTimers();
  });

  it("一片都没放走就不记账", () => {
    render(<LeafFloatGame onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(useGameContextStore.getState().entries).toEqual([]);
  });

  it("可以接着写下一片，空输入或超过 30 字不能放", () => {
    render(<LeafFloatGame onClose={vi.fn()} />);
    const button = screen.getByRole("button", { name: "放到溪流上" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("写一句想放走的烦恼"), { target: { value: "啊".repeat(LEAF_MAX_CHARS + 1) } });
    expect(button).toBeDisabled();
    floatLeaf("第一片");
    floatLeaf("第二片");
    expect(screen.getByTestId("leaf-1")).toBeInTheDocument();
    expect(screen.getByTestId("leaf-2")).toBeInTheDocument();
  });
});