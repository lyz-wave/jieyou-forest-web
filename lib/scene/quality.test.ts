import { describe, expect, it } from "vitest";
import { createQualityGovernor } from "./quality";

/** 以固定帧率喂入 durationMs 毫秒的帧时间戳，返回最后一个时间戳 */
function feed(gov: ReturnType<typeof createQualityGovernor>, start: number, fps: number, durationMs: number): number {
  const frame = 1000 / fps;
  let t = start;
  for (; t <= start + durationMs; t += frame) gov.sample(t);
  return t;
}

describe("createQualityGovernor", () => {
  it("帧率正常时保持高画质", () => {
    const gov = createQualityGovernor();
    feed(gov, 0, 60, 10_000);
    expect(gov.quality).toBe("high");
  });

  it("预热期内掉帧不降级", () => {
    const gov = createQualityGovernor();
    feed(gov, 0, 20, 1_900);
    expect(gov.quality).toBe("high");
  });

  it("连续 2 秒低于 45fps 降一级", () => {
    const gov = createQualityGovernor();
    const t = feed(gov, 0, 60, 2_000);
    feed(gov, t, 30, 2_100);
    expect(gov.quality).toBe("medium");
  });

  it("降级后需要再积累 2 秒才会继续降", () => {
    const gov = createQualityGovernor();
    let t = feed(gov, 0, 60, 2_000);
    t = feed(gov, t, 30, 2_100);
    expect(gov.quality).toBe("medium");
    t = feed(gov, t, 30, 1_000);
    expect(gov.quality).toBe("medium");
    feed(gov, t, 30, 1_200);
    expect(gov.quality).toBe("low");
  });

  it("已经最低时保持「低」", () => {
    const gov = createQualityGovernor();
    feed(gov, 0, 20, 20_000);
    expect(gov.quality).toBe("low");
  });

  it("只降不升", () => {
    const gov = createQualityGovernor();
    let t = feed(gov, 0, 60, 2_000);
    t = feed(gov, t, 30, 2_100);
    feed(gov, t, 60, 10_000);
    expect(gov.quality).toBe("medium");
  });

  it("超过 1 秒的帧间隔（比如切到后台）会重置采样窗口", () => {
    const gov = createQualityGovernor();
    const t = feed(gov, 0, 60, 2_000);
    // 单帧卡了 1.5 秒，不应被当成持续掉帧
    const resumed = feed(gov, t, 60, 1_500) + 1_500;
    feed(gov, resumed, 60, 1_000);
    expect(gov.quality).toBe("high");
  });

  it("pause 后重新积累窗口", () => {
    const gov = createQualityGovernor();
    let t = feed(gov, 0, 60, 2_000);
    t = feed(gov, t, 30, 1_500);
    gov.pause();
    feed(gov, t, 30, 1_000);
    expect(gov.quality).toBe("high");
  });

  it("变化时通知订阅者", () => {
    const gov = createQualityGovernor();
    const seen: string[] = [];
    gov.onChange((q) => seen.push(q));
    feed(gov, 0, 20, 20_000);
    expect(seen).toEqual(["medium", "low"]);
  });
});
