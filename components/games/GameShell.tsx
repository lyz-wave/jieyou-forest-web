"use client";

import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import { ANIMALS, type AnimalId } from "@/lib/animals";
import { AI_FAILURE_LINE } from "@/lib/ai/types";
import { PopupCard } from "@/components/ui/PopupCard";
import type { AiStatus } from "./useAiRequest";

const GameBusyContext = createContext(false);

/** 游戏里用它禁用提交：正在想的时候不要再提交一次 */
export function useGameBusy(): boolean {
  return useContext(GameBusyContext);
}

/**
 * 所有小游戏共用的外壳：面板从底边折起、回到森林、等待中的样子、失败时的挠头和重试。
 * 玩法本身由 children 决定，AI 的状态由外面通过 status 传进来。
 */
export function GameShell({
  title,
  animal,
  status = "idle",
  onRetry,
  onClose,
  children,
}: {
  title: string;
  animal: AnimalId;
  status?: AiStatus;
  onRetry?: () => void;
  onClose: () => void;
  children: ReactNode;
}): ReactElement {
  const def = ANIMALS[animal];
  const thinking = status === "thinking";

  return (
    <PopupCard open labelledBy="game-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <h2 id="game-title" className="font-serif text-lg text-ink">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="paper-button shrink-0 px-3 py-1 text-xs">
          回到森林
        </button>
      </div>

      <div aria-busy={thinking} data-game-body className="mt-3">
        {thinking ? (
          <p role="status" className="paper-card mb-3 px-3 py-2 text-xs text-ink-soft">
            <span aria-hidden>{def.emoji}</span> {def.name}正在想…
          </p>
        ) : null}

        {status === "failed" ? (
          <div role="status" className="paper-card mb-3 px-3 py-2 text-xs text-ink-soft">
            <p>
              <span aria-hidden>{def.emoji}</span> {def.name}挠挠头：{AI_FAILURE_LINE}
            </p>
            <button type="button" onClick={onRetry} className="paper-button mt-2 w-full py-2 text-xs">
              再试一次
            </button>
          </div>
        ) : null}

        <GameBusyContext.Provider value={thinking}>{children}</GameBusyContext.Provider>
      </div>
    </PopupCard>
  );
}
