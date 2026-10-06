import { describe, expect, it } from "vitest";
import { between, hashString, mulberry32, seeded } from "./random";

describe("mulberry32", () => {
  it("同一种子产生相同序列", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("不同种子产生不同序列", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(Array.from({ length: 5 }, () => a())).not.toEqual(Array.from({ length: 5 }, () => b()));
  });

  it("取值落在 [0, 1)", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("hashString", () => {
  it("相同字符串哈希相同，不同字符串哈希不同", () => {
    expect(hashString("狐狸")).toBe(hashString("狐狸"));
    expect(hashString("狐狸")).not.toBe(hashString("熊"));
  });

  it("返回 32 位无符号整数", () => {
    const h = hashString("forest");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});

describe("seeded / between", () => {
  it("用字符串作种子可复现", () => {
    const a = seeded("hill");
    const b = seeded("hill");
    expect(a()).toBe(b());
  });

  it("between 落在给定区间", () => {
    const rng = seeded("range");
    for (let i = 0; i < 200; i++) {
      const v = between(rng, -3, 5);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThan(5);
    }
  });
});
