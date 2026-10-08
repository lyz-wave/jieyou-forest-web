"use client";

import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
import { makeParticles } from "@/lib/scene/particles";
import styles from "./Particles.module.css";

/**
 * 落叶、光斑、萤火虫。全部是 DOM + CSS 关键帧，只动 transform / opacity。
 * 页面隐藏、或有人在倾诉时暂停；减弱动画时不渲染。
 */
export const Particles = memo(function Particles({
  count,
  night,
  reducedMotion,
  quiet = false,
}: {
  count: number;
  night: boolean;
  reducedMotion: boolean;
  quiet?: boolean;
}) {
  const particles = useMemo(() => makeParticles(count, night), [count, night]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (reducedMotion) return null;

  const stopped = hidden || quiet;

  return (
    <div
      data-testid="particles"
      data-paused={stopped}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${stopped ? styles.paused : ""}`}
    >
      {particles.map((p, i) => {
        const vars = {
          "--left": `${p.left}%`,
          "--top": `${p.top}%`,
          "--size": `${p.size}px`,
          "--dur": `${p.duration}s`,
          "--delay": `${p.delay}s`,
          "--sway": `${p.sway}px`,
          "--front": p.front,
          "--back": p.back,
        } as CSSProperties;
        if (p.kind === "leaf") {
          return (
            <div key={i} data-particle="leaf" className={styles.leafFall} style={vars}>
              <div className={styles.leafSway}>
                <div className={styles.leafFlip}>
                  <span className={styles.leafFront} />
                  <span className={styles.leafBack} />
                </div>
              </div>
            </div>
          );
        }
        return <div key={i} data-particle={p.kind} className={p.kind === "firefly" ? styles.firefly : styles.mote} style={vars} />;
      })}
    </div>
  );
});