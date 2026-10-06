"use client";

import { AnimatePresence, motion, useMotionValue } from "motion/react";
import type { CSSProperties } from "react";
import { useScene } from "@/components/scene/SceneContext";
import { WorldActor } from "@/components/scene/WorldActor";
import { clearingCenter } from "@/lib/forest/gather";
import { roughPath } from "@/lib/paper/roughen";
import { ellipse } from "@/lib/paper/shapes";
import styles from "./Gathering.module.css";

const r = (pts: { x: number; y: number }[], seed: string, amp = 1.2, step = 6) =>
  roughPath(pts, { seed, amplitude: amp, step });

// ── 篝火：底下几根交叉的柴，上面三层火苗（外红、中橙、内黄） ─────────────
const LOGS = [
  r(
    [
      { x: 30, y: 168 },
      { x: 168, y: 140 },
      { x: 172, y: 152 },
      { x: 34, y: 180 },
    ],
    "log-a",
  ),
  r(
    [
      { x: 32, y: 140 },
      { x: 170, y: 168 },
      { x: 166, y: 180 },
      { x: 28, y: 152 },
    ],
    "log-b",
  ),
];
const STONES = [20, 48, 80, 120, 152, 180].map((x, i) =>
  r(ellipse(x, 182 - (i % 2) * 2, 13, 8, 12), `stone-${i}`, 0.8, 4),
);
const flame = (cx: number, h: number, w: number, seed: string) =>
  r(
    [
      { x: cx, y: 160 - h },
      { x: cx + w * 0.35, y: 160 - h * 0.55 },
      { x: cx + w * 0.5, y: 150 },
      { x: cx + w * 0.2, y: 160 },
      { x: cx - w * 0.2, y: 160 },
      { x: cx - w * 0.5, y: 150 },
      { x: cx - w * 0.35, y: 160 - h * 0.55 },
    ],
    seed,
    1.5,
    7,
  );
const FLAMES = [
  { d: flame(100, 120, 96, "flame-outer"), fill: "#d4542d", dur: 0.55, delay: 0 },
  { d: flame(78, 80, 50, "flame-left"), fill: "#e0703a", dur: 0.45, delay: -0.2 },
  { d: flame(124, 86, 54, "flame-right"), fill: "#e0703a", dur: 0.5, delay: -0.35 },
  { d: flame(100, 88, 62, "flame-mid"), fill: "#f0a03e", dur: 0.4, delay: -0.1 },
  { d: flame(100, 54, 34, "flame-core"), fill: "#ffe08a", dur: 0.35, delay: -0.25 },
];

export function Campfire({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className={`absolute inset-0 h-full w-full overflow-visible ${reducedMotion ? styles.reduced : ""}`} aria-hidden>
      <defs>
        <radialGradient id="fire-glow">
          <stop offset="0%" stopColor="#ffe3a0" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#ffb25a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffb25a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 地面上的一圈火光：照亮围坐的动物脚下 */}
      <ellipse className={styles.glow} cx={100} cy={170} rx={260} ry={60} fill="url(#fire-glow)" />
      {STONES.map((d, i) => (
        <path key={i} d={d} fill="#7b7468" />
      ))}
      {LOGS.map((d, i) => (
        <path key={i} d={d} fill="#6b4a33" />
      ))}
      {FLAMES.map((f, i) => (
        <path
          key={i}
          d={f.d}
          fill={f.fill}
          className={styles.flame}
          style={{ "--dur": `${f.dur}s`, "--delay": `${f.delay}s` } as CSSProperties}
        />
      ))}
    </svg>
  );
}

// ── 阳光：一片纸剪的光斑铺在空地上，几条光束从左上方斜照下来 ─────────────
const SUN_POOL = r(ellipse(100, 182, 150, 22, 30), "sun-pool", 2, 10);
/** 光束：上窄下宽的梯形，顶端在画面外上方，底端落在光斑里 */
const beam = (bottomX: number, topX: number, bottomW: number, topW: number, seed: string) =>
  r(
    [
      { x: topX - topW / 2, y: -360 },
      { x: topX + topW / 2, y: -360 },
      { x: bottomX + bottomW / 2, y: 182 },
      { x: bottomX - bottomW / 2, y: 182 },
    ],
    seed,
    1.5,
    16,
  );
const RAYS = [
  { d: beam(40, -120, 46, 14, "ray-a"), delay: 0 },
  { d: beam(100, -60, 70, 20, "ray-b"), delay: -1.2 },
  { d: beam(165, 10, 40, 12, "ray-c"), delay: -2.4 },
];

export function SunPatch({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className={`absolute inset-0 h-full w-full overflow-visible ${reducedMotion ? styles.reduced : ""}`} aria-hidden>
      <defs>
        <linearGradient id="sun-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6d8" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff6d8" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {RAYS.map((ray, i) => (
        <path
          key={i}
          d={ray.d}
          fill="url(#sun-ray)"
          className={styles.ray}
          style={{ "--delay": `${ray.delay}s` } as CSSProperties}
        />
      ))}
      <path d={SUN_POOL} fill="#fff1c4" opacity={0.6} />
    </svg>
  );
}

/** 空地中央的篝火（夜晚）或阳光（其余时段），聚拢时淡入，散开时淡出 */
export function GatheringSpot({ visible }: { visible: boolean }) {
  const { lighting, reducedMotion } = useScene();
  const center = clearingCenter();
  const x = useMotionValue(center.x);
  const y = useMotionValue(center.y);
  const depth = useMotionValue(center.depth);
  const night = lighting.backlit;
  return (
    <WorldActor x={x} y={y} depth={depth} width={night ? 96 : 200} height={night ? 96 : 200} testId="gathering-spot" className="pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={night ? "fire" : "sun"}
            data-kind={night ? "campfire" : "sunlight"}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.8 }}
            style={{ transformOrigin: "50% 100%" }}
          >
            {night ? <Campfire reducedMotion={reducedMotion} /> : <SunPatch reducedMotion={reducedMotion} />}
          </motion.div>
        )}
      </AnimatePresence>
    </WorldActor>
  );
}
