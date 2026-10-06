"use client";

import { useEffect, useRef, useState } from "react";
import { TIME_LABELS, TIMES_OF_DAY } from "@/lib/scene/lighting";
import type { Quality } from "@/lib/scene/quality";
import { useSceneStore } from "@/lib/stores/scene";

const QUALITY_LABELS: Record<Quality, string> = { high: "高", medium: "中", low: "低" };

/** 实时帧率：每 500ms 刷新一次 */
function useFps(): number {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      frames.current++;
      if (t - last >= 500) {
        setFps(Math.round((frames.current * 1000) / (t - last)));
        frames.current = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange(v: T): void;
}) {
  return (
    <fieldset className="flex items-center gap-1">
      <legend className="sr-only">{label}</legend>
      <span className="mr-1 w-10 shrink-0 text-ink-soft">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2 py-1 ${value === o.value ? "bg-moss text-cream" : "bg-cream-deep/60"}`}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}

/** 风格样板页的调试面板：切时段、切画质、模拟减弱动画、看帧率 */
export function DebugPanel({ onShowCast }: { onShowCast?: () => void }) {
  const fps = useFps();
  const [open, setOpen] = useState(false);
  const { timeOverride, quality, qualityLocked, reducedMotionOverride, setTimeOverride, setQuality, setReducedMotionOverride } =
    useSceneStore();

  return (
    <div
      className="paper-card absolute left-3 top-3 z-30 max-w-[calc(100vw-24px)] p-3 text-xs"
      style={{ marginTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span data-testid="fps" className="font-mono">
          {fps} fps · 画质{QUALITY_LABELS[quality]}
          {qualityLocked ? "（锁定）" : "（自动）"}
        </span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-md bg-cream-deep/60 px-2 py-1">
          {open ? "收起" : "调试"}
        </button>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          <Segmented
            label="时段"
            value={timeOverride ?? "auto"}
            options={[{ value: "auto", label: "自动" }, ...TIMES_OF_DAY.map((t) => ({ value: t, label: TIME_LABELS[t] }))]}
            onChange={(v) => setTimeOverride(v === "auto" ? null : v)}
          />
          <Segmented
            label="画质"
            value={qualityLocked ? quality : "auto"}
            options={[
              { value: "auto", label: "自动" },
              { value: "high", label: "高" },
              { value: "medium", label: "中" },
              { value: "low", label: "低" },
            ]}
            onChange={(v) => (v === "auto" ? setQuality("high", false) : setQuality(v, true))}
          />
          <Segmented
            label="动画"
            value={reducedMotionOverride === null ? "auto" : reducedMotionOverride ? "reduce" : "full"}
            options={[
              { value: "auto", label: "跟随系统" },
              { value: "full", label: "完整" },
              { value: "reduce", label: "减弱" },
            ]}
            onChange={(v) => setReducedMotionOverride(v === "auto" ? null : v === "reduce")}
          />
          {onShowCast && (
            <button type="button" onClick={onShowCast} className="mt-1 self-start rounded-md bg-cream-deep/60 px-2 py-1">
              查看全部角色
            </button>
          )}
        </div>
      )}
    </div>
  );
}
