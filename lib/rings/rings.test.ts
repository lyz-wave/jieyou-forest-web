import { describe, expect, it } from "vitest";
import type { Memory } from "@/lib/journal/types";
import {
  dateKey,
  DEFAULT_RING_COLOR,
  EMOTION_COLORS,
  MAX_RING_WIDTH,
  MIN_RING_WIDTH,
  breadcrumbOf,
  dayRings,
  demoMemories,
  groupByYear,
  highlightIds,
  monthRings,
  ringColor,
  ringWidth,
  yearRings,
} from "./rings";

function memory(over: Partial<Memory> & { date: string; id: string }): Memory {
  return {
    sessionId: "s-" + over.id,
    title: "一次汇报",
    summary: "汇报搞砸了，觉得自己不行。",
    emotions: ["委屈"],
    themes: ["工作压力"],
    coreBelief: "我什么都做不好",
    shift: { from: "我就是不行", to: "这件事可以再练" },
    insight: "一次汇报不等于我这个人。",
    helpfulAnimals: ["fox"],
    moodBefore: 3,
    moodAfter: 6,
    ...over,
  };
}

const memories: Memory[] = [
  memory({ id: "a", date: "2024-03-12", emotions: ["委屈", "委屈", "焦虑"] }),
  memory({ id: "b", date: "2024-03-12", emotions: ["焦虑"] }),
  memory({ id: "c", date: "2024-11-02", emotions: ["疲惫"] }),
  memory({ id: "d", date: "2026-03-05", emotions: ["焦虑"], themes: ["职场人际"] }),
  memory({ id: "e", date: "2026-03-20", emotions: ["委屈"], themes: ["职场人际", "家庭"] }),
  memory({ id: "f", date: "2026-03-20", emotions: ["委屈"] }),
];

describe("圈宽", () => {
  it("按记录数变宽，带上下限", () => {
    expect(ringWidth(0)).toBe(MIN_RING_WIDTH);
    expect(ringWidth(1)).toBeGreaterThan(MIN_RING_WIDTH);
    expect(ringWidth(3)).toBeGreaterThan(ringWidth(2));
    expect(ringWidth(99)).toBe(MAX_RING_WIDTH);
  });
});

describe("圈的颜色由主导情绪决定", () => {
  it("没有情绪时用默认纸色", () => {
    expect(ringColor([])).toBe(DEFAULT_RING_COLOR);
    expect(ringColor(["莫名其妙"])).toBe(DEFAULT_RING_COLOR);
  });

  it("取出现最多的那个情绪的颜色", () => {
    expect(ringColor(["委屈", "委屈", "焦虑"])).toBe(EMOTION_COLORS["委屈"]);
    expect(ringColor(["焦虑"])).toBe(EMOTION_COLORS["焦虑"]);
  });

  it("并列时取先出现的", () => {
    expect(ringColor(["委屈", "焦虑"])).toBe(EMOTION_COLORS["委屈"]);
    expect(ringColor(["焦虑", "委屈"])).toBe(EMOTION_COLORS["焦虑"]);
  });
});

describe("按年 / 月 / 日分组", () => {
  it("按年分组，最早的一年在最前面（也就是最内圈）", () => {
    const years = groupByYear(memories);
    expect(years.map((y) => y.year)).toEqual([2024, 2026]);
    expect(years[0].memories.map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(years[1].memories.map((m) => m.id)).toEqual(["d", "e", "f"]);
  });

  it("年层每一圈带年份、条数、圈宽和颜色", () => {
    const rings = yearRings(memories);
    expect(rings).toHaveLength(2);
    expect(rings[0]).toMatchObject({ year: 2024, label: "2024", count: 3 });
    expect(rings[0].width).toBe(ringWidth(3));
    expect(rings[0].color).toBe(EMOTION_COLORS["委屈"]);
  });

  it("月层固定 12 圈，1 月在最内圈，没记录的月份是细线", () => {
    const months = monthRings(memories, 2024);
    expect(months).toHaveLength(12);
    expect(months[0].label).toBe("1月");
    expect(months[11].label).toBe("12月");
    expect(months[2]).toMatchObject({ count: 2, width: ringWidth(2) });
    expect(months[10]).toMatchObject({ count: 1, width: ringWidth(1) });
    expect(months[0]).toMatchObject({ count: 0, width: MIN_RING_WIDTH });
  });

  it("日层只显示有记录的日子", () => {
    const days = dayRings(memories, 2026, 3);
    expect(days.map((d) => d.label)).toEqual(["5日", "20日"]);
    expect(days[1]).toMatchObject({ count: 2, width: ringWidth(2) });
  });
});

describe("按主题筛选", () => {
  it("不筛时全亮，筛了就只亮符合条件的", () => {
    expect(highlightIds(memories, null)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(highlightIds(memories, "职场人际")).toEqual(["d", "e"]);
    expect(highlightIds(memories, "未来迷茫")).toEqual([]);
  });
});

describe("面包屑", () => {
  it("从全部逐级走到某一天", () => {
    expect(breadcrumbOf(null, null, null)).toEqual(["全部"]);
    expect(breadcrumbOf(2026, null, null)).toEqual(["全部", "2026"]);
    expect(breadcrumbOf(2026, 3, null)).toEqual(["全部", "2026", "3月"]);
    expect(breadcrumbOf(2026, 3, 12)).toEqual(["全部", "2026", "3月", "12日"]);
  });
});

describe("演示数据", () => {
  it("同一个种子给同样的记录", () => {
    expect(demoMemories(7, new Date("2026-10-08T12:00:00+08:00"))).toEqual(
      demoMemories(7, new Date("2026-10-08T12:00:00+08:00")),
    );
  });

  it("跨 2–3 年，够画出好看的圈，字段都合规矩", () => {
    const list = demoMemories(11, new Date("2026-10-08T12:00:00+08:00"));
    expect(list.length).toBeGreaterThanOrEqual(6);
    const years = new Set(list.map((m) => m.date.slice(0, 4)));
    expect(years.size).toBeGreaterThanOrEqual(2);
    expect(years.size).toBeLessThanOrEqual(3);
    for (const m of list) {
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(m.themes.length).toBeGreaterThan(0);
      expect(m.themes.length).toBeLessThanOrEqual(3);
      expect(m.title.length).toBeLessThanOrEqual(12);
      expect(m.summary.length).toBeLessThanOrEqual(60);
      if (m.moodBefore !== undefined) expect(m.moodBefore).toBeGreaterThanOrEqual(1);
      if (m.moodAfter !== undefined) expect(m.moodAfter).toBeLessThanOrEqual(10);
    }
    expect(new Set(list.map((m) => m.id)).size).toBe(list.length);
  });
});

describe("把年月日拼成日期串", () => {
  it("和库里存的 date 一致", () => {
    expect(dateKey(2026, 3, 12)).toBe("2026-03-12");
  });
});
