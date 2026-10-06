import { describe, expect, it } from "vitest";
import type { AnimalId } from "../animals";
import { createWanderScheduler } from "./scheduler";

const ANIMALS: AnimalId[] = ["woodpecker", "owl", "squirrel", "otter", "turtle", "bear", "fox"];

describe("createWanderScheduler", () => {
  it("间隔在 12–30 秒之间", () => {
    const s = createWanderScheduler({ seed: "a", animals: ANIMALS, now: 0 });
    const first = s.nextAt;
    expect(first).toBeGreaterThanOrEqual(12_000);
    expect(first).toBeLessThanOrEqual(30_000);
  });

  it("到点前不派任务，到点后派一只", () => {
    const s = createWanderScheduler({ seed: "a", animals: ANIMALS, now: 0 });
    expect(s.tick(s.nextAt - 1)).toBeNull();
    const pick = s.tick(s.nextAt);
    expect(pick).not.toBeNull();
    expect(ANIMALS).toContain(pick);
  });

  it("同一时间最多一只在动：上一只没走完时不派新任务", () => {
    const s = createWanderScheduler({ seed: "b", animals: ANIMALS, now: 0 });
    const first = s.tick(s.nextAt);
    expect(first).not.toBeNull();
    expect(s.tick(s.nextAt + 100_000)).toBeNull();
    s.done(first as AnimalId, 50_000);
    expect(s.nextAt).toBeGreaterThanOrEqual(50_000 + 12_000);
    expect(s.tick(s.nextAt)).not.toBeNull();
  });

  it("暂停时不派任务，恢复后重新计时", () => {
    const s = createWanderScheduler({ seed: "c", animals: ANIMALS, now: 0 });
    s.pause();
    expect(s.tick(1_000_000)).toBeNull();
    s.resume(1_000_000);
    expect(s.nextAt).toBeGreaterThanOrEqual(1_000_000 + 12_000);
  });

  it("不会连续两次挑同一只", () => {
    const s = createWanderScheduler({ seed: "d", animals: ANIMALS, now: 0 });
    let prev: AnimalId | null = null;
    for (let i = 0; i < 40; i++) {
      const pick = s.tick(s.nextAt);
      expect(pick).not.toBe(prev);
      prev = pick;
      s.done(pick as AnimalId, s.nextAt);
    }
  });

  it("同一种子顺序可复现", () => {
    const run = () => {
      const s = createWanderScheduler({ seed: "e", animals: ANIMALS, now: 0 });
      const picks: (AnimalId | null)[] = [];
      for (let i = 0; i < 10; i++) {
        const p = s.tick(s.nextAt);
        picks.push(p);
        s.done(p as AnimalId, s.nextAt);
      }
      return picks;
    };
    expect(run()).toEqual(run());
  });

  it("pickAnchor 总是换一个锚点", () => {
    const s = createWanderScheduler({ seed: "f", animals: ANIMALS, now: 0 });
    for (let cur = 0; cur < 3; cur++) {
      for (let i = 0; i < 20; i++) {
        const next = s.pickAnchor(3, cur);
        expect(next).not.toBe(cur);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(3);
      }
    }
    expect(s.pickAnchor(1, 0)).toBe(0);
  });

  it("只有一只动物时也能反复挑它", () => {
    const s = createWanderScheduler({ seed: "g", animals: ["fox"], now: 0 });
    for (let i = 0; i < 3; i++) {
      const pick = s.tick(s.nextAt);
      expect(pick).toBe("fox");
      s.done("fox", s.nextAt);
    }
  });
});
