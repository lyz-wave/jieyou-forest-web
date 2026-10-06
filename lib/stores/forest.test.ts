import { beforeEach, describe, expect, it } from "vitest";
import { useForestStore } from "./forest";

describe("useForestStore 角色卡", () => {
  beforeEach(() =>
    useForestStore.setState({ opened: null, openedAt: null, wanderPaused: false, pendingGame: null }),
  );

  it("打开角色卡时暂停走动，关闭后恢复", () => {
    useForestStore.getState().openCard("owl");
    expect(useForestStore.getState().opened).toBe("owl");
    expect(useForestStore.getState().wanderPaused).toBe(true);
    useForestStore.getState().closeCard();
    expect(useForestStore.getState().opened).toBeNull();
    expect(useForestStore.getState().wanderPaused).toBe(false);
  });

  it("打开卡片时记下动物位置，镜头可以推近", () => {
    const at = { x: 320, depth: 40, y: 700 };
    useForestStore.getState().openCard("fox", at);
    expect(useForestStore.getState().openedAt).toEqual(at);
  });

  it("古树也能打开卡片，没有位置就留空", () => {
    useForestStore.getState().openCard("tree");
    expect(useForestStore.getState().opened).toBe("tree");
    expect(useForestStore.getState().openedAt).toBeNull();
  });

  it("点一起玩：卡片先折回，再记下要打开的游戏", () => {
    useForestStore.getState().openCard("owl");
    useForestStore.getState().startGame("fact-or-guess");
    expect(useForestStore.getState().opened).toBeNull();
    expect(useForestStore.getState().pendingGame).toBe("fact-or-guess");
    useForestStore.getState().closeGame();
    expect(useForestStore.getState().pendingGame).toBeNull();
  });
});

describe("useForestStore 聚拢状态", () => {
  beforeEach(() => useForestStore.setState({ gather: "idle", pending: 0 }));

  it("所有动物到位后进入 seated", () => {
    const s = useForestStore.getState();
    s.startGather(3);
    expect(useForestStore.getState().gather).toBe("gathering");
    s.arrived();
    s.arrived();
    expect(useForestStore.getState().gather).toBe("gathering");
    s.arrived();
    expect(useForestStore.getState().gather).toBe("seated");
  });

  it("散开后回到 idle", () => {
    const s = useForestStore.getState();
    s.startDisperse(2);
    s.arrived();
    s.arrived();
    expect(useForestStore.getState().gather).toBe("idle");
  });

  it("多余的 arrived 不会让计数变成负数", () => {
    const s = useForestStore.getState();
    s.startGather(1);
    s.arrived();
    s.arrived();
    expect(useForestStore.getState().pending).toBe(0);
    expect(useForestStore.getState().gather).toBe("seated");
  });
});