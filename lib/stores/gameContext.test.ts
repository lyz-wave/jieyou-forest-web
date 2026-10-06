import { beforeEach, describe, expect, it } from "vitest";
import { GAME_CONTEXT_LIMIT, useGameContextStore } from "./gameContext";

describe("useGameContextStore", () => {
  beforeEach(() => useGameContextStore.getState().clear());

  it("按「【游戏名】内容」格式追加", () => {
    useGameContextStore.getState().add("敲树洞", "此刻的情绪：委屈、疲惫");
    expect(useGameContextStore.getState().entries).toEqual(["【敲树洞】此刻的情绪：委屈、疲惫"]);
  });

  it("最多保留 20 条，超出时移除最早的", () => {
    expect(GAME_CONTEXT_LIMIT).toBe(20);
    for (let i = 1; i <= 21; i++) useGameContextStore.getState().add("熊抱", `第 ${i} 次`);
    const { entries } = useGameContextStore.getState();
    expect(entries).toHaveLength(20);
    expect(entries[0]).toBe("【熊抱】第 2 次");
    expect(entries[19]).toBe("【熊抱】第 21 次");
  });
});
