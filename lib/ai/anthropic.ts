/**
 * 服务端的一次模型调用：组 Prompt → 发请求 → 严格校验。
 *
 * 只读的边界在这里：Key 从环境变量读、从不写进错误信息；任何一步失败都返回 null，
 * 由调用方（Route Handler）决定怎么降级，绝不让用户写的话出现在日志里。
 */
import type { CharacterId } from "@/lib/animals";
import { breakDownPrompt, memoryPrompt, reframePrompt, replyPrompt, riskPrompt, roundtablePrompt, splitThoughtPrompt, summaryPrompt, type Prompt, type PromptContext } from "@/lib/prompts";
import {
  parseBreakDown,
  parseMemory,
  parseReframe,
  parseReply,
  parseRisk,
  parseRoundtable,
  parseSplitThought,
  parseSummary,
  type ReplyResult,
  type RiskResult,
  type RoundtableResult,
  type TreeSummary,
} from "./schema";
import type { MemoryDraft } from "@/lib/journal/types";
import type { BreakDownResult, ReframeResult, SplitThoughtResult } from "./types";

/** 文档里写的模型名；上线前要确认这两个 ID 真的可用，也可以直接用环境变量换掉 */
export const DEFAULT_MODEL_MAIN = "claude-sonnet-5";
export const DEFAULT_MODEL_LIGHT = "claude-haiku-4-5-20251001";
export const MAX_TOKENS_MAIN = 2000;
export const MAX_TOKENS_LIGHT = 300;
/** 小游戏的输出很短（几片句子、三种说法、几步），用主模型但不必给它太多额度 */
export const MAX_TOKENS_GAME = 800;
export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";

export interface TransportOptions {
  model: string;
  maxTokens: number;
}

/** 拿到 Prompt 返回已经解析好的 JSON；失败就抛错 */
export type AiTransport = (prompt: Prompt, options: TransportOptions) => Promise<unknown>;

export interface ServerAiOptions {
  transport: AiTransport;
  modelMain: string;
  modelLight: string;
}

export interface ServerAi {
  roundtable(context: PromptContext): Promise<RoundtableResult | null>;
  summary(context: PromptContext): Promise<TreeSummary | null>;
  reply(context: PromptContext & { target: CharacterId }): Promise<ReplyResult | null>;
  risk(text: string): Promise<RiskResult | null>;
  /** 结束后把整段对话沉淀成成长卡片（文档 10.4） */
  memory(context: PromptContext): Promise<MemoryDraft | null>;
  splitThought(text: string): Promise<SplitThoughtResult | null>;
  reframe(text: string): Promise<ReframeResult | null>;
  breakDown(text: string): Promise<BreakDownResult | null>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 把模型的话读成 JSON：纯 JSON、```json 围栏、前后夹着解释文字都能读 */
export function parseModelJson(raw: string): unknown {
  const text = raw.trim();
  if (!text) return null;
  const candidates: string[] = [text];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // 换下一种切法再试
    }
  }
  return null;
}

/** Anthropic 响应里第一段文本 */
function firstText(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.content)) return null;
  for (const block of payload.content) {
    if (isRecord(block) && block.type === "text" && typeof block.text === "string") return block.text;
  }
  return null;
}

/** 默认 transport：一次 fetch。抛错只带状态码，不带用户写的话 */
export function createAnthropicTransport(apiKey: string): AiTransport {
  return async (prompt, { model, maxTokens }) => {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
    });
    if (!response.ok) throw new Error("anthropic " + String(response.status));
    const text = firstText(await response.json());
    if (text === null) throw new Error("anthropic empty response");
    return parseModelJson(text);
  };
}

export function createServerAI(options: ServerAiOptions): ServerAi {
  const { transport, modelMain, modelLight } = options;

  async function ask(prompt: Prompt, model: string, maxTokens: number): Promise<unknown> {
    try {
      return await transport(prompt, { model, maxTokens });
    } catch {
      return null;
    }
  }

  return {
    async roundtable(context) {
      return parseRoundtable(await ask(roundtablePrompt(context), modelMain, MAX_TOKENS_MAIN));
    },
    async summary(context) {
      return parseSummary(await ask(summaryPrompt(context), modelMain, MAX_TOKENS_MAIN));
    },
    async memory(context) {
      return parseMemory(await ask(memoryPrompt(context), modelMain, MAX_TOKENS_MAIN));
    },
    async reply(context) {
      return parseReply(await ask(replyPrompt(context), modelMain, MAX_TOKENS_MAIN));
    },
    async risk(text) {
      return parseRisk(await ask(riskPrompt(text), modelLight, MAX_TOKENS_LIGHT));
    },
    async splitThought(text) {
      return parseSplitThought(await ask(splitThoughtPrompt(text), modelMain, MAX_TOKENS_GAME));
    },
    async reframe(text) {
      return parseReframe(await ask(reframePrompt(text), modelMain, MAX_TOKENS_GAME));
    },
    async breakDown(text) {
      return parseBreakDown(await ask(breakDownPrompt(text), modelMain, MAX_TOKENS_GAME));
    },
  };
}

/** 环境变量齐了才给实现；没有 Key 就是 null，路由直接走降级，一次请求都不发 */
export function defaultServerAI(env: Record<string, string | undefined> = process.env): ServerAi | null {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const modelMain = env.JIEYOU_MODEL_MAIN?.trim() || DEFAULT_MODEL_MAIN;
  const modelLight = env.JIEYOU_MODEL_LIGHT?.trim() || DEFAULT_MODEL_LIGHT;
  return createServerAI({ transport: createAnthropicTransport(apiKey), modelMain, modelLight });
}