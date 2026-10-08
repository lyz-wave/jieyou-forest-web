/**
 * 模型返回值的类型与运行时守卫。
 * 原则：宁可判失败走降级，也不把半截内容画到界面上；不引第三方校验库，字段固定，手写就够。
 */
import { ANIMAL_CAST, type AnimalId, type CharacterId } from "@/lib/animals";
import {
  BUBBLE_MAX,
  BUBBLE_MIN,
  BREAKDOWN_MAX,
  REFRAME_KINDS,
  REFRAME_MAX,
  STEPS_MAX,
  STEPS_MIN,
  TRAP_KINDS,
  textLength,
  type BreakDownResult,
  type ReframeKind,
  type ReframeResult,
  type ReframeVersion,
  type Speaker,
  type SplitThoughtResult,
  type ThoughtAnswer,
  type ThoughtBubble,
  type TrapKind,
} from "./types";

/** 发言时的情绪，驱动动物的反应动画 */
export const MOODS = ["gentle", "thinking", "playful", "excited", "calm", "serious"] as const;
export type SpeechMood = (typeof MOODS)[number];

/** 各字段的字数上限（产品需求第十节） */
export const SPEECH_MAX = 80;
export const HEARD_MAX = 60;
export const VOICE_MAX = 40;
export const THOUGHT_MAX = 40;
export const QUESTION_MAX = 60;
export const SUMMARY_TOTAL_MAX = 200;
export const VOICES_MIN = 2;
export const VOICES_MAX = 3;
export const REPLY_MAX = 150;
export const RISK_REASON_MAX = 60;

export const RISK_LEVELS = ["none", "concern", "crisis"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface Speech {
  animal: AnimalId;
  text: string;
  mood: SpeechMood;
}

export interface RoundtableResult {
  speeches: Speech[];
}

export interface TreeVoice {
  animal: AnimalId;
  point: string;
}

export interface TreeSummary {
  heard: string;
  voices: TreeVoice[];
  thought: string;
  nextStep: string;
  question: string;
}

export interface ReplyResult {
  speaker: CharacterId;
  text: string;
}

export interface RiskResult {
  risk: RiskLevel;
  reason?: string;
}

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 多余的字段一律不接受：多出来说明模型没说我们要的东西 */
function hasOnlyKeys(value: Rec, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && textLength(value) > 0 && textLength(value) <= max;
}

export function isAnimalId(value: unknown): value is AnimalId {
  return typeof value === "string" && ANIMAL_CAST.some((animal) => animal.id === value);
}

/** 古树或七只动物（不含 user） */
export function isCharacterId(value: unknown): value is CharacterId {
  return value === "tree" || isAnimalId(value);
}

export function isSpeaker(value: unknown): value is Speaker {
  return isCharacterId(value);
}

/** 对话记录里说话的人：用户、古树、七只动物（追问的回答人不用这个，它不认 user） */
export function isTalker(value: unknown): value is Speaker {
  return value === "user" || isSpeaker(value);
}

export function isMood(value: unknown): value is SpeechMood {
  return typeof value === "string" && MOODS.includes(value as SpeechMood);
}

/** 圆桌：七只各一句，不重不漏 */
export function parseRoundtable(value: unknown): RoundtableResult | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["speeches"])) return null;
  const { speeches } = value;
  if (!Array.isArray(speeches) || speeches.length !== ANIMAL_CAST.length) return null;
  const seen = new Set<string>();
  const parsed: Speech[] = [];
  for (const item of speeches) {
    if (!isRecord(item) || !hasOnlyKeys(item, ["animal", "text", "mood"])) return null;
    const { animal, text, mood } = item;
    if (!isAnimalId(animal) || seen.has(animal)) return null;
    if (!isText(text, SPEECH_MAX) || !isMood(mood)) return null;
    seen.add(animal);
    parsed.push({ animal, text: text.trim(), mood });
  }
  return { speeches: parsed };
}

/** 古树总结：五段齐全，且总字数不超过 200 */
export function parseSummary(value: unknown): TreeSummary | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["heard", "voices", "thought", "nextStep", "question"])) return null;
  const { heard, voices, thought, nextStep, question } = value;
  if (!isText(heard, HEARD_MAX) || !isText(thought, THOUGHT_MAX)) return null;
  if (!isText(nextStep, THOUGHT_MAX) || !isText(question, QUESTION_MAX)) return null;
  if (!Array.isArray(voices) || voices.length < VOICES_MIN || voices.length > VOICES_MAX) return null;
  const parsedVoices: TreeVoice[] = [];
  for (const voice of voices) {
    if (!isRecord(voice) || !hasOnlyKeys(voice, ["animal", "point"])) return null;
    if (!isAnimalId(voice.animal) || !isText(voice.point, VOICE_MAX)) return null;
    parsedVoices.push({ animal: voice.animal, point: voice.point.trim() });
  }
  const total =
    textLength(heard) +
    textLength(thought) +
    textLength(nextStep) +
    textLength(question) +
    parsedVoices.reduce((sum, voice) => sum + textLength(voice.point), 0);
  if (total > SUMMARY_TOTAL_MAX) return null;
  return {
    heard: heard.trim(),
    voices: parsedVoices,
    thought: thought.trim(),
    nextStep: nextStep.trim(),
    question: question.trim(),
  };
}

/** 追问：古树或七只动物之一说的，最多 150 字 */
export function parseReply(value: unknown): ReplyResult | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["speaker", "text"])) return null;
  const { speaker, text } = value;
  if (!isCharacterId(speaker) || !isText(text, REPLY_MAX)) return null;
  return { speaker, text: text.trim() };
}

/** 风险：三档，reason 可以有但不许超长 */
export function parseRisk(value: unknown): RiskResult | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["risk", "reason"])) return null;
  const { risk, reason } = value;
  if (typeof risk !== "string" || !RISK_LEVELS.includes(risk as RiskLevel)) return null;
  const level = risk as RiskLevel;
  if (reason === undefined) return { risk: level };
  if (!isText(reason, RISK_REASON_MAX)) return null;
  return { risk: level, reason: reason.trim() };
}
/** 拆一拆：一片一句话，长度给得比圆桌宽——它要装下用户原话里的片段 */
export const BUBBLE_TEXT_MAX = 100;

function isTrap(value: unknown): value is TrapKind {
  return typeof value === "string" && TRAP_KINDS.some((kind) => kind === value);
}

function isReframeKind(value: unknown): value is ReframeKind {
  return typeof value === "string" && REFRAME_KINDS.some((kind) => kind === value);
}

/** 拆一拆：1–5 片、id 不重复、answer 只有两种、trap 可省 */
export function parseSplitThought(value: unknown): SplitThoughtResult | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["bubbles"]) || !Array.isArray(value.bubbles)) return null;
  const raw = value.bubbles;
  if (raw.length < BUBBLE_MIN || raw.length > BUBBLE_MAX) return null;
  const bubbles: ThoughtBubble[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item) || !hasOnlyKeys(item, ["id", "text", "answer", "trap"])) return null;
    const id = item.id;
    const text = item.text;
    const answer = item.answer;
    const trap = item.trap;
    if (typeof id !== "string" || !id || id.length > 20 || seen.has(id)) return null;
    if (!isText(text, BUBBLE_TEXT_MAX)) return null;
    if (answer !== "fact" && answer !== "guess") return null;
    if (trap !== undefined && !isTrap(trap)) return null;
    seen.add(id);
    const bubble: ThoughtBubble = { id, text, answer: answer as ThoughtAnswer };
    if (trap !== undefined) bubble.trap = trap;
    bubbles.push(bubble);
  }
  return { bubbles };
}

/** 翻面镜：三种说法各一条，不重不漏（少一条就整份判失败，界面上是三个卡位） */
export function parseReframe(value: unknown): ReframeResult | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["versions"]) || !Array.isArray(value.versions)) return null;
  const raw = value.versions;
  if (raw.length !== REFRAME_KINDS.length) return null;
  const versions: ReframeVersion[] = [];
  const seen = new Set<ReframeKind>();
  for (const item of raw) {
    if (!isRecord(item) || !hasOnlyKeys(item, ["kind", "text"])) return null;
    const kind = item.kind;
    const text = item.text;
    if (!isReframeKind(kind) || seen.has(kind)) return null;
    if (!isText(text, REFRAME_MAX)) return null;
    seen.add(kind);
    versions.push({ kind, text });
  }
  return { versions };
}

/** 藏坚果：3–5 步，每步 1–60 字 */
export function parseBreakDown(value: unknown): BreakDownResult | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["steps"]) || !Array.isArray(value.steps)) return null;
  const raw = value.steps;
  if (raw.length < STEPS_MIN || raw.length > STEPS_MAX) return null;
  const steps: string[] = [];
  for (const item of raw) {
    if (!isText(item, BREAKDOWN_MAX)) return null;
    steps.push(item);
  }
  return { steps };
}