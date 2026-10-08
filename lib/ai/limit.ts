/**
 * 每个 IP 的限流：一分钟最多这么多次。
 *
 * 它挡的是「一台机器不停地刷」和手滑连点，不是有备而来的分布式滥用——
 * 计数器放在 Worker 进程的内存里，不跨 isolate、不跨机房，重启就归零。
 * 所以真正的花钱上限要去 Anthropic 后台设，这里只是第一道篱笆。
 * 一行日志都不写：记的是 IP 和次数，不记用户写的话（见 lib/ai/route.ts 开头）。
 */
export interface LimitRule {
  windowMs: number;
  max: number;
}

/** 一分钟 20 次，够一个人从头到尾走完一次倾诉（一次大约 5 到 8 个请求） */
export const LIMIT_RULE: LimitRule = { windowMs: 60_000, max: 20 };

/** 记着的 IP 最多这么多，超了就丢最早的，免得内存无限涨 */
export const MAX_KEYS = 2000;

export interface LimitVerdict {
  allowed: boolean;
  /** 被挡下来时，多少秒之后可以再来（给 Retry-After 用） */
  retryAfterSec: number;
}

export interface RateLimiter {
  check(key: string): LimitVerdict;
  /** 现在记着多少个 IP，用来验证不会无限涨 */
  size(): number;
}

export function createRateLimiter(rule: LimitRule = LIMIT_RULE, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>();

  function forget(olderThan: number): void {
    for (const [key, stamps] of hits) {
      const latest = stamps[stamps.length - 1];
      if (latest === undefined || olderThan - latest >= rule.windowMs) hits.delete(key);
    }
  }

  function makeRoom(at: number): void {
    forget(at);
    // 还是满的（短时间内来了很多新 IP）：丢最早记下的那几个
    while (hits.size >= MAX_KEYS) {
      const oldest = hits.keys().next();
      if (oldest.done === true) return;
      hits.delete(oldest.value);
    }
  }

  return {
    check(key: string): LimitVerdict {
      const at = now();
      if (!hits.has(key) && hits.size >= MAX_KEYS) makeRoom(at);
      const fresh = (hits.get(key) ?? []).filter((stamp) => at - stamp < rule.windowMs);
      if (fresh.length >= rule.max) {
        hits.set(key, fresh);
        const oldest = fresh[0] ?? at;
        const wait = oldest + rule.windowMs - at;
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(wait / 1000)) };
      }
      fresh.push(at);
      hits.set(key, fresh);
      return { allowed: true, retryAfterSec: 0 };
    },
    size: () => hits.size,
  };
}

/** Cloudflare 会把真实访客 IP 放在 cf-connecting-ip；本地跑就是 local */
export function clientKey(request: Request): string {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct !== null && direct.trim() !== "") return direct.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded === null ? "" : (forwarded.split(",")[0] ?? "").trim();
  if (first !== "") return first;
  return "local";
}

let shared: RateLimiter | null = null;

function defaultLimiter(): RateLimiter {
  if (shared === null) shared = createRateLimiter();
  return shared;
}

/** 这个请求还让不让进 */
export function checkLimit(request: Request): LimitVerdict {
  return defaultLimiter().check(clientKey(request));
}

/** 测试用：把共用计数器清空 */
export function __resetLimitForTest(): void {
  shared = null;
}
