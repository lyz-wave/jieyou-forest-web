import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/lib/stores/app";
import { useForestStore } from "@/lib/stores/forest";
import { ForestHome } from "./ForestHome";

const PROFILE = { nickname: "小满", companion: "fox" as const, onboardedAt: 1 };

beforeEach(() => {
  useAppStore.setState({ phase: "forest", profile: PROFILE, persistent: true });
  useForestStore.setState({
    companion: "fox",
    gather: "idle",
    pending: 0,
    wanderPaused: false,
    opened: null,
    openedAt: null,
    pendingGame: null,
    gameAnimal: null,
    gameAt: null,
    lastPlayed: null,
    playedTimes: 0,
  });
});

afterEach(cleanup);

describe("ForestHome", () => {
  it("显示欢迎条、今天的伙伴、开始倾诉和免责声明", () => {
    render(<ForestHome />);
    expect(screen.getByRole("heading", { name: /小满，欢迎回到森林/ })).toBeTruthy();
    expect(screen.getByText("今天的伙伴 · 阿橘")).toBeTruthy();
    expect(screen.getByRole("button", { name: /开始倾诉/ })).toBeTruthy();
    expect(screen.getByText("解忧森林不能替代专业心理咨询")).toBeTruthy();
  });

  it("点开始倾诉触发聚拢，按钮换成提示纸条", () => {
    render(<ForestHome />);
    fireEvent.click(screen.getByRole("button", { name: /开始倾诉/ }));
    expect(useForestStore.getState().gather).toBe("gathering");
    expect(useForestStore.getState().pending).toBe(7);
  });

  it("没有卡片时不渲染对话框，打开后显示角色卡", () => {
    const { rerender } = render(<ForestHome />);
    expect(screen.queryByRole("dialog")).toBeNull();
    useForestStore.setState({ opened: "owl" });
    rerender(<ForestHome />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "墨墨" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useForestStore.getState().opened).toBeNull();
  });

  it("角色卡点一起玩后挂出游戏面板，回到森林时记下刚玩过的动物", async () => {
    useForestStore.setState({ opened: "owl" });
    render(<ForestHome />);
    fireEvent.click(screen.getByRole("button", { name: /一起玩：事实还是猜测/ }));
    expect(useForestStore.getState().pendingGame).toBe("fact-or-guess");
    expect(useForestStore.getState().gameAnimal).toBe("owl");
    expect(await screen.findByRole("heading", { name: "事实还是猜测" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(useForestStore.getState().lastPlayed).toBe("owl");
  });

  it("存储不可用时提醒这次记不住", () => {
    useAppStore.setState({ persistent: false });
    render(<ForestHome />);
    expect(screen.getByText(/森林这次记不住你/)).toBeTruthy();
  });
});
