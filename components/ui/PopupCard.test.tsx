import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PopupCard } from "./PopupCard";

afterEach(cleanup);

describe("PopupCard", () => {
  it("打开聚焦，回调变更不会把焦点从输入框抢走，关闭返回触发按钮", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const children = <><h2 id="title">纸卡</h2><input aria-label="昵称" data-autofocus /><button>继续</button></>;
    const { rerender } = render(<PopupCard open labelledBy="title" onClose={() => undefined}>{children}</PopupCard>);
    const input = screen.getByRole("textbox");
    await waitFor(() => expect(input).toHaveFocus());
    screen.getByRole("button", { name: "继续" }).focus();
    rerender(<PopupCard open labelledBy="title" onClose={() => undefined}>{children}</PopupCard>);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(screen.getByRole("button", { name: "继续" })).toHaveFocus();
    rerender(<PopupCard open={false} labelledBy="title">{children}</PopupCard>);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("Tab 和 Shift+Tab 都留在对话框里", async () => {
    render(<PopupCard open><button data-autofocus>第一个</button><button>最后一个</button></PopupCard>);
    const first = screen.getByRole("button", { name: "第一个" });
    const last = screen.getByRole("button", { name: "最后一个" });
    await waitFor(() => expect(first).toHaveFocus());
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(first).toHaveFocus();
  });

  it("Esc 和点击外部可关闭，可强制入林卡片不被跳过", () => {
    const close = vi.fn();
    const { rerender } = render(<PopupCard open onClose={close}><h2>纸卡</h2></PopupCard>);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerDown(screen.getByRole("dialog").parentElement!);
    expect(close).toHaveBeenCalledTimes(2);
    close.mockClear();
    rerender(<PopupCard open dismissible={false} onClose={close}><h2>纸卡</h2></PopupCard>);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerDown(screen.getByRole("dialog").parentElement!);
    expect(close).not.toHaveBeenCalled();
  });
});
