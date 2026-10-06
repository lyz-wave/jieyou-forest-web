import { describe, expect, it } from "vitest";
import { NICKNAME_MAX, clampNickname, isValidNickname } from "./nickname";

describe("昵称", () => {
  it.each(["", " ", "　", "\n"])("空白 %j 不合法", (v) => {
    expect(isValidNickname(v)).toBe(false);
  });

  it("普通昵称合法，前后空格忽略", () => {
    expect(isValidNickname(" 小满 ")).toBe(true);
  });

  it("最多 12 个字（按字符计，emoji 算一个）", () => {
    expect(NICKNAME_MAX).toBe(12);
    expect(clampNickname("一二三四五六七八九十十一十二")).toBe("一二三四五六七八九十十一");
    expect(Array.from(clampNickname("🌱".repeat(20)))).toHaveLength(12);
    expect(clampNickname("小满")).toBe("小满");
  });
});
