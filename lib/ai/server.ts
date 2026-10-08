/**
 * 路由拿 AI 的唯一入口。
 *
 * 没有 Key 时是 null（路由返回降级文案）；测试里用 __setServerAIForTest 注入假的，
 * 所以路由的测试不需要网络、也不需要 Key。
 */
import { defaultServerAI, type ServerAi } from "./anthropic";

let injected: ServerAi | null | undefined;

export function getServerAI(): ServerAi | null {
  if (injected !== undefined) return injected;
  return defaultServerAI();
}

export function __setServerAIForTest(ai: ServerAi | null): void {
  injected = ai;
}

export function __resetServerAIForTest(): void {
  injected = undefined;
}
