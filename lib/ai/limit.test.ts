import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter, LIMIT_RULE, MAX_KEYS } from "./limit";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/risk", { method: "POST", headers });
}

describe("每个 IP 的限流", () => {
  it("一分钟里放行到第 20 次，第 21 次挡下来", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < LIMIT_RULE.max; i += 1) {
      expect(limiter.check("1.2.3.4").allowed).toBe(true);
    }
    const blocked = limiter.check("1.2.3.4");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("过了窗口又放进来", () => {
    let now = 1_000_000;
    const limiter = createRateLimiter(LIMIT_RULE, () => now);
    for (let i = 0; i < LIMIT_RULE.max; i += 1) limiter.check("1.1.1.1");
    expect(limiter.check("1.1.1.1").allowed).toBe(false);
    now += LIMIT_RULE.windowMs + 1;
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("换个 IP 是另一个人，不受影响", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < LIMIT_RULE.max; i += 1) limiter.check("1.1.1.1");
    expect(limiter.check("1.1.1.1").allowed).toBe(false);
    expect(limiter.check("2.2.2.2").allowed).toBe(true);
  });

  it("记着的 IP 有个上限，不会一直涨", () => {
    let now = 0;
    const limiter = createRateLimiter(LIMIT_RULE, () => now);
    for (let i = 0; i < MAX_KEYS + 200; i += 1) {
      now += 1;
      limiter.check("ip-" + String(i));
    }
    expect(limiter.size()).toBeLessThanOrEqual(MAX_KEYS);
  });

  it("IP 从 Cloudflare 的头里读，读不到就按本地算", () => {
    expect(clientKey(requestWith({ "cf-connecting-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientKey(requestWith({ "x-forwarded-for": "8.8.8.8, 7.7.7.7" }))).toBe("8.8.8.8");
    expect(clientKey(requestWith({}))).toBe("local");
    expect(clientKey(requestWith({ "cf-connecting-ip": "  " }))).toBe("local");
  });
});
