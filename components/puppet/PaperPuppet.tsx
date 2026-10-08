"use client";

import { motion, useAnimate, useMotionValue, useTransform } from "motion/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties, type ReactNode } from "react";
import { useActorTapPad } from "@/components/scene/ActorContext";
import { gestureMoves, gestureTiming } from "@/lib/puppet/gesture";
import { idleDelay, idleSteps, type GaitRole, type PuppetDef, type PuppetPart } from "@/lib/puppet/types";
import type { Gesture } from "@/lib/talk/gesture";
import styles from "./PaperPuppet.module.css";

export interface PuppetHandle {
  /** 播放点击反馈：整体轻跳 + 标志性部件摆动 */
  react(): Promise<void>;
}

const sortByZ = (parts: readonly PuppetPart[]) => [...parts].sort((a, b) => a.z - b.z);

const GAIT_CLASS: Record<GaitRole, string> = {
  "leg-front": styles.legFront,
  "leg-back": styles.legBack,
  wing: styles.wing,
};

/** 两脚钉：一颗小圆钉，带一点高光 */
function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden>
      <circle cx={x} cy={y} r={2.6} fill="#b48a3c" />
      <circle cx={x - 0.7} cy={y - 0.7} r={0.9} fill="#f3dc9a" />
    </g>
  );
}

function PartNode({
  def,
  part,
  silhouette,
  reducedMotion,
}: {
  def: PuppetDef;
  part: PuppetPart;
  silhouette: boolean;
  reducedMotion: boolean;
}) {
  // 剪影模式下跳过墨色细节和两脚钉，只留纸片轮廓
  if (silhouette && part.ink) return null;
  const [ox, oy] = part.joint;
  const origin = { "--ox": `${ox}px`, "--oy": `${oy}px` } as CSSProperties;
  const children = sortByZ(part.children ?? []);
  const back = children.filter((c) => c.z < 0);
  const front = children.filter((c) => c.z >= 0);
  const idle = part.idle;

  let content: ReactNode = (
    <>
      {back.map((c) => (
        <PartNode key={c.id} def={def} part={c} silhouette={silhouette} reducedMotion={reducedMotion} />
      ))}
      <path d={part.path} fill={silhouette ? "currentColor" : part.fill} />
      {front.map((c) => (
        <PartNode key={c.id} def={def} part={c} silhouette={silhouette} reducedMotion={reducedMotion} />
      ))}
      {part.pin && !silhouette && <Pin x={ox} y={oy} />}
    </>
  );
  if (part.gait && !reducedMotion) {
    content = (
      <g className={`${styles.gait} ${GAIT_CLASS[part.gait]}`} style={origin}>
        {content}
      </g>
    );
  }
  if (idle) {
    const idleStyle = {
      ...origin,
      "--dur": `${idle.duration}s`,
      "--steps": idleSteps(idle.duration),
      "--delay": `${idleDelay(def.id, part.id, idle.duration)}s`,
      "--amt": idle.amount,
    } as CSSProperties;
    content = (
      <g className={`${styles.idle} ${styles[idle.kind]} ${reducedMotion ? styles.reduced : ""}`} style={idleStyle}>
        {content}
      </g>
    );
  }
  return (
    <g data-part={part.id} className={styles.joint} style={origin}>
      {content}
    </g>
  );
}

export function PuppetSvg({
  def,
  silhouette,
  reducedMotion,
  submerged,
  style,
}: {
  def: PuppetDef;
  silhouette: boolean;
  reducedMotion: boolean;
  /** 在水里：裁掉水线以下的部分 */
  submerged: boolean;
  style?: CSSProperties;
}) {
  const [w, h] = def.viewBox;
  const clipId = `water-${def.id}-${silhouette ? "s" : "p"}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 h-full w-full overflow-visible"
      style={style}
      aria-hidden
    >
      {/* 泡在水里的纸偶：水线以下裁掉（留一点上下余量给呼吸和起伏） */}
      {submerged && def.waterline !== undefined && (
        <defs>
          <clipPath id={clipId}>
            <rect x={-w} y={-h} width={w * 3} height={h + def.waterline} />
          </clipPath>
        </defs>
      )}
      <g clipPath={submerged && def.waterline !== undefined ? `url(#${clipId})` : undefined}>
        {sortByZ(def.parts)
          // 上岸后不画水面纸条
          .filter((p) => submerged || !p.waterOnly)
          .map((p) => (
            <PartNode key={p.id} def={def} part={p} silhouette={silhouette} reducedMotion={reducedMotion} />
          ))}
      </g>
    </svg>
  );
}

/**
 * 纸偶本体：一个按钮，里面先画剪影阴影，再画纸偶，最后盖一层时段明暗。
 * 阴影是同一套部件的剪影，挂在同样的动画类上，所以动作完全同步；不使用 CSS filter。
 * facing 和纸偶原本的朝向不同时，整体水平翻转（阴影也一起翻转）。
 * pose 决定播放哪种步态动画；"idle" 时只有待机动画。
 */
export const PaperPuppet = forwardRef<
  PuppetHandle,
  {
    def: PuppetDef;
    label: string;
    /** 阴影偏移（px），由光源方向决定 */
    shadow: { dx: number; dy: number };
    reducedMotion: boolean;
    facing?: "left" | "right";
    pose?: string;
    /** 聆听 / 别人说话时的小动作（点头、竖耳朵、托腮、思考、笑） */
    gesture?: Gesture | null;
    /** 反复轻轻做（聆听时用），默认只做一次 */
    gestureLoop?: boolean;
    /** 泡在水里（只对有 waterline 的纸偶生效） */
    submerged?: boolean;
    onActivate?: () => void;
    /** 角标（比如伙伴的小叶子） */
    badge?: ReactNode;
    className?: string;
  }
>(function PaperPuppet(
  {
    def,
    label,
    shadow,
    reducedMotion,
    facing = def.facing,
    pose = "idle",
    gesture = null,
    gestureLoop = false,
    submerged = false,
    onActivate,
    badge,
    className,
  },
  ref,
) {
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const flip = facing !== def.facing;
  // 纸偶被祖先缩放后可能不足 44px：往外垫一圈透明热区，补多少由 WorldActor 算好放在 context 里
  const fallbackPad = useMotionValue(0);
  const tapPad = useActorTapPad() ?? fallbackPad;
  const tapInset = useTransform(tapPad, (v) => (v > 0 ? v / -2 : 0));

  useImperativeHandle(
    ref,
    () => ({
      async react() {
        const body = scope.current?.querySelector<HTMLElement>("[data-puppet-body]");
        if (!body) return;
        if (reducedMotion) {
          await animate(body, { opacity: [1, 0.7, 1] }, { duration: 0.3 });
          return;
        }
        const sig = scope.current?.querySelectorAll<SVGGElement>(`[data-part="${def.signature.part}"]`);
        const a = def.signature.angle;
        await Promise.all([
          animate(body, { y: [0, -14, 0, -4, 0], scaleY: [1, 1.04, 0.96, 1.01, 1] }, { duration: 0.55, ease: "easeOut" }),
          ...(sig ? [...sig].map((g) => animate(g, { rotate: [0, a, -a * 0.6, a * 0.3, 0] }, { duration: 0.55 })) : []),
        ]);
      },
    }),
    [animate, scope, def, reducedMotion],
  );

  // 小动作：换一个动作才播一次；找不到对应部件就退回头部点头
  const lastGesture = useRef<Gesture | null>(null);
  useEffect(() => {
    if (!gesture || gesture === lastGesture.current) return;
    lastGesture.current = gesture;
    if (reducedMotion) return;
    const root = scope.current;
    if (!root) return;
    const timing = gestureTiming(gestureLoop);
    const play = (moves: readonly { part: string; keyframes: Record<string, number[] | undefined> }[]): void => {
      for (const move of moves) {
        const body = move.part === "" ? root.querySelector<HTMLElement>("[data-puppet-body]") : null;
        const found = body ? [body] : [...root.querySelectorAll<SVGGElement>(`[data-part^="${move.part}"]`)];
        for (const element of found) void animate(element, move.keyframes, timing);
      }
    };
    const moves = gestureMoves(gesture);
    const grounded = moves.filter((move) =>
      move.part === "" ? root.querySelector("[data-puppet-body]") !== null : root.querySelector(`[data-part^="${move.part}"]`) !== null,
    );
    play(grounded.length > 0 ? grounded : gestureMoves("nod"));
  }, [gesture, gestureLoop, reducedMotion, animate, scope]);

  return (
    <button
      ref={scope}
      type="button"
      aria-label={label}
      data-pose={pose}
      data-gesture={gesture ?? "none"}
      data-facing={facing}
      onClick={() => onActivate?.()}
      className={`group pointer-events-auto relative block h-full w-full cursor-pointer rounded-[40%] outline-offset-4 ${className ?? ""}`}
    >
      {/* 热区：垫在纸偶底下（画在最下面、命中却在），点到纸偶外面一点点也算点它 */}
      <motion.span
        aria-hidden
        data-tap-cover
        className="absolute"
        style={{ left: tapInset, right: tapInset, top: tapInset, bottom: tapInset }}
      />
      <motion.div data-puppet-body className="absolute inset-0" style={{ transformOrigin: "50% 100%" }}>
        <div className="absolute inset-0" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
          {/* 剪影阴影：整组一起降透明度，部件重叠处不会叠深；翻转时阴影偏移方向保持跟随光源 */}
          <PuppetSvg
            def={def}
            silhouette
            reducedMotion={reducedMotion}
            submerged={submerged}
            style={{
              color: "var(--paper-shadow)",
              opacity: "var(--paper-shadow-alpha)",
              transform: `translate(${flip ? -shadow.dx : shadow.dx}px, ${shadow.dy}px)`,
            }}
          />
          <PuppetSvg def={def} silhouette={false} reducedMotion={reducedMotion} submerged={submerged} />
          {/* 时段明暗：同形剪影盖在纸偶上，夜晚压暗、黄昏偏暖 */}
          <PuppetSvg
            def={def}
            silhouette
            reducedMotion={reducedMotion}
            submerged={submerged}
            style={{ color: "var(--puppet-shade)", opacity: "var(--puppet-shade-alpha)" }}
          />
        </div>
      </motion.div>
      {badge}
    </button>
  );
});