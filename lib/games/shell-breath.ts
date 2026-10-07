/* **/
/* * 龟壳呼吸（慢慢）的阶段计算：吸气 4 秒 → 屏息 4 秒 → 呼气 4 秒 → 屏息 4 秒。*/
/* * 界面每帧只要问 phaseAt(已经过去的时间) 就知道该显示什么。*/
/* */

export const PHASE_MS = 4000;
export const BREATH_PHASES = ["inhale", "hold", "exhale", "hold"] as const;
export type BreathPhase = (typeof BREATH_PHASES)[number];
export const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: "吸气",
  hold: "屏息",
  exhale: "呼气",
};
export const DEFAULT_ROUNDS = 3;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 10;
export const CLOSING_LINE = "呼吸回来了，把这份安静慢慢带回今天。";

export function clampRounds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ROUNDS;
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.floor(value)));
}

export function roundMs(): number {
  return BREATH_PHASES.length * PHASE_MS;
}

export function totalMs(rounds: number): number {
  return clampRounds(rounds) * roundMs();
}

export type BreathProgress =
  | { done: false; phase: BreathPhase; round: number; remainingMs: number }
  | { done: true };

export function phaseAt(elapsedMs: number, rounds: number): BreathProgress {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= totalMs(rounds)) return { done: true };
  const index = Math.floor(elapsed / PHASE_MS);
  return {
    done: false,
    phase: BREATH_PHASES[index % BREATH_PHASES.length],
    round: Math.floor(index / BREATH_PHASES.length) + 1,
    remainingMs: PHASE_MS - (elapsed % PHASE_MS),
  };
}

export function closingLine(): string {
  return CLOSING_LINE;
}

export function shellBreathContext(rounds: number): string | null {
  const done = Math.floor(rounds);
  if (!(done > 0)) return null;
  return "完成了 " + done + " 轮盒式呼吸";
}