import { describe, expect, it } from "vitest";
import {
  BEAR_HUG_PHRASES,
  HEARTBEAT_MS,
  HUG_BRIGHT_MS,
  HUG_MIN_MS,
  TOO_SHORT_LINE,
  bearHugContext,
  heartbeatPulse,
  hugGlow,
  pickNoRepeat,
} from "./bear-hug";

describe("熊抱的暖光曲线", () => {
  it("刚开始是暗的，10 秒时最亮", () => {
    expect(hugGlow(0)).toBe(0);
    expect(hugGlow(HUG_BRIGHT_MS)).toBe(1);
  });

  it("越按越亮且不会超过 1", () => {
    expect(hugGlow(2500)).toBeGreaterThan(hugGlow(1000));
    expect(hugGlow(5000)).toBeGreaterThan(hugGlow(2500));
    expect(hugGlow(20000)).toBe(1);
  });

  it("5 秒时大约七成半（先快后慢）", () => {
    expect(hugGlow(5000)).toBeCloseTo(0.75, 5);
  });

  it("负数按 0 算", () => {
    expect(hugGlow(-100)).toBe(0);
  });
});

describe("心跳节奏", () => {
  it("每分钟 60 次：每 1000ms 一下", () => {
    expect(HEARTBEAT_MS).toBe(1000);
    expect(heartbeatPulse(0)).toBeCloseTo(1, 5);
    expect(heartbeatPulse(HEARTBEAT_MS)).toBeCloseTo(1, 5);
  });

  it("一下之后迅速回落，下一拍之前是平静的", () => {
    expect(heartbeatPulse(200)).toBeLessThan(0.5);
    expect(heartbeatPulse(600)).toBe(0);
    expect(heartbeatPulse(900)).toBe(0);
  });
});

describe("团团说的话", () => {
  it("文案库至少 20 句，都不重复也不为空", () => {
    expect(BEAR_HUG_PHRASES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(BEAR_HUG_PHRASES).size).toBe(BEAR_HUG_PHRASES.length);
    for (const line of BEAR_HUG_PHRASES) expect(line.trim().length).toBeGreaterThan(0);
  });

  it("同一次访问内不连续重复", () => {
    const rng = () => 0;
    const first = pickNoRepeat(null, rng);
    const second = pickNoRepeat(first, rng);
    expect(second).not.toBe(first);
    expect(BEAR_HUG_PHRASES).toContain(first);
    expect(BEAR_HUG_PHRASES).toContain(second);
  });

  it("没抱够 1 秒时的提示语", () => {
    expect(HUG_MIN_MS).toBe(1000);
    expect(TOO_SHORT_LINE).toBe("抱久一点点也没关系");
  });

  it("gameContext 记的是抱了几秒（四舍五入到整秒）", () => {
    expect(bearHugContext(6000)).toBe("和团团抱了 6 秒");
    expect(bearHugContext(6400)).toBe("和团团抱了 6 秒");
    expect(bearHugContext(6600)).toBe("和团团抱了 7 秒");
    expect(bearHugContext(999)).toBeNull();
  });
});