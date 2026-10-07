"use client";

import type { ComponentType, ReactElement } from "react";
import { useForestStore } from "@/lib/stores/forest";
import { BearHugGame } from "./BearHugGame";
import { FactOrGuessGame } from "./FactOrGuessGame";
import { FlipMirrorGame } from "./FlipMirrorGame";
import { HideNutsGame } from "./HideNutsGame";
import { KnockTreeGame } from "./KnockTreeGame";
import { LeafFloatGame } from "./LeafFloatGame";
import { ShellBreathGame } from "./ShellBreathGame";

type GameComponent = ComponentType<{ onClose: () => void }>;

/**
 * 游戏 id → 游戏面板。id 取自 lib/animals.ts 里每只动物的 game.id，古树没有游戏。
 */
const GAMES: Record<string, GameComponent> = {
  "knock-tree": KnockTreeGame,
  "fact-or-guess": FactOrGuessGame,
  "flip-mirror": FlipMirrorGame,
  "bear-hug": BearHugGame,
  "shell-breath": ShellBreathGame,
  "leaf-float": LeafFloatGame,
  "hide-nuts": HideNutsGame,
};

/**
 * 游戏面板的宿主：角色卡里点了「一起玩」之后由它把对应的游戏挂出来。
 * 七个游戏都只收 onClose，这里统一接到 closeGame —— 收起面板的同时记下这只动物，
 * 回到森林后它会轻跳一下。
 */
export function GameHost(): ReactElement | null {
  const pendingGame = useForestStore((s) => s.pendingGame);
  const closeGame = useForestStore((s) => s.closeGame);
  if (!pendingGame) return null;
  const Game = GAMES[pendingGame];
  if (!Game) return null;
  return <Game onClose={closeGame} />;
}
