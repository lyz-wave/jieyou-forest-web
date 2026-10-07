"use client";

import { useState, type ReactElement } from "react";
import { forestAI } from "@/lib/ai";
import { THOUGHT_MAX, THOUGHT_MIN, isValidInput, textLength, type ThoughtAnswer } from "@/lib/ai/types";
import {
  agreeLine,
  differLine,
  factOrGuessContext,
  reviewPlacements,
  trapSummary,
  type ThoughtReview,
} from "@/lib/games/fact-or-guess";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { DndProvider } from "./dnd/DndProvider";
import { Draggable } from "./dnd/Draggable";
import { DropZone } from "./dnd/DropZone";
import { GameShell, useGameBusy } from "./GameShell";
import { useAiRequest } from "./useAiRequest";

const GAME_NAME = "事实还是猜测";
const SAMPLE = "他两天没回我消息，他一定讨厌我了";
const FACT_ZONE = "fact";
const GUESS_ZONE = "guess";

/**
 * 事实还是猜测（墨墨）：把一句话拆成气泡，再分进「事实」和「猜测」两个树洞。
 * 点评只提问、不判卷：「错了」两个字不允许出现（规格里明确要求）。
 */
export function FactOrGuessGame({ onClose }: { onClose: () => void }): ReactElement {
  const add = useGameContextStore((s) => s.add);
  const [thought, setThought] = useState("");
  const [placements, setPlacements] = useState<Record<string, ThoughtAnswer>>({});
  const [review, setReview] = useState<ThoughtReview | null>(null);
  const { status, result, run, retry } = useAiRequest((text, options) => forestAI.splitThought(text, options));
  const busy = useGameBusy();
  const bubbles = result?.bubbles ?? [];
  const canSplit = isValidInput(thought, THOUGHT_MIN, THOUGHT_MAX) && !busy;
  const allPlaced = bubbles.length > 0 && bubbles.every((bubble) => placements[bubble.id] !== undefined);

  const place = (itemId: string, zoneId: string): void => {
    if (zoneId !== FACT_ZONE && zoneId !== GUESS_ZONE) return;
    setReview(null);
    setPlacements((current) => ({ ...current, [itemId]: zoneId }));
  };

  const finish = (): void => {
    if (!allPlaced || review !== null) return;
    const next = reviewPlacements(bubbles, placements);
    setReview(next);
    const guesses = bubbles.filter((bubble) => bubble.answer === "guess").map((bubble) => bubble.text);
    add(GAME_NAME, factOrGuessContext(thought, guesses, next.traps));
  };

  const zone = (id: string, label: string): ReactElement => (
    <DropZone id={id} label={label} className="flex-col gap-1">
      {bubbles
        .filter((bubble) => placements[bubble.id] === id)
        .map((bubble) => (
          <span key={bubble.id} className="text-sm text-ink">
            {bubble.text}
          </span>
        ))}
    </DropZone>
  );

  return (
    <GameShell title={GAME_NAME} animal="owl" status={status} onRetry={() => void retry()} onClose={onClose}>
      <p className="text-xs leading-6 text-ink-soft">
        写下让你不安的那句话。墨墨会把它拆成几句，你只要分一分：哪些是发生过的，哪些是心里下的判断。
      </p>
      <textarea
        aria-label="写下让你不安的话"
        value={thought}
        rows={2}
        onChange={(e) => setThought(e.target.value)}
        className="paper-card mt-2 w-full px-3 py-2 text-sm text-ink"
        placeholder="比如：他两天没回我消息，他一定讨厌我了"
      />
      <p className="mt-1 text-right text-[11px] text-ink-soft">
        {textLength(thought)}/{THOUGHT_MAX}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setThought(SAMPLE)}
          className="paper-card flex-1 py-2 text-xs text-ink-soft"
        >
          一键填示例
        </button>
        <button type="button" disabled={!canSplit} onClick={() => void run(thought)} className="paper-button flex-1 py-2 text-xs">
          拆一拆
        </button>
      </div>

      {bubbles.length > 0 ? (
        <DndProvider onDrop={place}>
          <div className="mt-4 flex flex-wrap gap-2">
            {bubbles
              .filter((bubble) => placements[bubble.id] === undefined)
              .map((bubble) => (
                <Draggable key={bubble.id} id={bubble.id}>
                  {bubble.text}
                </Draggable>
              ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {zone(FACT_ZONE, "事实树洞")}
            {zone(GUESS_ZONE, "猜测树洞")}
          </div>
        </DndProvider>
      ) : null}

      {bubbles.length > 0 ? (
        <button type="button" disabled={!allPlaced} onClick={finish} className="paper-button mt-3 w-full py-2.5 text-sm">
          看看结果
        </button>
      ) : null}

      {review !== null ? (
        <div data-testid="guess-review" className="paper-card mt-3 px-3 py-3 text-xs leading-6 text-ink-soft">
          {bubbles.map((bubble) =>
            review.disagreed.includes(bubble.id) ? (
              <p key={bubble.id} className="text-ink">
                「{bubble.text}」{differLine(bubble.answer)}
              </p>
            ) : review.agreed.includes(bubble.id) ? (
              <p key={bubble.id}>「{bubble.text}」{agreeLine(bubble.id)}</p>
            ) : null,
          )}
          {review.traps.length > 0 ? <p className="mt-2 text-ink">可能出现的思维陷阱 · {trapSummary(review.traps)}</p> : null}
        </div>
      ) : null}
    </GameShell>
  );
}