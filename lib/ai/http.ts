import { postJson, type FetchLike } from "./client";
import { parseBreakDown, parseReframe, parseSplitThought } from "./schema";
import {
  AI_FAILURE_LINE,
  type AiOptions,
  type BreakDownResult,
  type ForestAI,
  type ReframeResult,
  type SplitThoughtResult,
} from "./types";

export type { FetchLike };

export interface HttpAIConfig {
  /** 省着用全局 fetch；测试注入用这个 */
  fetch?: FetchLike;
  /** 返回 true 时所有请求都失败（开发模式的开关用它） */
  shouldFail?: () => boolean;
}

/** 小游戏用的森林 AI：把三件事各自 POST 到自家接口 */
export function createHttpAI(config: HttpAIConfig = {}): ForestAI {
  async function ask<T>(
    path: string,
    text: string,
    options: AiOptions | undefined,
    parse: (value: unknown) => T | null,
  ): Promise<T> {
    if (config.shouldFail?.()) throw new Error(AI_FAILURE_LINE);
    return postJson(path, { text }, parse, { fetch: config.fetch, signal: options?.signal });
  }

  return {
    splitThought: (text: string, options?: AiOptions): Promise<SplitThoughtResult> =>
      ask("/api/split-thought", text, options, parseSplitThought),
    reframe: (text: string, options?: AiOptions): Promise<ReframeResult> =>
      ask("/api/reframe", text, options, parseReframe),
    breakDown: (text: string, options?: AiOptions): Promise<BreakDownResult> =>
      ask("/api/break-down", text, options, parseBreakDown),
  };
}
