"use client";

import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  HUG_MIN_MS,
  TOO_SHORT_LINE,
  bearHugContext,
  heartbeatPulse,
  hugGlow,
  pickNoRepeat,
} from "@/lib/games/bear-hug";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { GameShell } from "./GameShell";

const GAME_NAME = "熊抱";
const TICK_MS = 100;

/**
 * 熊抱（团团）：按住 → 暖光慢慢变亮、心跳一下一下 → 松开后团团说一句话。
 * 文案全部在本地（至少 20 句），不调用 AI；暖光曲线和心跳节奏在 lib/games/bear-hug 里。
 */
export function BearHugGame({ onClose }: { onClose: () => void }): ReactElement {
  const add = useGameContextStore((s) => s.add);
  const [holding, setHolding] = useState(false);
  const [glow, setGlow] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [said, setSaid] = useState<string | null>(null);
  const [tooShort, setTooShort] = useState(false);
  const startedAt = useRef<number | null>(null);
  const lastPhrase = useRef<string | null>(null);
  const lastBeat = useRef(-1);

  useEffect(() => {
    if (!holding) return;
    const tick = (): void => {
      const ms = startedAt.current === null ? 0 : Date.now() - startedAt.current;
      setGlow(hugGlow(ms));
      setPulse(heartbeatPulse(ms));
      const beat = Math.floor(ms / 1000);
      if (beat !== lastBeat.current) {
        lastBeat.current = beat;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
      }
    };
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [holding]);

  const release = (heldMs: number): void => {
    if (heldMs < HUG_MIN_MS) {
      setTooShort(true);
      setSaid(null);
      return;
    }
    setTooShort(false);
    const phrase = pickNoRepeat(lastPhrase.current, Math.random);
    lastPhrase.current = phrase;
    setSaid(phrase);
    const line = bearHugContext(heldMs);
    if (line) add(GAME_NAME, line);
  };

  const handleDown = (): void => {
    startedAt.current = Date.now();
    lastBeat.current = -1;
    setSaid(null);
    setTooShort(false);
    setGlow(0);
    setPulse(0);
    setHolding(true);
  };

  const handleUp = (): void => {
    if (!holding) return;
    const heldMs = startedAt.current === null ? 0 : Date.now() - startedAt.current;
    startedAt.current = null;
    setHolding(false);
    setGlow(0);
    setPulse(0);
    release(heldMs);
  };

  return (
    <GameShell title={GAME_NAME} animal="bear" onClose={onClose}>
      <p className="text-xs leading-6 text-ink-soft">
        按住团团就好，不用说话。按得越久，暖光越亮。
      </p>

      <div className="relative mt-4 flex flex-col items-center">
        <div
          data-testid="hug-glow"
          aria-hidden
          style={{ opacity: glow }}
          className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgb(255_196_120/0.55),rgb(255_196_120/0)_70%)]"
        />
        <button
          type="button"
          aria-label="抱一抱团团"
          onPointerDown={handleDown}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          onPointerLeave={handleUp}
          className="paper-card relative flex h-36 w-36 touch-none select-none items-center justify-center"
        >
          <PuppetMark id="bear" size={92} />
        </button>
        <p className="mt-2 text-[11px] text-ink-soft">心跳 {Math.round(pulse * 100)}%</p>
      </div>

      {said ? (
        <p className="paper-card mt-4 px-3 py-3 text-sm text-ink">
          <PuppetMark id="bear" size={16} /> <span data-testid="hug-line">{said}</span>
        </p>
      ) : null}

      {tooShort ? (
        <p role="status" className="mt-2 text-xs text-ink-soft">
          {TOO_SHORT_LINE}
        </p>
      ) : null}
    </GameShell>
  );
}