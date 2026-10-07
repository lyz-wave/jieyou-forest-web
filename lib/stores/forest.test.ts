import { beforeEach, describe, expect, it } from "vitest";
import { useForestStore } from "./forest";

describe("useForestStore 角色卡", () => {
  beforeEach(() =>
    useForestStore.setState({
      opened: null,
      openedAt: null,
      wanderPaused: false,
      pendingGame: null,
      gameAnimal: null,
      gameAt: null,
      lastPlayed: null,
      playedTimes: 0,
    }),
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

  it("点一起玩：卡片先折回，再记下要打开的游戏和玩它的动物", () => {
    const at = { x: 320, depth: 40, y: 700 };
    useForestStore.getState().openCard("owl", at);
    useForestStore.getState().startGame("fact-or-guess", "owl");
    expect(useForestStore.getState().opened).toBeNull();
    expect(useForestStore.getState().pendingGame).toBe("fact-or-guess");
    expect(useForestStore.getState().gameAnimal).toBe("owl");
    // 镜头在游戏期间继续对着这只动物
    expect(useForestStore.getState().gameAt).toEqual(at);
  });

  it("回到森林：收起面板，记下刚玩过的动物，走动恢复", () => {
    useForestStore.getState().openCard("bear", { x: 40, depth: 90, y: 640 });
    useForestStore.getState().startGame("bear-hug", "bear");
    useForestStore.getState().closeGame();
    expect(useForestStore.getState().pendingGame).toBeNull();
    expect(useForestStore.getState().lastPlayed).toBe("bear");
    expect(useForestStore.getState().playedTimes).toBe(1);
    expect(useForestStore.getState().wanderPaused).toBe(false);
    // 再玩一次同一只：次数加一，动物看了还会跳
    useForestStore.getState().openCard("bear", { x: 40, depth: 90, y: 640 });
    useForestStore.getState().startGame("bear-hug", "bear");
    useForestStore.getState().closeGame();
    expect(useForestStore.getState().playedTimes).toBe(2);
  });

  it("没开着游戏时回到森林，不算玩过一次", () => {
    useForestStore.getState().closeGame();
    expect(useForestStore.getState().playedTimes).toBe(0);
    expect(useForestStore.getState().lastPlayed).toBeNull();
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