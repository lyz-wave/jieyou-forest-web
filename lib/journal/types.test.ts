import { describe, expect, it } from "vitest";
import { THEMES, isTheme, sanitizeThemes } from "./types";

describe("固定标签库（文档第七节）", () => {
  it("是那 13 个标签，第一个是工作压力、最后是其他", () => {
    expect(THEMES).toHaveLength(13);
    expect(THEMES[0]).toBe("工作压力");
    expect(THEMES[THEMES.length - 1]).toBe("其他");
  });

  it("只有库里的词算主题", () => {
    expect(isTheme("工作压力")).toBe(true);
    expect(isTheme("失去与离别")).toBe(true);
    expect(isTheme("工作")).toBe(false);
    expect(isTheme("")).toBe(false);
  });
});

describe("sanitizeThemes", () => {
  it("只留库里的词、去重、最多三个", () => {
    expect(sanitizeThemes(["工作压力", "工作压力", "不存在的词", "亲密关系", "家庭"])).toEqual([
      "工作压力",
      "亲密关系",
      "家庭",
    ]);
  });

  it("一个都没留下时给「其他」", () => {
    expect(sanitizeThemes([])).toEqual(["其他"]);
    expect(sanitizeThemes(["乱七八糟"])).toEqual(["其他"]);
  });

  it("可以指定上限", () => {
    expect(sanitizeThemes(["家庭", "友情", "健康"], 2)).toEqual(["家庭", "友情"]);
  });
});
