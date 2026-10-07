import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMOTIONS } from "@/lib/games/knock-tree";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { KnockTreeGame } from "./KnockTreeGame";

afterEach(cleanup);

function open() {
  const onClose = vi.fn();
  render(<KnockTreeGame onClose={onClose} />);
  return { onClose };
}

function tapTrunk(times: number) {
  const trunk = screen.getByRole("button", { name: "敲一敲树干" });
  for (let i = 0; i < times; i += 1) fireEvent.click(trunk);
}

function stop(times = 1, waitMs = 3000) {
  tapTrunk(times);
  act(() => {
    vi.advanceTimersByTime(waitMs);
  });
}

describe("敲树洞", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameContextStore.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("敲几下就显示几下", () => {
    open();
    tapTrunk(3);
    expect(screen.getByTestId("knock-count")).toHaveTextContent("3");
  });

  it("停手 3 秒后，树洞里飘出 10 张情绪词卡片", () => {
    open();
    stop(15);
    expect(screen.getByTestId("knock-count")).toHaveTextContent("15");
    for (const emotion of EMOTIONS) {
      expect(screen.getByRole("button", { name: emotion })).toBeInTheDocument();
    }
  });

  it("从第一次点击起满 30 秒会自动结束", () => {
    open();
    stop(2, 30000);
    expect(screen.getByRole("button", { name: "委屈" })).toBeInTheDocument();
  });

  it("最多选 3 个，第 4 个不会被选中并给出提示", () => {
    open();
    stop(3);
    fireEvent.click(screen.getByRole("button", { name: "愤怒" }));
    fireEvent.click(screen.getByRole("button", { name: "委屈" }));
    fireEvent.click(screen.getByRole("button", { name: "焦虑" }));
    fireEvent.click(screen.getByRole("button", { name: "失落" }));
    expect(screen.getByRole("status")).toHaveTextContent("最多选 3 个就好");
    expect(screen.getByRole("button", { name: "失落" })).toHaveAttribute("aria-pressed", "false");
  });

  it("确认后笃笃回应，并把选中的情绪记进 gameContext", () => {
    open();
    stop(5);
    fireEvent.click(screen.getByRole("button", { name: "委屈" }));
    fireEvent.click(screen.getByRole("button", { name: "疲惫" }));
    fireEvent.click(screen.getByRole("button", { name: "就是这些" }));
    expect(screen.getByTestId("knock-reply")).toHaveTextContent("原来你是委屈和疲惫啊，这很正常");
    expect(useGameContextStore.getState().entries).toEqual(["【敲树洞】此刻的情绪：委屈、疲惫"]);
  });

  it("一个都没选时不能确认", () => {
    open();
    stop(3);
    expect(screen.getByRole("button", { name: "就是这些" })).toBeDisabled();
  });

  it("回到森林会告诉外面", () => {
    const { onClose } = open();
    fireEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});