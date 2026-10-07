"use client";

import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  DEFAULT_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  PHASE_LABELS,
  PHASE_MS,
  clampRounds,
  closingLine,
  phaseAt,
  shellBreathContext,
  type BreathProgress,
} from "@/lib/games/shell-breath";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { GameShell } from "./GameShell";

const GAME_NAME = "龟壳呼吸";
const TICK_MS = 200;
const ROUND_CHOICES = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, i) => MIN_ROUNDS + i);

function chime(): void {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext;
  if (!Ctor) return;
  const ctx = new Ctor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 432;
  gain.gain.value = 0.06;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
  window.setTimeout(() => void ctx.close(), 800);
}

/**
 * 龟壳呼吸（慢慢）：盒式呼吸 4-4-4-4，默认 3 轮，可以暂停、可以结束。
 * 阶段和倒数都由 lib/games/shell-breath 的 phaseAt 算；这里只负责计时和画面。
 */
export function ShellBreathGame({ onClose }: { onClose: () => void }): ReactElement {
  const add = useGameContextStore((s) => s.add);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const [progress, setProgress] = useState<BreathProgress>({ done: false, phase: "inhale", round: 1, remainingMs: PHASE_MS });
  const startedAt = useRef(0);
  const pausedAt = useRef(0);
  const pausedTotal = useRef(0);

  useEffect(() => {
    if (phase !== "running" || paused) return;
    const elapsedNow = (): number => Date.now() - startedAt.current - pausedTotal.current;
    const tick = (): void => {
      const next = phaseAt(elapsedNow(), rounds);
      if (next.done) {
        setProgress(next);
        setPhase("done");
        const line = shellBreathContext(rounds);
        if (line) add(GAME_NAME, line);
        return;
      }
      setProgress(next);
    };
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [add, paused, phase, rounds]);

  const start = (): void => {
    startedAt.current = Date.now();
    pausedTotal.current = 0;
    setPaused(false);
    setProgress({ done: false, phase: "inhale", round: 1, remainingMs: PHASE_MS });
    setPhase("running");
  };

  const stop = (): void => {
    setPhase("idle");
    setPaused(false);
    setProgress({ done: false, phase: "inhale", round: 1, remainingMs: PHASE_MS });
  };

  const togglePause = (): void => {
    if (paused) {
      pausedTotal.current += Date.now() - pausedAt.current;
      setPaused(false);
      return;
    }
    pausedAt.current = Date.now();
    setPaused(true);
  };

  const toggleSound = (): void => {
    const next = !sound;
    setSound(next);
    if (next) chime();
  };

  const label = progress.done ? "" : PHASE_LABELS[progress.phase];
  const seconds = progress.done ? 0 : Math.ceil(progress.remainingMs / 1000);

  return (
    <GameShell title={GAME_NAME} animal="turtle" onClose={onClose}>
      <p className="text-xs leading-6 text-ink-soft">
        吸气 4 秒、屏息 4 秒、呼气 4 秒。跟着慢慢来，随时可以停下。
      </p>

      <div
        data-testid="breath-stage"
        data-phase={progress.done ? "done" : progress.phase}
        className="mt-4 flex flex-col items-center"
      >
        <div
          aria-hidden
          className="paper-card flex h-32 w-32 items-center justify-center"
          style={{ transform: progress.done || progress.phase === "exhale" ? "scale(0.92)" : "scale(1)" }}
        >
          <PuppetMark id="turtle" size={80} />
        </div>
        {phase === "running" ? (
          <p className="mt-3 text-sm text-ink">
            {label} <span className="tabular-nums">{seconds}</span>
          </p>
        ) : null}
        {phase === "running" && !progress.done ? (
          <p className="mt-1 text-[11px] text-ink-soft">
            第 {progress.round} / {rounds} 轮
          </p>
        ) : null}
      </div>

      {phase === "idle" ? (
        <div className="mt-4 flex items-end gap-2">
          <label className="flex-1 text-xs text-ink-soft">
            轮数
            <select
              aria-label="轮数"
              value={rounds}
              onChange={(e) => setRounds(clampRounds(Number(e.target.value)))}
              className="paper-card mt-1 w-full px-3 py-2 text-sm text-ink"
            >
              {ROUND_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {n} 轮
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={start} className="paper-button px-5 py-2.5 text-sm">
            开始呼吸
          </button>
        </div>
      ) : null}

      {phase === "running" ? (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={togglePause} className="paper-card flex-1 py-2 text-xs text-ink">
            {paused ? "继续" : "暂停"}
          </button>
          <button type="button" onClick={stop} className="paper-card flex-1 py-2 text-xs text-ink">
            结束
          </button>
        </div>
      ) : null}

      {phase === "done" ? (
        <>
          <p data-testid="breath-closing" className="paper-card mt-4 px-3 py-3 text-sm text-ink">
            <PuppetMark id="turtle" size={16} /> {closingLine()}
          </p>
          <button type="button" onClick={start} className="paper-button mt-3 w-full py-2.5 text-sm">
            再来一轮
          </button>
        </>
      ) : null}

      <button
        type="button"
        aria-label="提示音"
        aria-pressed={sound}
        onClick={toggleSound}
        className="paper-card mt-3 w-full py-2 text-xs text-ink-soft"
      >
        {sound ? "提示音：开" : "提示音：关"}
      </button>
    </GameShell>
  );
}