import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

/** 测试里不等抬手那一下：把动画时长设成 0，要验抬手时再显式传 */
function renderRings(onClose: () => void = () => undefined, riseMs = 0): void {
  render(<RingBrowser onClose={onClose} riseMs={riseMs} />);
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
    renderRings();
    expect(screen.getByText("你的第一圈年轮，正在生长")).toBeTruthy();
    expect(screen.queryByTestId("ring-year")).toBeNull();
  });

  it("年层看年份，点进去是十二个月，再点进去是日子，最后是那天的成长卡片", async () => {
    const user = userEvent.setup({ delay: null });
    renderRings();
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
    renderRings();
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
    renderRings();
    expect(screen.getByRole("button", { name: "2025 年，1 条记录" }).getAttribute("data-highlighted")).toBe("false");
    await user.click(screen.getByRole("button", { name: "工作压力" }));
    expect(screen.getByRole("button", { name: "2025 年，1 条记录" }).getAttribute("data-highlighted")).toBe("true");
    expect(screen.getByRole("button", { name: "2026 年，2 条记录" }).getAttribute("data-highlighted")).toBe("false");
  });

  it("有关闭按钮", async () => {
    const user = userEvent.setup({ delay: null });
    const onClose = vi.fn();
    renderRings(onClose);
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
    renderRings();
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
    renderRings();
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
    expect(screen.getAllByTestId("ring-day").map((ring) => ring.querySelector("[data-ring-hit]")?.getAttribute("aria-label"))).toEqual(["12 日，2 条记录"]);

    spread(60, 150);
    expect(screen.getAllByTestId("growth-card")).toHaveLength(2);
  });

  it("双指捏合退回上一层", async () => {
    const user = userEvent.setup();
    renderRings();
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
    renderRings();
    expect(screen.getAllByTestId("ring-label").map((node) => node.textContent)).toEqual(["2025", "2026"]);
    expect(screen.getByTestId("ring-caption").textContent).toBe("点一圈，看看那一年");

    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    expect(screen.getByTestId("ring-caption").textContent).toBe("2026 年，2 条记录");
  });

  it("停在一圈上（或键盘落到那一圈）就先说这一圈是谁", () => {
    renderRings();
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
describe("年轮是一盘纸雕", () => {
  it("每一圈都是三张纸片叠出来的，最内圈最高", () => {
    renderRings();
    const rings = screen.getAllByTestId("ring-year");
    const lifts = rings.map((ring) => Number(ring.getAttribute("data-lift")));
    expect(lifts[0]).toBeLessThan(lifts[1] ?? 0);
    for (const ring of rings) {
      expect(ring.querySelector("[data-ring-face]")).toBeTruthy();
      expect(ring.querySelector("[data-ring-side]")).toBeTruthy();
      expect(ring.querySelector("[data-ring-hit]")).toBeTruthy();
    }
    const core = Number(screen.getByTestId("ring-core").getAttribute("data-lift"));
    expect(core).toBeLessThan(lifts[0] ?? 0);
  });

  it("点一圈先抬起发光，抬到位再展开成下一级", async () => {
    const user = userEvent.setup({ delay: null });
    renderRings(() => undefined, 40);
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    expect(
      screen.getAllByTestId("ring-year").some((ring) => ring.getAttribute("data-raised") === "true"),
    ).toBe(true);
    expect(screen.getByTestId("ring-rise-glow")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByTestId("ring-month").length).toBeGreaterThan(0);
    });
    expect(screen.queryByTestId("ring-rise-glow")).toBeNull();
  });

  it("键盘落到哪一圈，哪一圈自己发光（不是浏览器那个方框）", () => {
    renderRings();
    const ring = screen.getByRole("button", { name: "2025 年，1 条记录" });
    expect(ring.getAttribute("class")).toContain("outline-none");
    fireEvent.focus(ring);
    expect(screen.getAllByTestId("ring-year")[0]?.getAttribute("data-focused")).toBe("true");
    expect(screen.getByTestId("ring-caption").textContent).toBe("2025 年，1 条记录");
    fireEvent.blur(ring);
    expect(screen.getAllByTestId("ring-year")[0]?.getAttribute("data-focused")).toBe("false");
  });

  it("月层：有记录的月份是一圈纸加一颗光点，空月份只是细线", async () => {
    const user = userEvent.setup({ delay: null });
    renderRings();
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    const months = screen.getAllByTestId("ring-month");
    expect(months.length).toBe(1);
    expect(months[0]?.querySelector("[data-ring-face]")).toBeTruthy();
    expect(screen.getAllByTestId("month-spark").length).toBe(1);
    const blanks = screen.getAllByTestId("month-line");
    expect(blanks.length).toBe(11);
    expect(blanks[0]?.querySelector("[data-ring-face]")).toBeNull();
    expect(Number(blanks[2]?.getAttribute("data-lift"))).toBeLessThan(0);
  });

  it("日层也是每天一圈，写着日期", async () => {
    const user = userEvent.setup({ delay: null });
    renderRings();
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    await user.click(screen.getByRole("button", { name: "3 月，2 条记录" }));
    const dayRings = screen.getAllByTestId("ring-day");
    expect(dayRings.length).toBe(1);
    expect(dayRings[0]?.querySelector("[data-ring-face]")).toBeTruthy();
    expect(dayRings[0]?.querySelector("[data-ring-hit]")?.getAttribute("aria-label")).toBe("12 日，2 条记录");
    expect(screen.getByTestId("ring-label").textContent).toBe("12日");

    // 点开那一天之后，这一圈还留在盘上、亮着（下面是那天的卡片）
    await user.click(screen.getByRole("button", { name: "12 日，2 条记录" }));
    const picked = screen.getAllByTestId("ring-day");
    expect(picked.length).toBe(1);
    expect(picked[0]?.getAttribute("data-highlighted")).toBe("true");
  });

  it("一个月里有几天就是几圈，早的那天更靠里、抬得更高", async () => {
    const user = userEvent.setup({ delay: null });
    put([memory("m1", "2026-03-05", ["工作压力"]), memory("m2", "2026-03-12", ["孤独"])]);
    renderRings();
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    await user.click(screen.getByRole("button", { name: "3 月，2 条记录" }));
    const dayRings = screen.getAllByTestId("ring-day");
    expect(dayRings.map((ring) => ring.querySelector("[data-ring-hit]")?.getAttribute("aria-label"))).toEqual([
      "5 日，1 条记录",
      "12 日，1 条记录",
    ]);
    const lifts = dayRings.map((ring) => Number(ring.getAttribute("data-lift")));
    expect(lifts[0]).toBeLessThan(lifts[1] ?? 0);
  });
});

describe("剪纸的年轮", () => {
  it("树皮包着木头，木头里压着年轮，中心是一小块髓", () => {
    renderRings();
    const bark = screen.getByTestId("ring-bark");
    expect(bark.querySelector("[data-ring-bark-side]")).toBeTruthy();
    expect(screen.getByTestId("ring-wood")).toBeTruthy();
    expect(screen.getByTestId("ring-pith")).toBeTruthy();
    expect(screen.getByTestId("ring-drop")).toBeTruthy();
    // 树皮在下、木头与年轮压在它上面
    const svg = bark.closest("svg");
    expect(svg?.querySelectorAll("[data-testid='ring-year']").length).toBe(2);
  });

  it("每一圈都是手剪出来的不圆，环带上还挖了剪纸的小口", () => {
    renderRings();
    for (const ring of screen.getAllByTestId("ring-year")) {
      const face = ring.querySelector("[data-ring-face]");
      const d = face?.getAttribute("d") ?? "";
      expect(d).not.toContain(" a ");
      expect(d.split("C").length - 1).toBeGreaterThan(8);
      expect(Number(face?.getAttribute("data-cuts"))).toBeGreaterThanOrEqual(1);
      expect(ring.querySelector("[data-ring-grain]")).toBeTruthy();
    }
  });

  it("空月份是一条手剪的细线，不是正圆", async () => {
    const user = userEvent.setup({ delay: null });
    renderRings();
    await user.click(screen.getByRole("button", { name: "2026 年，2 条记录" }));
    const blank = screen.getAllByTestId("month-line")[0];
    const d = blank?.querySelector("path")?.getAttribute("d") ?? "";
    expect(d).not.toContain(" a ");
    expect(d.split("C").length - 1).toBeGreaterThan(8);
  });
});

describe("只有热区是可点的", () => {
  it("纸片上的影、侧、面和木纹都不接点击", () => {
    put(MEMORIES);
    renderRings();
    const decorations = Array.from(
      document.querySelectorAll("[data-ring-layer] [data-ring-shadow], [data-ring-layer] [data-ring-side], [data-ring-layer] [data-ring-face], [data-ring-layer] [data-ring-grain]"),
    );
    expect(decorations.length).toBeGreaterThan(0);
    for (const node of decorations) {
      expect(node.getAttribute("pointer-events")).toBe("none");
    }
  });

  it("空月份的细线也不接点击", async () => {
    put(MEMORIES);
    renderRings();
    await userEvent.click(screen.getAllByRole("button", { name: /年，/ })[0]);
    const blank = screen.getAllByTestId("month-line")[0];
    expect(blank.querySelector("path")?.getAttribute("pointer-events")).toBe("none");
  });
});
