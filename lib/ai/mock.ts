/**
 * 第一阶段的假 AI：不联网，结果只由输入决定，同样的输入永远给同样的答案。
 * 第二阶段换成真模型时，只要仍然满足 ./types.ts 里的 ForestAI 接口即可。
 */
import { between, seeded, type Rng } from "@/lib/paper/random";
import {
  AI_DELAY_MAX,
  AI_DELAY_MIN,
  AI_FAILURE_LINE,
  BUBBLE_MAX,
  REFRAME_KINDS,
  STEPS_MAX,
  STEPS_MIN,
  type AiOptions,
  type BreakDownResult,
  type ForestAI,
  type ReframeResult,
  type SplitThoughtResult,
  type ThoughtAnswer,
  type ThoughtBubble,
  type TrapKind,
} from "./types";

/** 心里下的判断：出现这些词，多半不是「发生了什么」，而是「我怎么想」 */
const GUESS_MARKERS: readonly string[] = [
  "一定",
  "肯定",
  "绝对",
  "总是",
  "永远",
  "从来",
  "每次",
  "都",
  "没人",
  "大家",
  "所有人",
  "别人",
  "会不会",
  "是不是",
  "也许",
  "可能",
  "大概",
  "觉得",
  "担心",
  "害怕",
  "怕",
  "完蛋",
  "没救",
  "受不了",
  "怎么办",
  "应该",
  "必须",
  "看不起",
  "讨厌我",
];

/** 思维陷阱的词表；按顺序匹配，第一个命中的算（先看最伤人的那类） */
const TRAP_MARKERS: readonly (readonly [TrapKind, readonly string[]])[] = [
  ["catastrophe", ["完蛋", "没救", "全完了", "最坏", "再也", "永远", "受不了", "死定了", "全都完了"]],
  ["mind-reading", ["大家", "所有人", "别人", "他们都", "看不起", "讨厌我", "觉得我", "嫌我"]],
  ["all-or-nothing", ["只有", "要么", "全都", "一点也不", "从来都不", "什么都", "一个都"]],
  ["overgeneralize", ["总是", "从来", "每次", "一直", "所有"]],
];

/** 发生过的事：时间、数量、动作 */
const FACT_MARKERS: readonly string[] = [
  "今天",
  "昨天",
  "明天",
  "现在",
  "刚才",
  "已经",
  "上周",
  "下周",
  "上个月",
  "下个月",
  "早上",
  "中午",
  "晚上",
  "说了",
  "做了",
  "完成",
  "发生",
  "收到",
  "发了",
  "去了",
  "打电话",
];

const CLAUSE_SPLIT = /[。！？!?；;，,\n]+/;

function clausesOf(text: string): string[] {
  const clauses = text
    .split(CLAUSE_SPLIT)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);
  if (clauses.length <= BUBBLE_MAX) return clauses;
  const head = clauses.slice(0, BUBBLE_MAX - 1);
  const tail = clauses.slice(BUBBLE_MAX - 1).join("，");
  return [...head, tail];
}

function trapOf(clause: string): TrapKind | null {
  for (const [kind, markers] of TRAP_MARKERS) {
    if (markers.some((marker) => clause.includes(marker))) return kind;
  }
  return null;
}

function answerOf(clause: string): { answer: ThoughtAnswer; trap?: TrapKind } {
  const trap = trapOf(clause);
  if (trap) return { answer: "guess", trap };
  if (GUESS_MARKERS.some((marker) => clause.includes(marker))) return { answer: "guess" };
  if (FACT_MARKERS.some((marker) => clause.includes(marker))) return { answer: "fact" };
  // 没有凭据的判断，默认当成猜测
  return { answer: "guess" };
}

function splitThoughtOf(text: string): SplitThoughtResult {
  const bubbles: ThoughtBubble[] = clausesOf(text).map((clause, index) => ({
    id: "b" + (index + 1),
    text: clause,
    ...answerOf(clause),
  }));
  return { bubbles };
}

/** 把一句话缩成能放进模板里的短词 */
function topicOf(text: string): string {
  const plain = text.replace(/[\s，,。！？!?；;、]+/g, "");
  const chars = [...plain];
  const short = chars.length > 12 ? chars.slice(0, 12).join("") : plain;
  return short.length > 0 ? short : "这件事";
}

const STEP_TEMPLATES: readonly ((topic: string) => string)[] = [
  (topic) => "把「" + topic + "」写成一句话，删到只剩最要紧的半句",
  (topic) => "今天先做 5 分钟：打开「" + topic + "」里最小的一件事",
  (topic) => "给「" + topic + "」列三个具体问题，挑一个今天问得出口的",
  (topic) => "把「" + topic + "」要用的东西先找齐，摆在桌上",
  (topic) => "定一个 25 分钟的闹钟，只处理「" + topic + "」的第一步",
  (topic) => "找一个人说说「" + topic + "」，只说现在的难处，不求建议",
  (topic) => "把「" + topic + "」里今天做不了的部分写在纸上，先放一边",
  (topic) => "给「" + topic + "」设一个不可能失败的开始：打开它，看一眼就够",
  (topic) => "给「" + topic + "」写一个明天的小约定，具体到几点做什么",
  (topic) => "问问自己：「" + topic + "」里哪一件是我能决定的？只做那一件",
];

const REFRAME_TEMPLATES: Record<string, readonly ((topic: string) => string)[]> = {
  humor: [
    (topic) => "「" + topic + "」——听着像是我给自己打了个差评，还顺手点了收藏。",
    (topic) => "如果朋友这样跟我说「" + topic + "」，我大概会先笑一下，再递杯热水。",
    (topic) => "「" + topic + "」这句话的语气比内容大得多，像只纸老虎在吼。",
  ],
  warm: [
    (topic) => "说「" + topic + "」的时候，你已经很累了。先别急着改，陪我坐一会儿。",
    (topic) => "「" + topic + "」我听见了。它背后是想要做好，不是不够好。",
    (topic) => "如果这是我最好的朋友说的「" + topic + "」，我会先抱抱他，再一起想办法。",
  ],
  realistic: [
    (topic) => "「" + topic + "」里确定的部分：现在确实有件事没做好。剩下的还没发生，等它发生再说。",
    (topic) => "关于「" + topic + "」：能改的只有下一步，改不了的是已经过去的那些。",
    (topic) => "「" + topic + "」——把它缩小到「这一件事这次没做好」，就有下手的地方了。",
  ],
};

/** 从池子里不重复地抽 count 个（种子随机，同样的输入抽到同样的一批） */
function pick<T>(rng: Rng, pool: readonly T[], count: number): T[] {
  const rest = [...pool];
  const out: T[] = [];
  const wanted = Math.min(count, rest.length);
  for (let i = 0; i < wanted; i += 1) {
    const at = Math.floor(rng() * rest.length);
    out.push(rest.splice(at, 1)[0]);
  }
  return out;
}

function breakDownOf(rng: Rng, text: string): BreakDownResult {
  const topic = topicOf(text);
  const count = STEPS_MIN + Math.floor(rng() * (STEPS_MAX - STEPS_MIN + 1));
  return { steps: pick(rng, STEP_TEMPLATES, count).map((make) => make(topic)) };
}

function reframeOf(rng: Rng, text: string): ReframeResult {
  const topic = topicOf(text);
  const versions = REFRAME_KINDS.map((kind) => {
    const [make] = pick(rng, REFRAME_TEMPLATES[kind], 1);
    return { kind, text: make(topic) };
  });
  return { versions };
}

function abortError(): Error {
  const error = new Error("请求已取消");
  error.name = "AbortError";
  return error;
}

/** 等一会儿再回话；中途被中止就立刻 reject，不再等定时器 */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort);
  });
}

export interface MockAIConfig {
  /** 每次请求等多久；默认 600–1200ms，由输入决定所以是确定的 */
  delayMs?: (rng: Rng) => number;
  /** 返回 true 时所有请求都失败（开发模式的开关用它） */
  shouldFail?: () => boolean;
}

export function createMockAI(config: MockAIConfig = {}): ForestAI {
  const delayOf = config.delayMs ?? ((rng: Rng) => between(rng, AI_DELAY_MIN, AI_DELAY_MAX));

  async function respond<T>(text: string, options: AiOptions | undefined, build: (rng: Rng) => T): Promise<T> {
    const rng = seeded(text);
    await wait(delayOf(rng), options?.signal);
    if (config.shouldFail?.()) throw new Error(AI_FAILURE_LINE);
    return build(rng);
  }

  return {
    splitThought: (text, options) => respond(text, options, () => splitThoughtOf(text)),
    reframe: (text, options) => respond(text, options, (rng) => reframeOf(rng, text)),
    breakDown: (text, options) => respond(text, options, (rng) => breakDownOf(rng, text)),
  };
}
