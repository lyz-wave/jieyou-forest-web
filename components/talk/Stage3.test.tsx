import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Memory } from "@/lib/journal/types";
import { useTalkStore } from "@/lib/stores/talk";
import { GrowStage } from "./GrowStage";
import { GrowthCardStage } from "./GrowthCardStage";
import { RateStage } from "./RateStage";

const MEMORY: Memory = {
  id: "mem-s-1",
  sessionId: "s-1",
  date: "2026-03-05",
  title: "汇报搞砸了",
  summary: "一次汇报没做好。",
  emotions: ["委屈"],
  themes: ["工作压力"],
  coreBelief: "我不行",
  shift: { from: "我整个人不行", to: "一次没做好" },
  insight: "我可以做得不好，也还是我。",
  action: "明天先写三行提纲",
  helpfulAnimals: ["owl"],
  moodBefore: 4,
  moodAfter: 7,
};

afterEach(cleanup);

beforeEach(() => {
  useTalkStore.getState().open();
  useTalkStore.setState({ mood: 4, moodAfter: null, memory: null, memoryStatus: "idle" });
});

describe("再次打分", () => {
  it("记下这次的分，再交给年轮", async () => {
    const user = userEvent.setup();
    render(<RateStage onGrow={() => undefined} />);
    expect(screen.getByText("进来的时候是 4 分。")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "心情 8 分" }));
    expect(useTalkStore.getState().moodAfter).toBe(8);
    await user.click(screen.getByRole("button", { name: "看看这次留下了什么" }));
    expect(useTalkStore.getState().phase).toBe("grow");
    expect(useTalkStore.getState().memoryStatus).toBe("thinking");
  });

  it("跳过打分就不留分数，一样往下走", async () => {
    const user = userEvent.setup();
    render(<RateStage onGrow={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "心情 9 分" }));
    await user.click(screen.getByRole("button", { name: "跳过打分" }));
    expect(useTalkStore.getState().moodAfter).toBeNull();
    expect(useTalkStore.getState().phase).toBe("grow");
  });
});

describe("年轮生长", () => {
  it("长的时候给一圈正在长的光点", () => {
    useTalkStore.setState({ phase: "grow", memoryStatus: "thinking" });
    render(<GrowStage onRetry={() => undefined} />);
    expect(screen.getByTestId("ring-growing")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("长成新的一圈");
  });

  it("长不上时用同一句降级话，再试一次接着来", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    useTalkStore.setState({ phase: "grow", memoryStatus: "failed" });
    render(<GrowStage onRetry={onRetry} />);
    expect(screen.getByText("风太大了没听清，能再说一次吗？")).toBeTruthy();
    expect(screen.queryByTestId("ring-growing")).toBeNull();
    await user.click(screen.getByRole("button", { name: "再试一次" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("成长卡片", () => {
  it("日期、标题、心情 4 → 7、从哪句到哪句、领悟、下一步、帮到我的那只", () => {
    useTalkStore.setState({ phase: "card", memory: MEMORY });
    render(<GrowthCardStage onRings={() => undefined} onLeave={() => undefined} />);
    const card = screen.getByTestId("growth-card");
    expect(card.textContent).toContain("2026-03-05");
    expect(card.textContent).toContain("汇报搞砸了");
    expect(screen.getByTestId("growth-mood").textContent).toContain("4");
    expect(screen.getByTestId("growth-mood").textContent).toContain("7");
    expect(card.textContent).toContain("从「我整个人不行」到「一次没做好」");
    expect(card.textContent).toContain("我可以做得不好，也还是我。");
    expect(card.textContent).toContain("明天先写三行提纲");
    expect(card.textContent).toContain("墨墨");
  });

  it("去看年轮、收好回森林各是一个按钮", async () => {
    const onRings = vi.fn();
    const onLeave = vi.fn();
    const user = userEvent.setup();
    useTalkStore.setState({ phase: "card", memory: MEMORY });
    render(<GrowthCardStage onRings={onRings} onLeave={onLeave} />);
    await user.click(screen.getByRole("button", { name: "看看我的年轮" }));
    await user.click(screen.getByRole("button", { name: "收好，回到森林" }));
    expect(onRings).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("没有分数的时候不摆心情那一行", () => {
    useTalkStore.setState({
      phase: "card",
      memory: { ...MEMORY, moodBefore: undefined, moodAfter: undefined },
    });
    render(<GrowthCardStage onRings={() => undefined} onLeave={() => undefined} />);
    expect(screen.queryByTestId("growth-mood")).toBeNull();
  });
});
