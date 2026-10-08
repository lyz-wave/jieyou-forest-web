import type { CharacterId } from "@/lib/animals";
import { postJson, type FetchLike } from "@/lib/ai/client";
import {
  parseReply,
  parseRisk,
  parseRoundtable,
  parseSummary,
  type ReplyResult,
  type RiskResult,
  type RoundtableResult,
  type TreeSummary,
} from "@/lib/ai/schema";
import type { PromptContext } from "@/lib/prompts";

/** 倾诉流程要的四件事，都走自家接口 */
export interface TalkApi {
  roundtable(context: PromptContext): Promise<RoundtableResult>;
  summary(context: PromptContext): Promise<TreeSummary>;
  reply(context: PromptContext, target: CharacterId): Promise<ReplyResult>;
  risk(text: string): Promise<RiskResult>;
}

export function createTalkApi(config: { fetch?: FetchLike } = {}): TalkApi {
  return {
    roundtable: (context: PromptContext): Promise<RoundtableResult> =>
      postJson("/api/roundtable", context, parseRoundtable, { fetch: config.fetch }),
    summary: (context: PromptContext): Promise<TreeSummary> =>
      postJson("/api/summary", context, parseSummary, { fetch: config.fetch }),
    reply: (context: PromptContext, target: CharacterId): Promise<ReplyResult> =>
      postJson("/api/reply", { ...context, target }, parseReply, { fetch: config.fetch }),
    risk: (text: string): Promise<RiskResult> => postJson("/api/risk", { text }, parseRisk, { fetch: config.fetch }),
  };
}
