import { describe, expect, it } from "vitest";
import { devToolsEnabled } from "./dev";

describe("开发工具开关", () => {
  it("开发服务器里默认打开", () => {
    expect(devToolsEnabled("", "development")).toBe(true);
    expect(devToolsEnabled("?foo=1", "development")).toBe(true);
  });

  it("其他环境只有 ?dev=1 才打开", () => {
    expect(devToolsEnabled("", "production")).toBe(false);
    expect(devToolsEnabled("?dev=0", "production")).toBe(false);
    expect(devToolsEnabled("?dev=true", "production")).toBe(false);
    expect(devToolsEnabled("?dev=1", "production")).toBe(true);
    expect(devToolsEnabled("?dev=1&from=e2e", "production")).toBe(true);
    expect(devToolsEnabled("?from=e2e&dev=1", "production")).toBe(true);
  });

  it("测试环境默认关闭", () => {
    expect(devToolsEnabled("", "test")).toBe(false);
  });
});
