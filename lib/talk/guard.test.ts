import { describe, expect, it } from "vitest";
import { CONCERN_LINE, CRISIS, HOTLINES, PRIVACY_LINE } from "./guard";

describe("危险时的守护文案", () => {
  it("先让岁岁说一句，再给三条现在能做的事，最后有一句收尾", () => {
    expect(CRISIS.treeSays.length).toBeGreaterThan(0);
    expect(CRISIS.title).toBe("先停一下，我们慢慢来");
    expect(CRISIS.body).toContain("真人");
    expect(CRISIS.steps).toHaveLength(3);
    expect(CRISIS.tail).toContain("森林");
  });

  it("求助卡上的号码与文档第八节一致（上线前要再核实一次）", () => {
    expect(HOTLINES.map((line) => line.number)).toEqual(["12356", "400-161-9995", "110 / 120"]);
    for (const line of HOTLINES) expect(line.name.length).toBeGreaterThan(0);
  });

  it("继续之前要用户自己确认现在是安全的", () => {
    expect(CRISIS.confirm).toContain("安全");
    expect(CRISIS.continueLabel).toBe("我还想说，继续吧");
    expect(CRISIS.leaveLabel).toBe("先离开，去透口气");
  });

  it("concern 不打断倾诉，只在总结里温和提一句，也不写号码", () => {
    expect(CONCERN_LINE).toContain("真人");
    expect(CONCERN_LINE).not.toMatch(/[0-9]/);
  });

  it("隐私说明说清了两件事：只用于这次回应、不留下", () => {
    expect(PRIVACY_LINE).toContain("这一次的回应");
    expect(PRIVACY_LINE).toContain("不进日志");
  });
});
