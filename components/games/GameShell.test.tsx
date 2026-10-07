import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_FAILURE_LINE } from "@/lib/ai/types";
import { GameShell, useGameBusy } from "./GameShell";

afterEach(cleanup);

function Submit() {
  const busy = useGameBusy();
  return (
    <button type="button" disabled={busy}>
      提交
    </button>
  );
}

function open(props: Partial<Parameters<typeof GameShell>[0]> = {}) {
  const onClose = vi.fn();
  const onRetry = vi.fn();
  const view = render(
    <GameShell title="事实还是猜测" animal="owl" onClose={onClose} onRetry={onRetry} {...props}>
      <input aria-label="我的想法" defaultValue="我怕大家觉得我很差" />
      <Submit />
    </GameShell>,
  );
  return { onClose, onRetry, view };
}

describe("游戏面板外壳", () => {
  it("显示游戏标题、回到森林按钮和游戏内容", async () => {
    const { onClose } = open();
    expect(await screen.findByRole("heading", { name: "事实还是猜测" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("我的想法")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("按 Esc 也能回到森林", async () => {
    const { onClose } = open();
    await screen.findByRole("heading", { name: "事实还是猜测" });
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("等待中显示动物在想，提交按钮不可用", async () => {
    open({ status: "thinking" });
    const thinking = await screen.findByRole("status");
    expect(thinking).toHaveTextContent("墨墨");
    expect(thinking).toHaveTextContent("正在想");
    expect(screen.getByRole("button", { name: "提交" })).toBeDisabled();
  });

  it("失败时动物挠挠头，说同一句提示，重试按钮回调且输入还在", async () => {
    // 串行跑没事，但并行跑全量时 userEvent 默认的 delay: 0 会让最后一个字偶尔还没落进
    // DOM 就走到断言（实测 1/11 出现「…，真」缺最后一位）。打字不用定时器就没有这个竞态。
    const user = userEvent.setup({ delay: null });
    const { onRetry, view } = open({ status: "ready" });
    const input = await screen.findByLabelText("我的想法");
    await user.type(input, "，真的");
    view.rerender(
      <GameShell title="事实还是猜测" animal="owl" status="failed" onClose={vi.fn()} onRetry={onRetry}>
        <input aria-label="我的想法" defaultValue="我怕大家觉得我很差" />
        <Submit />
      </GameShell>,
    );
    const failure = await screen.findByRole("status");
    expect(failure).toHaveTextContent("挠挠头");
    expect(failure).toHaveTextContent(AI_FAILURE_LINE);
    expect(input).toHaveValue("我怕大家觉得我很差，真的");
    await user.click(screen.getByRole("button", { name: "再试一次" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("失败时提交按钮仍然可用（可以改一下再试）", async () => {
    open({ status: "failed" });
    await screen.findByRole("status");
    expect(screen.getByRole("button", { name: "提交" })).toBeEnabled();
  });
});
