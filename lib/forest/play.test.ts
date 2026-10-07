import { describe, expect, it } from "vitest";
import { playTokenFor } from "./play";

describe("playTokenFor 回到森林后的轻跳", () => {
  it("不是刚玩过的那只，拿到 0，不跳", () => {
    expect(playTokenFor("bear", 3, "fox")).toBe(0);
    expect(playTokenFor("bear", 1, "owl")).toBe(0);
  });

  it("刚玩过的那只拿到已玩的次数，玩第二次时数字会变，能再跳一次", () => {
    expect(playTokenFor("bear", 3, "bear")).toBe(3);
    expect(playTokenFor("bear", 4, "bear")).toBe(4);
  });

  it("还没人玩过游戏时，谁都不跳", () => {
    expect(playTokenFor(null, 0, "bear")).toBe(0);
  });
});
