import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RingBrowser } from "./RingBrowser";
import type { Memory } from "@/lib/journal/types";
import { useJournalStore } from "@/lib/stores/journal";

function memory(id: string, date: string, themes: Memory["themes"], title = "一次汇报"): Memory {
  return {
    id,
    sessionId: "s-" + id,
    date,
    title,
    summary: "一次汇报没做好，觉得自己整个人不行。",
    emotions: ["委屈"],
    themes,
    coreBelief: "我不行",
    shift: { from: "我整个人不行", to: "一次没做好" },
    insight: "我可以做得不好，也还是我。",
    helpfulAnimals: ["owl"],
    moodBefore: 4,
    moodAfter: 7,
  };
}

const MEMORIES: Memory[] = [
  memory("m1", "2025-04-01", ["工作压力"]),
  memory("m2", "2026-03-12", ["自我价值"], "考试没考好"),
  memory("m3", "2026-03-12", ["孤独"]),
];

function put(memories: Memory[]): void {
  useJournalStore.setState({
    ready: true,
    persistent: false,
    memories,
    paused: null,
    getSession: async () => null,
  });
}

beforeEach(() => {
  put(MEMORIES);
});

afterEach(() => {
  cleanup();
});

describe("年轮三级浏览", () => {
  it("没有记录时摆一句「你的第一圈年轮，正在生长」", () => {
    put([]);
    render(<RingBrowser onClose={() => undefined} />);
    expect(screen.getByText("你的第一圈年轮，正在生长")).toBeTruthy();
    expect(screen.queryByTestId("ring-year")).toBeNull();
  });

  it("年层看年份，点进去是十二个月，再点进去是日子，最后是那天的成长卡片", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RingBrowser onClose={() => undefined} />);
    expect(screen.getByRole("button", { name: "2025 年，1 条记录" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026 年，2 条记录" })).toBeTruthy();
    expect(screen.getByTestId("ring-breadcrumb").textContent).toContain("全部");

    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    expect(screen.getByRole("button", { name: "3 月，2 条记录" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /1 月/ })).toBeNull();
    expect(screen.getAllByTestId("month-line").length).toBe(11);
    expect(screen.getByTestId("ring-breadcrumb").textContent).toContain("2026");

    await user.click(screen.getByRole("button", { name: "3 月，2 条记录" }));
    expect(screen.getByRole("button", { name: "12 日，2 条记录" })).toBeTruthy();
    expect(screen.getByTestId("ring-breadcrumb").textContent).toContain("3月");

    await user.click(screen.getByRole("button", { name: "12 日，2 条记录" }));
    expect(screen.getAllByTestId("growth-card").length).toBe(2);
    expect(screen.getByTestId("ring-breadcrumb").textContent).toContain("12日");
    expect(screen.getAllByText("那天的对话").length).toBe(2);
  });

  it("面包屑能一级一级退回去", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RingBrowser onClose={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    await user.click(screen.getByRole("button", { name: "3 月，2 条记录" }));
    expect(screen.getByRole("button", { name: "12 日，2 条记录" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "2026" }));
    expect(screen.queryByRole("button", { name: "12 日，2 条记录" })).toBeNull();
    expect(screen.getByRole("button", { name: "3 月，2 条记录" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "全部" }));
    expect(screen.getByRole("button", { name: "2025 年，1 条记录" })).toBeTruthy();
  });

  it("按主题筛选时，有这种记录的圈亮起来", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RingBrowser onClose={() => undefined} />);
    expect(screen.getByRole("button", { name: "2025 年，1 条记录" }).getAttribute("data-highlighted")).toBe("false");
    await user.click(screen.getByRole("button", { name: "工作压力" }));
    expect(screen.getByRole("button", { name: "2025 年，1 条记录" }).getAttribute("data-highlighted")).toBe("true");
    expect(screen.getByRole("button", { name: "2026 年，2 条记录" }).getAttribute("data-highlighted")).toBe("false");
  });

  it("有关闭按钮", async () => {
    const user = userEvent.setup({ delay: null });
    const onClose = vi.fn();
    render(<RingBrowser onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "关闭年轮" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("年轮手势", () => {
  beforeEach(() => {
    put(MEMORIES);
  });

  afterEach(cleanup);

  it("点进某一层之后，手指往右划就退回上一层", async () => {
    const user = userEvent.setup();
    render(<RingBrowser onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    expect(screen.getAllByTestId("ring-month").length).toBeGreaterThan(0);

    const stage = screen.getByTestId("ring-stage");
    fireEvent.touchStart(stage, { touches: [{ clientX: 40, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 206 }] });

    expect(screen.queryAllByTestId("ring-month")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "2026 年，2 条记录" })).toBeTruthy();
  });

  it("双指张开进下一层：先到那年最近有记录的月，再到那天", async () => {
    const user = userEvent.setup();
    render(<RingBrowser onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));

    const stage = screen.getByTestId("ring-stage");
    const spread = (from: number, to: number): void => {
      fireEvent.touchStart(stage, {
        touches: [
          { clientX: 150 - from / 2, clientY: 150 },
          { clientX: 150 + from / 2, clientY: 150 },
        ],
      });
      fireEvent.touchMove(stage, {
        touches: [
          { clientX: 150 - to / 2, clientY: 150 },
          { clientX: 150 + to / 2, clientY: 150 },
        ],
      });
      fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 200, clientY: 150 }] });
    };

    spread(60, 150);
    expect(screen.getAllByTestId("ring-day").map((bead) => bead.getAttribute("aria-label"))).toEqual(["12 日，2 条记录"]);

    spread(60, 150);
    expect(screen.getAllByTestId("growth-card")).toHaveLength(2);
  });

  it("双指捏合退回上一层", async () => {
    const user = userEvent.setup();
    render(<RingBrowser onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));

    const stage = screen.getByTestId("ring-stage");
    fireEvent.touchStart(stage, {
      touches: [
        { clientX: 90, clientY: 150 },
        { clientX: 210, clientY: 150 },
      ],
    });
    fireEvent.touchMove(stage, {
      touches: [
        { clientX: 130, clientY: 150 },
        { clientX: 170, clientY: 150 },
      ],
    });

    // 原本停在月层，捏合之后回到年层
    expect(screen.queryAllByTestId("ring-month")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "2026 年，2 条记录" })).toBeTruthy();
  });
});
describe("年轮上的名字", () => {
  it("年层每一圈都写着年份，走进去说清这一年有多少条记录", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RingBrowser onClose={() => undefined} />);
    expect(screen.getAllByTestId("ring-label").map((node) => node.textContent)).toEqual(["2025", "2026"]);
    expect(screen.getByTestId("ring-caption").textContent).toBe("点一圈，看看那一年");

    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    expect(screen.getByTestId("ring-caption").textContent).toBe("2026 年，2 条记录");
  });

  it("停在一圈上（或键盘落到那一圈）就先说这一圈是谁", () => {
    render(<RingBrowser onClose={() => undefined} />);
    const ring = screen.getByRole("button", { name: "2025 年，1 条记录" });
    fireEvent.mouseEnter(ring);
    expect(screen.getByTestId("ring-caption").textContent).toBe("2025 年，1 条记录");
    fireEvent.mouseLeave(ring);
    expect(screen.getByTestId("ring-caption").textContent).toBe("点一圈，看看那一年");

    fireEvent.focus(ring);
    expect(screen.getByTestId("ring-caption").textContent).toBe("2025 年，1 条记录");
    fireEvent.blur(ring);
    expect(screen.getByTestId("ring-caption").textContent).toBe("点一圈，看看那一年");
  });
});
