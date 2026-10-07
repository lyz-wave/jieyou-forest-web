/**
 * 森林 AI 的接口约定。
 * 第一阶段只有本地 mock（./mock.ts），第二阶段接真模型时只换 ./index.ts 里的实现，小游戏代码不动。
 */

/** 一句话要么是发生过的事实，要么是心里下的判断 */
export type ThoughtAnswer = "fact" | "guess";

export type TrapKind = "catastrophe" | "mind-reading" | "all-or-nothing" | "overgeneralize";

export interface TrapInfo {
  name: string;
  /** 一句话解释，用不着术语 */
  note: string;
}

export const TRAP_KINDS: readonly TrapKind[] = ["catastrophe", "mind-reading", "all-or-nothing", "overgeneralize"];

export const TRAPS: Record<TrapKind, TrapInfo> = {
  catastrophe: { name: "灾难化", note: "把最坏的可能，当成了注定会发生的结局。" },
  "mind-reading": { name: "读心术", note: "替别人下了结论，却没有真的问过。" },
  "all-or-nothing": { name: "非黑即白", note: "只留下成和败两种结果，中间没有别的可能。" },
  overgeneralize: { name: "以偏概全", note: "用一件事的结果，推断了所有事。" },
};

export interface ThoughtBubble {
  id: string;
  text: string;
  /** 标准答案：这句是事实，还是猜测 */
  answer: ThoughtAnswer;
  /** 只有猜测才可能带的思维陷阱 */
  trap?: TrapKind;
}

export interface SplitThoughtResult {
  bubbles: ThoughtBubble[];
}

export type ReframeKind = "humor" | "warm" | "realistic";

export const REFRAME_KINDS: readonly ReframeKind[] = ["humor", "warm", "realistic"];

export const REFRAME_LABELS: Record<ReframeKind, string> = {
  humor: "幽默版",
  warm: "温柔版",
  realistic: "现实版",
};

export interface ReframeVersion {
  kind: ReframeKind;
  text: string;
}

export interface ReframeResult {
  versions: ReframeVersion[];
}

export interface BreakDownResult {
  steps: string[];
}

export interface AiOptions {
  signal?: AbortSignal;
}

export interface ForestAI {
  /** 把一段心事拆成几句话，标出哪句是事实、哪句是猜测 */
  splitThought(text: string, options?: AiOptions): Promise<SplitThoughtResult>;
  /** 换三个角度把同一句话再说一遍 */
  reframe(text: string, options?: AiOptions): Promise<ReframeResult>;
  /** 拆成今天就能做的小步骤 */
  breakDown(text: string, options?: AiOptions): Promise<BreakDownResult>;
}

/** 各输入框的字数限制（规格里的数值） */
export const THOUGHT_MIN = 1;
export const THOUGHT_MAX = 100;
export const REFRAME_MIN = 1;
export const REFRAME_MAX = 60;
export const BREAKDOWN_MIN = 1;
export const BREAKDOWN_MAX = 60;
/** 气泡与步骤的数量 */
export const BUBBLE_MIN = 1;
export const BUBBLE_MAX = 5;
export const STEPS_MIN = 3;
export const STEPS_MAX = 5;
/** 本阶段 mock 的等待时间 */
export const AI_DELAY_MIN = 600;
export const AI_DELAY_MAX = 1200;
/** 请求失败时动物说的话。mock 与界面共用这一句，免得两处文案漂移。 */
export const AI_FAILURE_LINE = "风太大了没听清，能再说一次吗？";

/** 按字符数算长度（中文一个字算一个），忽略首尾空白 */
export function textLength(text: string): number {
  return [...text.trim()].length;
}

export function isValidInput(text: string, min: number, max: number): boolean {
  const length = textLength(text);
  return length >= min && length <= max;
}
