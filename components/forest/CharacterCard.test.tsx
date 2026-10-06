import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterCard } from "./CharacterCard";

afterEach(cleanup);

describe("CharacterCard", () => {
  it("墨墨的卡有名字、物种、思维方式、依据、样句和一起玩的游戏", () => {
    render(<CharacterCard id="owl" onClose={() => undefined} />);
    expect(screen.getByRole("heading", { name: "墨墨" })).toBeTruthy();
    expect(screen.getByText("猫头鹰 · 理性分析")).toBeTruthy();
    expect(screen.getByText(/认知行为疗法/)).toBeTruthy();
    expect(screen.getByText(/哪些是真的发生了/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "一起玩：事实还是猜测" })).toBeTruthy();
    expect(screen.queryByText("我的伙伴")).toBeNull();
  });

  it("是今天的伙伴时多一枚「我的伙伴」标记", () => {
    render(<CharacterCard id="bear" companion="bear" onClose={() => undefined} />);
    expect(screen.getByText("我的伙伴")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "团团" })).toBeTruthy();
  });

  it("点关闭按钮和按 Esc 都会折回", () => {
    const close = vi.fn();
    render(<CharacterCard id="fox" onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("点「一起玩」把游戏交给父组件", () => {
    const play = vi.fn();
    render(<CharacterCard id="owl" onClose={() => undefined} onPlay={play} />);
    fireEvent.click(screen.getByRole("button", { name: "一起玩：事实还是猜测" }));
    expect(play).toHaveBeenCalledWith("fact-or-guess");
  });

  it("古树卡点「我的年轮」只显示纸条提示，不跳转", () => {
    render(<CharacterCard id="tree" onClose={() => undefined} />);
    expect(screen.getByRole("heading", { name: "岁岁" })).toBeTruthy();
    expect(screen.queryByText("年轮还在生长，过些日子再来看看")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /我的年轮/ }));
    expect(screen.getByRole("status").textContent).toContain("年轮还在生长，过些日子再来看看");
    expect(window.location.pathname).toBe("/");
  });
});
