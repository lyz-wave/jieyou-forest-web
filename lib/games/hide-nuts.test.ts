import { describe, expect, it } from "vitest";
import {
  EMPTY_HOARD_HINT,
  canFinish,
  encourageLine,
  hideNutsContext,
  toggleStep,
} from "./hide-nuts";

describe("藏坚果的选择", () => {
  it("没选坚果时不能点「就这些」", () => {
    expect(canFinish([])).toBe(false);
    expect(EMPTY_HOARD_HINT).toBe("挑一颗最小的试试？");
  });

  it("选了至少一颗就能点", () => {
    expect(canFinish(["s1"])).toBe(true);
  });

  it("再点一次就拿出来", () => {
    expect(toggleStep([], "s1")).toEqual(["s1"]);
    expect(toggleStep(["s1", "s2"], "s1")).toEqual(["s2"]);
  });

  it("打气的话不为空", () => {
    expect(encourageLine(["先写三句话"]).length).toBeGreaterThan(0);
  });

  it("gameContext 记焦虑的事和愿意尝试的步骤", () => {
    expect(hideNutsContext("下周的演讲", ["先写三句话提纲", "找同事试讲一次"])).toBe(
      "让人焦虑的事：下周的演讲；愿意尝试的小步骤：先写三句话提纲、找同事试讲一次",
    );
  });

  it("一颗都没选时不产生 gameContext", () => {
    expect(hideNutsContext("下周的演讲", [])).toBeNull();
  });
});