"use client";

import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useState, type ReactElement } from "react";
import { forestAI } from "@/lib/ai";
import { BREAKDOWN_MAX, BREAKDOWN_MIN, isValidInput, textLength } from "@/lib/ai/types";
import { EMPTY_HOARD_HINT, canFinish, encourageLine, hideNutsContext, toggleStep } from "@/lib/games/hide-nuts";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { DndProvider } from "./dnd/DndProvider";
import { Draggable } from "./dnd/Draggable";
import { DropZone } from "./dnd/DropZone";
import { GameShell, useGameBusy } from "./GameShell";
import { useAiRequest } from "./useAiRequest";

const GAME_NAME = "藏坚果";
const HOARD = "hoard";

/**
 * 藏坚果（跳跳）：把焦虑的大事啃成几颗坚果，每颗写一个今天就能做的小步骤。
 * 愿意试的放进树洞，点「就这些」收尾；一颗都没选时不给走，先提示挑一颗最小的。
 */
export function HideNutsGame({ onClose }: { onClose: () => void }): ReactElement {
  const add = useGameContextStore((s) => s.add);
  const [topic, setTopic] = useState("");
  const [hoard, setHoard] = useState<string[]>([]);
  const [encourage, setEncourage] = useState<string | null>(null);
  const { status, result, run, retry } = useAiRequest((text, options) => forestAI.breakDown(text, options));
  const busy = useGameBusy();
  const steps = result?.steps ?? [];
  const nutId = (index: number): string => "nut-" + index;
  const pile = steps.map((step, index) => ({ id: nutId(index), text: step })).filter((nut) => !hoard.includes(nut.id));
  const canCrack = isValidInput(topic, BREAKDOWN_MIN, BREAKDOWN_MAX) && !busy;

  const place = (itemId: string, zoneId: string): void => {
    if (zoneId !== HOARD) return;
    setEncourage(null);
    setHoard((current) => toggleStep(current, itemId));
  };

  const finish = (): void => {
    if (!canFinish(hoard)) return;
    const chosen = hoard.map((id) => steps[Number(id.replace("nut-", ""))]).filter((step) => step !== undefined);
    setEncourage(encourageLine(chosen));
    const context = hideNutsContext(topic, chosen);
    if (context) add(GAME_NAME, context);
  };

  return (
    <GameShell title={GAME_NAME} animal="squirrel" status={status} onRetry={() => void retry()} onClose={onClose}>
      <p className="text-xs leading-6 text-ink-soft">
        把压在心里的大事写下来，跳跳啃一啃，会变成几颗坚果——每颗都是今天就能做的一小步。
      </p>
      <textarea
        aria-label="写下让你焦虑的大事"
        value={topic}
        rows={2}
        onChange={(e) => setTopic(e.target.value)}
        className="paper-card mt-2 w-full px-3 py-2 text-sm text-ink"
        placeholder="比如：下周要做汇报"
      />
      <p className="mt-1 text-right text-[11px] text-ink-soft">
        {textLength(topic)}/{BREAKDOWN_MAX}
      </p>
      <button type="button" disabled={!canCrack} onClick={() => void run(topic)} className="paper-button mt-2 w-full py-2.5 text-sm">
        啃一啃
      </button>

      {steps.length > 0 ? (
        <DndProvider onDrop={place}>
          <div className="mt-4 flex flex-wrap gap-2">
            {pile.map((nut) => (
              <Draggable key={nut.id} id={nut.id}>
                {nut.text}
              </Draggable>
            ))}
          </div>
          <div className="mt-3">
            <DropZone id={HOARD} label="树洞" className="flex-col gap-1">
              {hoard.map((id) => {
                const step = steps[Number(id.replace("nut-", ""))];
                return (
                  <span key={id} className="text-sm text-ink">
                    {step}
                  </span>
                );
              })}
            </DropZone>
          </div>
        </DndProvider>
      ) : null}

      {steps.length > 0 && !canFinish(hoard) ? (
        <p role="status" className="mt-2 text-xs text-ink-soft">
          {EMPTY_HOARD_HINT}
        </p>
      ) : null}

      {steps.length > 0 ? (
        <button
          type="button"
          disabled={!canFinish(hoard)}
          onClick={finish}
          className="paper-button mt-3 w-full py-2.5 text-sm"
        >
          就这些
        </button>
      ) : null}

      {encourage !== null ? (
        <p data-testid="nut-encourage" className="paper-card mt-3 px-3 py-3 text-sm text-ink">
          <PuppetMark id="squirrel" size={16} /> {encourage}
        </p>
      ) : null}
    </GameShell>
  );
}