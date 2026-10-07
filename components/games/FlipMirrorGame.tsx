"use client";

import { useState, type ReactElement } from "react";
import { forestAI } from "@/lib/ai";
import {
  REFRAME_LABELS,
  REFRAME_MAX,
  REFRAME_MIN,
  isValidInput,
  textLength,
  type ReframeVersion,
} from "@/lib/ai/types";
import { flipMirrorContext, toggleCollection } from "@/lib/games/flip-mirror";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { GameShell, useGameBusy } from "./GameShell";
import { useAiRequest } from "./useAiRequest";

const GAME_NAME = "翻面镜";

/**
 * 翻面镜（阿橘）：把一句负面想法翻成幽默、温柔、现实三版，收藏哪句由玩家决定。
 * 只有收藏了至少一句，离开时才记 gameContext（规格里明确要求）。
 */
export function FlipMirrorGame({ onClose }: { onClose: () => void }): ReactElement {
  const add = useGameContextStore((s) => s.add);
  const [thought, setThought] = useState("");
  const [collected, setCollected] = useState<ReframeVersion[]>([]);
  const { status, result, run, retry } = useAiRequest((text, options) => forestAI.reframe(text, options));
  const busy = useGameBusy();
  const versions = result?.versions ?? [];
  const canFlip = isValidInput(thought, REFRAME_MIN, REFRAME_MAX) && !busy;

  const close = (): void => {
    const line = flipMirrorContext(thought, collected);
    if (line) add(GAME_NAME, line);
    onClose();
  };

  return (
    <GameShell title={GAME_NAME} animal="fox" status={status} onRetry={() => void retry()} onClose={close}>
      <p className="text-xs leading-6 text-ink-soft">
        把让你难受的那句话写下来，阿橘甩一下尾巴，镜子就翻个面。
      </p>
      <textarea
        aria-label="写下让你难受的想法"
        value={thought}
        rows={2}
        onChange={(e) => setThought(e.target.value)}
        className="paper-card mt-2 w-full px-3 py-2 text-sm text-ink"
        placeholder="比如：他没回我消息，一定是讨厌我"
      />
      <p className="mt-1 text-right text-[11px] text-ink-soft">
        {textLength(thought)}/{REFRAME_MAX}
      </p>
      <button
        type="button"
        disabled={!canFlip}
        onClick={() => void run(thought)}
        className="paper-button mt-2 w-full py-2.5 text-sm"
      >
        翻一面
      </button>

      {versions.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {versions.map((version) => {
            const picked = collected.some((item) => item.kind === version.kind && item.text === version.text);
            return (
              <li key={version.kind} className="paper-card px-3 py-2">
                <p className="text-[11px] text-moss">{REFRAME_LABELS[version.kind]}</p>
                <p className="mt-1 text-sm leading-6 text-ink">{version.text}</p>
                <button
                  type="button"
                  aria-label={"收藏" + REFRAME_LABELS[version.kind]}
                  aria-pressed={picked}
                  onClick={() => setCollected((current) => toggleCollection(current, version))}
                  className="mt-2 text-[11px] text-ink-soft underline"
                >
                  {picked ? "已收藏，再点一下取消" : "收藏这句"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {collected.length > 0 ? (
        <p className="mt-3 text-[11px] text-ink-soft">收藏了 {collected.length} 句，回到森林时会记下。</p>
      ) : null}
    </GameShell>
  );
}