import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DndProvider, useDnd } from "./DndProvider";
import { Draggable } from "./Draggable";
import { DropZone } from "./DropZone";

afterEach(cleanup);

const RECT = { x: 100, y: 100, left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 };

function tree(onDrop: (itemId: string, zoneId: string) => void) {
  return (
    <DndProvider onDrop={onDrop}>
      <Draggable id="nut-1">第一颗</Draggable>
      <DropZone id="hole" label="树洞">
        树洞里的坚果
      </DropZone>
    </DndProvider>
  );
}

describe("拖拽物件与投放区", () => {
  it("点选模式：先点物件再点目标就能放进去", async () => {
    const onDrop = vi.fn();
    render(tree(onDrop));
    const nut = screen.getByRole("button", { name: "第一颗" });
    expect(nut).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(nut);
    expect(screen.getByRole("button", { name: "第一颗" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "树洞" }));
    expect(onDrop).toHaveBeenCalledWith("nut-1", "hole");
  });

  it("没先点物件时点目标不会放进任何东西", async () => {
    const onDrop = vi.fn();
    render(tree(onDrop));
    await userEvent.click(screen.getByRole("button", { name: "树洞" }));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("键盘：Tab 到物件、回车选中，再 Tab 到目标、回车放下", async () => {
    const onDrop = vi.fn();
    render(tree(onDrop));

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "第一颗" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "第一颗" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "树洞" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onDrop).toHaveBeenCalledWith("nut-1", "hole");
  });

  it("再点一次物件可以取消选中", async () => {
    const onDrop = vi.fn();
    render(tree(onDrop));
    const nut = screen.getByRole("button", { name: "第一颗" });
    await userEvent.click(nut);
    await userEvent.click(nut);
    expect(screen.getByRole("button", { name: "第一颗" })).toHaveAttribute("aria-pressed", "false");
  });

  it("落点在目标上才算放下，落在空地上不触发（物件弹回）", async () => {
    const onDrop = vi.fn();
    const results: boolean[] = [];
    function Probe({ x, y }: { x: number; y: number }) {
      const { dropAt } = useDnd();
      return (
        <button
          type="button"
          onClick={() => {
            results.push(dropAt("nut-1", x, y));
          }}
        >
          落点
        </button>
      );
    }
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(RECT as DOMRect);
    try {
      render(
        <DndProvider onDrop={onDrop}>
          <DropZone id="hole" label="树洞">
            树洞里的坚果
          </DropZone>
          <Probe x={150} y={150} />
        </DndProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "落点" }));
      expect(onDrop).toHaveBeenCalledWith("nut-1", "hole");
      expect(results).toEqual([true]);

      cleanup();
      render(
        <DndProvider onDrop={onDrop}>
          <DropZone id="hole" label="树洞">
            树洞里的坚果
          </DropZone>
          <Probe x={900} y={900} />
        </DndProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "落点" }));
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(results[1]).toBe(false);
    } finally {
      rect.mockRestore();
    }
  });

  it("目标收起来（尺寸为零）时不算落点", async () => {
    const onDrop = vi.fn();
    const results: boolean[] = [];
    function Probe() {
      const { dropAt } = useDnd();
      return (
        <button
          type="button"
          onClick={() => {
            results.push(dropAt("nut-1", 150, 150));
          }}
        >
          落点
        </button>
      );
    }
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ ...RECT, right: 100, bottom: 100, width: 0, height: 0 } as DOMRect);
    try {
      render(
        <DndProvider onDrop={onDrop}>
          <DropZone id="hole" label="树洞">
            树洞里的坚果
          </DropZone>
          <Probe />
        </DndProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "落点" }));
      expect(onDrop).not.toHaveBeenCalled();
      expect(results).toEqual([false]);
    } finally {
      rect.mockRestore();
    }
  });
});
