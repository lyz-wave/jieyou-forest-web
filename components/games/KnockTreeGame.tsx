"use client";

import { PaperGlyph } from "@/components/ui/PaperGlyph";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  EMOTIONS,
  EMOTION_LIMIT_HINT,
  KNOCK_MAX_MS,
  KNOCK_STOP_MS,
  knockContext,
  knockReply,
  knockState,
  newKnockSession,
  tap,
  toggleEmotion,
  type Emotion,
  type KnockSession,
} from "@/lib/games/knock-tree";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { GameShell } from "./GameShell";

const GAME_NAME = "敲树洞";

/**
 * 敲树洞（笃笃）：敲树干 → 停手后从树洞里挑 1–3 个情绪词 → 笃笃回应。
 * 时间判断都在 lib/games/knock-tree 里，这里只负责画和接定时器。
 */
export function KnockTreeGame({ onClose }: { onClose: () => void }): ReactElement {
  const reducedMotion = useReducedMotion();
  const add = useGameContextStore((s) => s.add);
  const [session, setSession] = useState<KnockSession>(newKnockSession);
  const [phase, setPhase] = useState<"knock" | "pick" | "reply">("knock");
  const [selected, setSelected] = useState<Emotion[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [pecking, setPecking] = useState(false);
  const sessionRef = useRef<KnockSession>(session);
  const stopTimer = useRef<number | null>(null);
  const capTimer = useRef<number | null>(null);
  const peckTimer = useRef<number | null>(null);

  const clearTimers = useCallback((): void => {
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    if (capTimer.current !== null) window.clearTimeout(capTimer.current);
    if (peckTimer.current !== null) window.clearTimeout(peckTimer.current);
    stopTimer.current = null;
    capTimer.current = null;
    peckTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** 停手满 3 秒或满 30 秒：把树洞里的词放出来 */
  const settle = useCallback((): void => {
    const state = knockState(sessionRef.current, Date.now());
    if (state !== "stop" && state !== "cap") return;
    clearTimers();
    setPecking(false);
    setPhase("pick");
  }, [clearTimers]);

  const handleTap = (): void => {
    if (phase !== "knock") return;
    const now = Date.now();
    const next = tap(sessionRef.current, now);
    sessionRef.current = next;
    setSession(next);
    setPecking(true);
    if (peckTimer.current !== null) window.clearTimeout(peckTimer.current);
    peckTimer.current = window.setTimeout(() => setPecking(false), 220);
    if (next.startedAt !== null) {
      if (capTimer.current !== null) window.clearTimeout(capTimer.current);
      capTimer.current = window.setTimeout(settle, Math.max(0, next.startedAt + KNOCK_MAX_MS - now));
    }
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(settle, KNOCK_STOP_MS);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
  };

  const confirm = (): void => {
    if (selected.length === 0) return;
    setReply(knockReply(selected));
    const line = knockContext(selected);
    if (line) add(GAME_NAME, line);
    setPhase("reply");
  };

  return (
    <GameShell title={GAME_NAME} animal="woodpecker" onClose={onClose}>
      <p className="text-xs leading-6 text-ink-soft">
        笃笃说：不用想该敲哪里，想敲就敲。敲够了我再陪你看看，刚才那是什么情绪。
      </p>

      <div
        data-shake={!reducedMotion && pecking ? "peck" : "none"}
        className="mt-4 flex flex-col items-center"
      >
        <div className="relative">
          <button
            type="button"
            aria-label="敲一敲树干"
            onClick={handleTap}
            disabled={phase !== "knock"}
            className="paper-card flex h-32 w-32 items-center justify-center disabled:opacity-70"
          >
            <PuppetMark id="tree" size={72} />
          </button>
          {pecking ? (
            <span aria-hidden className="pointer-events-none absolute -right-3 -top-3 text-2xl">
              <PaperGlyph kind="feather" size={22} />
            </span>
          ) : null}
        </div>
        <p data-testid="knock-count" className="mt-2 text-sm text-ink">
          {session.count} 下
        </p>
        <p className="mt-1 text-[11px] text-ink-soft">
          {phase === "knock" ? "停手 3 秒就好，最多敲 30 秒。" : "树洞里飘出这些卡片。"}
        </p>
      </div>

      {phase !== "knock" ? (
        <fieldset className="mt-4">
          <legend className="text-xs text-ink-soft">挑 1–3 个最像的（再点一下可以取消）</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMOTIONS.map((emotion) => {
              const picked = selected.includes(emotion);
              return (
                <button
                  key={emotion}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => {
                    const outcome = toggleEmotion(selected, emotion);
                    setSelected(outcome.selected);
                    setHint(outcome.blocked ? EMOTION_LIMIT_HINT : null);
                  }}
                  className={
                    picked
                      ? "paper-button px-3 py-1.5 text-xs"
                      : "paper-card px-3 py-1.5 text-xs text-ink-soft"
                  }
                >
                  {emotion}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {hint ? (
        <p role="status" className="mt-2 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}

      {phase === "pick" ? (
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={confirm}
          className="paper-button mt-4 w-full py-2.5 text-sm"
        >
          就是这些
        </button>
      ) : null}

      {phase === "reply" ? (
        <p data-testid="knock-reply" className="paper-card mt-4 px-3 py-3 text-sm text-ink">
          <PuppetMark id="woodpecker" size={16} /> {reply}
        </p>
      ) : null}
    </GameShell>
  );
}