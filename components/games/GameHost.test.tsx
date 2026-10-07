import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { useForestStore } from "@/lib/stores/forest";
import { GameHost } from "./GameHost";

/** 游戏 id 与面板标题，来自 lib/animals.ts 里每只动物的 game */
const GAMES: [string, string][] = [
  ["knock-tree", "敲树洞"],
  ["fact-or-guess", "事实还是猜测"],
  ["flip-mirror", "翻面镜"],
  ["bear-hug", "熊抱"],
  ["shell-breath", "龟壳呼吸"],
  ["leaf-float", "落叶漂流"],
  ["hide-nuts", "藏坚果"],
];

const reset = () =>
  useForestStore.setState({
    opened: null,
    openedAt: null,
    pendingGame: null,
    gameAnimal: null,
    gameAt: null,
    lastPlayed: null,
    playedTimes: 0,
    wanderPaused: false,
  });

beforeEach(reset);
afterEach(() => {
  cleanup();
  useGameContextStore.getState().clear();
  reset();
});

describe("GameHost 游戏面板的宿主", () => {
  it("没有待玩的游戏时不渲染面板", () => {
    const { container } = render(<GameHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it("七个游戏 id 都能挂出各自的面板", async () => {
    for (const [id, title] of GAMES) {
      useForestStore.setState({ pendingGame: id, gameAnimal: "owl", wanderPaused: true });
      render(<GameHost />);
      expect(await screen.findByRole("heading", { name: title })).toBeVisible();
      cleanup();
      reset();
    }
  });

  it("点回到森林后收起面板，并记下刚玩过的动物", async () => {
    useForestStore.setState({ pendingGame: "bear-hug", gameAnimal: "bear", wanderPaused: true });
    render(<GameHost />);
    await userEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(useForestStore.getState().pendingGame).toBeNull();
    expect(useForestStore.getState().lastPlayed).toBe("bear");
    expect(useForestStore.getState().playedTimes).toBe(1);
    expect(useForestStore.getState().wanderPaused).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("不认识的游戏 id 不渲染面板", () => {
    useForestStore.setState({ pendingGame: "surprise", gameAnimal: "owl" });
    const { container } = render(<GameHost />);
    expect(container).toBeEmptyDOMElement();
  });
});
