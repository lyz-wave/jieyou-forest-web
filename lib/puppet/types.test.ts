import { describe, expect, it } from "vitest";
import { idleDelay, idleSteps, puppetColors, validatePuppet, type PuppetDef } from "./types";

const valid: PuppetDef = {
  id: "test",
  viewBox: [100, 100],
  facing: "right",
  signature: { part: "tail", angle: 20 },
  parts: [
    {
      id: "body",
      path: "M10 10L90 10L90 90Z",
      fill: "#d9773a",
      joint: [50, 90],
      z: 0,
      idle: { kind: "breathe", duration: 3, amount: 0.03 },
      children: [
        { id: "tail", path: "M0 0L1 1Z", fill: "#f6e7cf", joint: [20, 80], z: -1, pin: true, idle: { kind: "sway", duration: 2.5, amount: 6 } },
        { id: "eyes", path: "M0 0L1 1Z", fill: "#2b221b", ink: true, joint: [50, 40], z: 1, idle: { kind: "blink", duration: 4, amount: 0.1 } },
      ],
    },
  ],
};

describe("validatePuppet", () => {
  it("合法定义没有错误", () => {
    expect(validatePuppet(valid)).toEqual([]);
  });

  it("部件 id 重复", () => {
    const bad: PuppetDef = {
      ...valid,
      parts: [{ ...valid.parts[0], children: [...(valid.parts[0].children ?? []), { ...valid.parts[0].children![0] }] }],
    };
    expect(validatePuppet(bad).join()).toContain("重复");
  });

  it("关节点超出 viewBox", () => {
    const bad: PuppetDef = { ...valid, parts: [{ ...valid.parts[0], joint: [120, 50] }] };
    expect(validatePuppet(bad).join()).toContain("关节");
  });

  it("主体纸色少于 2 种", () => {
    const bad: PuppetDef = {
      ...valid,
      parts: [{ ...valid.parts[0], children: valid.parts[0].children!.map((c) => ({ ...c, fill: "#d9773a" })) }],
    };
    // 眼睛是墨色细节不计入，剩下只有一种纸色
    expect(validatePuppet({ ...bad, parts: [{ ...bad.parts[0], children: [bad.parts[0].children![0]] }] }).join()).toContain(
      "纸色",
    );
  });

  it("缺少三种待机动画之一", () => {
    const bad: PuppetDef = { ...valid, parts: [{ ...valid.parts[0], idle: undefined }] };
    expect(validatePuppet(bad).join()).toContain("breathe");
  });

  it("标志性部件不存在", () => {
    expect(validatePuppet({ ...valid, signature: { part: "wing", angle: 10 } }).join()).toContain("wing");
  });
});

describe("puppetColors", () => {
  it("只统计主体纸色，不含墨色细节", () => {
    expect(puppetColors(valid).sort()).toEqual(["#d9773a", "#f6e7cf"]);
  });
});

describe("idleSteps", () => {
  it.each([3, 2.2, 2.5, 4, 5])("%ss 周期：阶梯密度约每秒 12 步", (duration) => {
    const density = idleSteps(duration) / duration;
    expect(density).toBeGreaterThanOrEqual(10);
    expect(density).toBeLessThanOrEqual(14);
  });
});

describe("idleDelay", () => {
  it("同一纸偶和部件的延迟固定，不同纸偶不同", () => {
    expect(idleDelay("fox", "tail", 3)).toBe(idleDelay("fox", "tail", 3));
    expect(idleDelay("fox", "tail", 3)).not.toBe(idleDelay("bear", "tail", 3));
  });

  it("延迟为负数且不超过一个周期，动画一开始就处在中途", () => {
    const d = idleDelay("owl", "head", 3);
    expect(d).toBeLessThanOrEqual(0);
    expect(d).toBeGreaterThan(-3);
  });
});
