import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDevStore } from "@/lib/stores/dev";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { DevTools } from "./DevTools";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  useGameContextStore.setState({ entries: [] });
  useDevStore.setState({ simulateAIFailure: false });
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  useGameContextStore.setState({ entries: [] });
  useDevStore.setState({ simulateAIFailure: false });
});

describe("开发工具", () => {
  it("没有打开开发模式时什么都不显示", async () => {
    const { container } = render(<DevTools />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("?dev=1 时可以展开看 gameContext", async () => {
    window.history.replaceState({}, "", "/?dev=1");
    useGameContextStore.getState().add("敲树洞", "此刻的情绪：委屈");
    useGameContextStore.getState().add("熊抱", "抱了自己 20 秒");
    render(<DevTools />);

    const toggle = await screen.findByRole("button", { name: /gameContext/ });
    expect(toggle).toHaveTextContent("2");
    expect(screen.queryByText("【敲树洞】此刻的情绪：委屈")).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.getByText("【敲树洞】此刻的情绪：委屈")).toBeInTheDocument();
    expect(screen.getByText("【熊抱】抱了自己 20 秒")).toBeInTheDocument();
  });

  it("还没有记录时给出提示，清空按钮清掉记录", async () => {
    window.history.replaceState({}, "", "/?dev=1");
    render(<DevTools />);
    await userEvent.click(await screen.findByRole("button", { name: /gameContext/ }));
    expect(screen.getByText("还没有记录")).toBeInTheDocument();

    await act(async () => {
      useGameContextStore.getState().add("龟壳呼吸", "慢慢呼吸了 3 轮");
    });
    expect(await screen.findByText("【龟壳呼吸】慢慢呼吸了 3 轮")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(useGameContextStore.getState().entries).toEqual([]);
    expect(screen.getByText("还没有记录")).toBeInTheDocument();
  });

  it("可以在这里打开「模拟 AI 失败」", async () => {
    window.history.replaceState({}, "", "/?dev=1");
    render(<DevTools />);
    await userEvent.click(await screen.findByRole("button", { name: /gameContext/ }));
    const toggle = screen.getByRole("checkbox", { name: "模拟 AI 失败" });
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    expect(useDevStore.getState().simulateAIFailure).toBe(true);
    expect(screen.getByRole("checkbox", { name: "模拟 AI 失败" })).toBeChecked();
  });
});
