/**
 * 年轮的纯函数：分组、圈宽、配色、筛选、面包屑，以及开发模式的演示数据。
 * 这里不碰 DOM 也不碰数据库，界面上每一圈的几何都由这些函数算出来。
 */
import { ANIMAL_CAST, type AnimalId } from "../animals";
import type { Memory, Theme } from "../journal/types";
import { seeded } from "../paper/random";

/** 一圈最细多细、最粗多粗（文档 6.4：圈宽按记录数决定，设上下限） */
export const MIN_RING_WIDTH = 6;
export const MAX_RING_WIDTH = 26;
const WIDTH_STEP = 4;

/** 没有情绪线索时的纸色 */
export const DEFAULT_RING_COLOR = "#c9c0ae";

/** 敲树洞那十个情绪词各自的纸色（朱红、藕紫、暖黄、灰蓝……） */
export const EMOTION_COLORS: Record<string, string> = {
  愤怒: "#c4553f",
  委屈: "#8a7cb8",
  焦虑: "#d19a4a",
  失落: "#6b7f9e",
  疲惫: "#8f8f7a",
  羞愧: "#c98d96",
  孤独: "#7f8fa6",
  害怕: "#7a8a6f",
  不甘: "#b8703f",
  说不清: "#a89f92",
};

export interface RingSlice {
  /** 稳定的 key：2026 / 2026-03 / 2026-03-12 */
  key: string;
  /** 圈上写的字 */
  label: string;
  count: number;
  width: number;
  color: string;
  /** 这一圈里是哪些记录（按主题筛选高亮时要用） */
  ids: string[];
}

export interface YearRing extends RingSlice {
  year: number;
  memories: Memory[];
}

/** 记录越多圈越宽，夹在上下限之间 */
export function ringWidth(count: number): number {
  if (count <= 0) return MIN_RING_WIDTH;
  return Math.min(MIN_RING_WIDTH + count * WIDTH_STEP, MAX_RING_WIDTH);
}

/** 由主导情绪决定颜色：出现最多的那个；并列时取先出现的 */
export function ringColor(emotions: string[]): string {
  const counts = new Map<string, number>();
  for (const emotion of emotions) {
    if (!(emotion in EMOTION_COLORS)) continue;
    counts.set(emotion, (counts.get(emotion) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [emotion, count] of counts) {
    if (count > bestCount) {
      best = emotion;
      bestCount = count;
    }
  }
  return best === null ? DEFAULT_RING_COLOR : EMOTION_COLORS[best];
}

const yearOf = (m: Memory): number => Number(m.date.slice(0, 4));
const monthOf = (m: Memory): number => Number(m.date.slice(5, 7));
const dayOf = (m: Memory): number => Number(m.date.slice(8, 10));
const pad2 = (n: number): string => String(n).padStart(2, "0");

/** 按年分组，最早的一年在最前面（也就是最内圈） */
export function groupByYear(memories: Memory[]): { year: number; memories: Memory[] }[] {
  const buckets = new Map<number, Memory[]>();
  for (const m of memories) {
    const year = yearOf(m);
    const bucket = buckets.get(year);
    if (bucket) bucket.push(m);
    else buckets.set(year, [m]);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, list]) => ({ year, memories: list }));
}

const colorOf = (list: Memory[]): string => ringColor(list.flatMap((m) => m.emotions));

/** 年层：一圈一年 */
export function yearRings(memories: Memory[]): YearRing[] {
  return groupByYear(memories).map(({ year, memories: list }) => ({
    key: String(year),
    label: String(year),
    year,
    count: list.length,
    width: ringWidth(list.length),
    color: colorOf(list),
    ids: list.map((m) => m.id),
    memories: list,
  }));
}

/** 月层：固定 12 圈，1 月在最内圈；没记录的月份是浅色细线 */
export function monthRings(memories: Memory[], year: number): RingSlice[] {
  const inYear = memories.filter((m) => yearOf(m) === year);
  const out: RingSlice[] = [];
  for (let month = 1; month <= 12; month++) {
    const list = inYear.filter((m) => monthOf(m) === month);
    out.push({
      key: `${year}-${pad2(month)}`,
      label: `${month}月`,
      count: list.length,
      width: ringWidth(list.length),
      color: list.length > 0 ? colorOf(list) : DEFAULT_RING_COLOR,
      ids: list.map((m) => m.id),
    });
  }
  return out;
}

/** 日层：只显示有记录的日子 */
export function dayRings(memories: Memory[], year: number, month: number): RingSlice[] {
  const inMonth = memories.filter((m) => yearOf(m) === year && monthOf(m) === month);
  const days = [...new Set(inMonth.map(dayOf))].sort((a, b) => a - b);
  return days.map((day) => {
    const list = inMonth.filter((m) => dayOf(m) === day);
    return {
      key: `${year}-${pad2(month)}-${pad2(day)}`,
      label: `${day}日`,
      count: list.length,
      width: ringWidth(list.length),
      color: colorOf(list),
      ids: list.map((m) => m.id),
    };
  });
}

/** 按主题筛选时哪些记录要亮起来；不筛（null）时全亮 */
/** 把年月日拼成库里存的日期串：2026-03-12 */
export function dateKey(year: number, month: number, day: number): string {
  return year + "-" + pad2(month) + "-" + pad2(day);
}

export function highlightIds(memories: Memory[], theme: string | null): string[] {
  if (theme === null) return memories.map((m) => m.id);
  return memories.filter((m) => m.themes.includes(theme)).map((m) => m.id);
}

/** 面包屑：全部 › 2026 › 3月 › 12日 */
export function breadcrumbOf(year: number | null, month: number | null, day: number | null): string[] {
  const crumbs = ["全部"];
  if (year !== null) crumbs.push(String(year));
  if (year !== null && month !== null) crumbs.push(`${month}月`);
  if (year !== null && month !== null && day !== null) crumbs.push(`${day}日`);
  return crumbs;
}

/** 开发模式的演示数据模板（跨 2-3 年，用带种子的随机摆日子） */
const DEMO_TEMPLATES: {
  title: string;
  summary: string;
  emotions: string[];
  themes: Theme[];
  coreBelief: string;
  from: string;
  to: string;
  insight: string;
  action: string;
}[] = [
  {
    title: "那次汇报",
    summary: "汇报搞砸了，觉得自己不行。",
    emotions: ["委屈", "焦虑"],
    themes: ["工作压力"],
    coreBelief: "我什么都做不好",
    from: "我就是不行",
    to: "这次没做好，可以再练",
    insight: "一次汇报针对的是这件事，不是我这个人。",
    action: "明天先写三行提纲",
  },
  {
    title: "和朋友的那句话",
    summary: "朋友一句玩笑话，让我别扭了一整天。",
    emotions: ["委屈", "不甘"],
    themes: ["友情"],
    coreBelief: "他们其实不在意我",
    from: "她没把我当回事",
    to: "她那天也许只是累了",
    insight: "一句话不等于一段关系的全部。",
    action: "直接问问她那天怎么样",
  },
  {
    title: "夜里睡不着",
    summary: "凌晨三点醒着，越想越清醒。",
    emotions: ["焦虑", "疲惫"],
    themes: ["健康"],
    coreBelief: "我这样下去要垮掉了",
    from: "我必须马上睡着",
    to: "先躺着休息也算休息",
    insight: "睡不着的时候，陪着自己比催自己有用。",
    action: "睡前把手机放到客厅",
  },
  {
    title: "家里那通电话",
    summary: "和家里人通完电话，胸口闷闷的。",
    emotions: ["疲惫", "孤独"],
    themes: ["家庭"],
    coreBelief: "我怎么说他们都不会懂",
    from: "说了也没用",
    to: "我可以说我自己那一半",
    insight: "被理解不容易，但我可以先把自己的话说清楚。",
    action: "这周写一条消息，只说自己的感受",
  },
  {
    title: "钱的事",
    summary: "算了一晚上账单，越算越慌。",
    emotions: ["焦虑", "害怕"],
    themes: ["金钱"],
    coreBelief: "我永远攒不下钱",
    from: "我完蛋了",
    to: "这个月先看清账，再改一件小事",
    insight: "慌的时候，先把能看见的那一步做好。",
    action: "把三个固定支出写下来",
  },
  {
    title: "考试前一周",
    summary: "越临近考试越看不进去书。",
    emotions: ["焦虑", "羞愧"],
    themes: ["学业考试"],
    coreBelief: "我肯定过不了",
    from: "我准备得不够",
    to: "今天看一章就够",
    insight: "把大目标拆小，脑子才肯动。",
    action: "今天只做一套题的前十道",
  },
  {
    title: "一个人的周末",
    summary: "周末一个人待着，觉得空落落的。",
    emotions: ["孤独", "失落"],
    themes: ["孤独"],
    coreBelief: "没有人真的需要我",
    from: "我好孤单",
    to: "孤单的下午也可以做点温柔的事",
    insight: "孤单的时候，先把自己照顾好。",
    action: "出门走二十分钟，买一杯热的",
  },
  {
    title: "不知道往哪走",
    summary: "想了很久未来要做什么，越想越没底。",
    emotions: ["失落", "焦虑"],
    themes: ["未来迷茫"],
    coreBelief: "我好像一直在原地",
    from: "我不知道该干什么",
    to: "先试一件小事看看",
    insight: "方向不是想出来的，是走出来的。",
    action: "这周约一个人聊聊他的工作",
  },
];

/**
 * 演示数据：同一个种子给同样的记录，跨 2-3 年，用来检查年轮的样子。
 * 日子落在今天之前（当年最多到本月今天）。
 */
export function demoMemories(seed: number, today: Date = new Date()): Memory[] {
  const rng = seeded(seed);
  const currentYear = today.getFullYear();
  const yearCount = rng() < 0.5 ? 2 : 3;
  const years: number[] = [];
  for (let i = yearCount - 1; i >= 0; i--) years.push(currentYear - i);
  const helperPool: AnimalId[] = ANIMAL_CAST.map((a) => a.id);
  const out: Memory[] = [];
  DEMO_TEMPLATES.forEach((tpl, index) => {
    const year = years[index % years.length];
    const monthMax = year === currentYear ? today.getMonth() + 1 : 12;
    const month = 1 + Math.floor(rng() * monthMax);
    const dayMax = year === currentYear && month === today.getMonth() + 1 ? Math.max(1, today.getDate()) : 28;
    const day = 1 + Math.floor(rng() * dayMax);
    const before = 2 + Math.floor(rng() * 4);
    const after = Math.min(10, before + 2 + Math.floor(rng() * 3));
    out.push({
      id: `demo-${index + 1}`,
      sessionId: `demo-session-${index + 1}`,
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      title: tpl.title,
      summary: tpl.summary,
      emotions: [...tpl.emotions],
      themes: [...tpl.themes],
      coreBelief: tpl.coreBelief,
      shift: { from: tpl.from, to: tpl.to },
      insight: tpl.insight,
      action: tpl.action,
      helpfulAnimals: [helperPool[index % helperPool.length]],
      moodBefore: before,
      moodAfter: after,
    });
  });
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
