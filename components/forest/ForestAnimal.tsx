"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { PaperPuppet, type PuppetHandle } from "@/components/puppet/PaperPuppet";
import { useScene } from "@/components/scene/SceneContext";
import { WorldActor } from "@/components/scene/WorldActor";
import { useActorMotion } from "@/hooks/useActorMotion";
import type { AnimalDef, AnimalId } from "@/lib/animals";
import type { WorldPos } from "@/lib/forest/ground";
import type { Facing } from "@/lib/forest/motion";
import type { Gesture } from "@/lib/talk/gesture";
import { HABITS, TERRITORIES, type Perch } from "@/lib/forest/territory";
import { shadowOffset } from "@/lib/scene/lighting";

/** 外部给动物下的指令：去某处（走过去或瞬移），到了以后朝向某边 */
export interface ActorCommand {
  id: number;
  to: WorldPos;
  facing?: Facing;
  instant?: boolean;
  /** 最长用时（秒），超过就加速 */
  maxDuration?: number;
}

/** 地上的接触阴影：一块扁椭圆，离地越高越小越淡 */
function ContactShadow({ lift, size }: { lift: MotionValue<number>; size: number }) {
  const scale = useTransform(lift, (l) => Math.max(0.35, 1 - l / 120));
  const opacity = useTransform(lift, (l) => Math.max(0.1, 0.35 - l / 300));
  // 阴影贴在地面：动物离地时，阴影要比身体低 lift
  const { unit } = useScene();
  const y = useTransform(lift, (l) => l * unit);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 rounded-[50%]"
      style={{
        bottom: -size * 0.03,
        width: size * 0.55,
        height: size * 0.09,
        marginLeft: -size * 0.275,
        background: "var(--paper-shadow)",
        opacity,
        scale,
        y,
      }}
    />
  );
}

/** 树上（树干、树枝、树洞）和水里的动物平时不画地面阴影；一旦离开（聚拢时走到草地上）就画 */
function hasGroundShadow(perch: Perch, pose: string): boolean {
  if (perch === "ground") return true;
  return pose !== "idle" && pose !== "climb-up" && pose !== "climb-down" && pose !== "swim";
}

/**
 * 森林里的一只动物：放在 3D 世界里，按指令沿习性规划的路线移动。
 * 走动、聚拢和散开都通过 command 下发，动物走到后调用 onArrive。
 */
export function ForestAnimal({
  animal,
  command,
  onArrive,
  onActivate,
  badge,
  playToken = 0,
  speaking = false,
  bubble = null,
  gesture = null,
  gestureLoop = false,
}: {
  animal: AnimalDef & { id: AnimalId };
  command: ActorCommand | null;
  onArrive?: (commandId: number) => void;
  /** 点动物时回调，带上它此刻站的位置（角色卡据此把镜头推近） */
  onActivate?: (at: WorldPos) => void;
  /** 伙伴动物的小叶子徽记 */
  badge?: ReactNode;
  /** 刚玩完游戏回到森林时变大的数字，动物据此轻跳一下（0 = 不跳） */
  playToken?: number;
  /** 正在发言：走到前面、放大一点、带一圈光 */
  speaking?: boolean;
  /** 头顶气泡里已经打出来的字 */
  bubble?: string | null;
  /** 这一刻的小动作：聆听做自己的，圆桌做反应 */
  gesture?: Gesture | null;
  /** 反复轻轻做（聆听时用） */
  gestureLoop?: boolean;
}) {
  const { lighting, reducedMotion, unit, layout } = useScene();
  const territory = TERRITORIES[layout][animal.id];
  const home = territory.anchors[0];
  const motionState = useActorMotion(animal.id, home, animal.puppet.facing);
  const { moveTo, face, position } = motionState;
  const puppet = useRef<PuppetHandle>(null);
  const size = HABITS[animal.id].size[layout];
  const { dx, dy } = shadowOffset(lighting, size * unit * 0.04);
  // 泡在水里时：把水线（而不是底边）对齐到所站的位置，水线以下沉到画面外；上岸后整只显示
  const [, vbH] = animal.puppet.viewBox;
  const swimming = animal.puppet.waterline !== undefined && motionState.inWater;
  const sink = swimming ? ((vbH - (animal.puppet.waterline ?? vbH)) / vbH) * 100 : 0;

  // 横竖屏切换：直接回到新布局的家
  const lastLayout = useRef(layout);
  useEffect(() => {
    if (lastLayout.current === layout) return;
    lastLayout.current = layout;
    void moveTo(home, { instant: true });
  }, [layout, home, moveTo]);

  // 回调放在 ref 里：父组件每次渲染都会传新的函数，不能让它触发重新下指令
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onArriveRef.current = onArrive;
  });

  const lastCommand = useRef<number | null>(null);
  useEffect(() => {
    if (!command || command.id === lastCommand.current) return;
    lastCommand.current = command.id;
    void moveTo(command.to, { instant: command.instant || reducedMotion, maxDuration: command.maxDuration }).then((completed) => {
      // 被下一条指令打断时不算到达
      if (!completed) return;
      if (command.facing) face(command.facing);
      onArriveRef.current?.(command.id);
    });
  }, [command, moveTo, face, reducedMotion]);

  // 从小游戏回到森林：刚玩过的那只轻跳一下（token 变大才跳，换一只玩不会误跳）
  useEffect(() => {
    if (!playToken) return;
    void puppet.current?.react();
  }, [playToken]);

  return (
    <WorldActor
      x={motionState.x}
      y={motionState.y}
      depth={motionState.depth}
      width={size}
      height={size}
      testId={`animal-${animal.id}`}
    >
      {/* 只有站在地上的动物才在地面投下接触阴影；树上和水里的没有 */}
      {hasGroundShadow(territory.perch, motionState.pose) && <ContactShadow lift={motionState.lift} size={size * unit} />}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: speaking ? 1.14 : 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
      >
        {speaking ? (
          <div
            aria-hidden
            data-testid="speaking-glow"
            className="pointer-events-none absolute -inset-3 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(255, 238, 200, 0.5), rgba(255, 238, 200, 0))" }}
          />
        ) : null}
      <div className="absolute inset-0" style={sink ? { transform: `translateY(${sink}%)` } : undefined}>
        <PaperPuppet
          ref={puppet}
          def={animal.puppet}
          submerged={swimming}
          label={`${animal.name}，${animal.species}，${animal.mindset}`}
          shadow={{ dx, dy }}
          reducedMotion={reducedMotion}
          facing={motionState.facing}
          pose={motionState.pose}
          gesture={gesture}
          gestureLoop={gestureLoop}
          badge={badge}
          onActivate={() => {
            void puppet.current?.react();
            onActivate?.(position());
          }}
        />
      </div>
      </motion.div>
      {speaking ? (
        <motion.div
          data-testid="talk-bubble"
          className="pointer-events-none absolute bottom-full left-1/2 w-[260px]"
          style={{ x: "-50%" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="paper-card px-3 py-2">
            <p className="text-xs text-ink-soft">{animal.name + " · " + animal.mindset}</p>
            <p data-testid="talk-bubble-text" className="text-sm leading-relaxed text-ink">{bubble ?? ""}</p>
          </div>
        </motion.div>
      ) : null}
    </WorldActor>
  );
}