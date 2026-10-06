"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScene } from "@/components/scene/SceneContext";
import type { AnimalDef, AnimalId } from "@/lib/animals";
import { gatherSeats } from "@/lib/forest/gather";
import type { WorldPos } from "@/lib/forest/ground";
import { createWanderScheduler } from "@/lib/forest/scheduler";
import { TERRITORIES } from "@/lib/forest/territory";
import { useForestStore } from "@/lib/stores/forest";
import { CompanionBadge } from "./CompanionBadge";
import { ForestAnimal, type ActorCommand } from "./ForestAnimal";

type Cast = (AnimalDef & { id: AnimalId })[];

/** 聚拢 / 散开时每只动物最多走多久（秒） */
const GATHER_MAX_SECONDS = 5;

/**
 * 管理森林里所有动物的行为：
 * - 平时：每 12–30 秒挑一只在自己的领地里挪个位置
 * - 聚拢：所有动物去半圆座位，坐下后朝向中心
 * - 散开：回到各自的家
 */
export function ForestAnimals({
  cast,
  onActivate,
}: {
  cast: Cast;
  onActivate?: (id: AnimalId, at: WorldPos) => void;
}) {
  const { layout, reducedMotion } = useScene();
  const companion = useForestStore((s) => s.companion);
  const gather = useForestStore((s) => s.gather);
  const wanderPaused = useForestStore((s) => s.wanderPaused);
  const arrived = useForestStore((s) => s.arrived);

  const [commands, setCommands] = useState<Partial<Record<AnimalId, ActorCommand>>>({});
  const nextId = useRef(1);
  /** 每只动物现在在领地里的哪个锚点 */
  const anchorIndex = useRef<Partial<Record<AnimalId, number>>>({});
  const ids = useMemo(() => cast.map((a) => a.id), [cast]);

  const send = useCallback((id: AnimalId, cmd: Omit<ActorCommand, "id">) => {
    const command = { ...cmd, id: nextId.current++ };
    setCommands((c) => ({ ...c, [id]: command }));
    return command.id;
  }, []);

  // 聚拢 / 散开：给所有动物下指令
  useEffect(() => {
    if (gather === "gathering") {
      const seats = gatherSeats(companion, layout);
      // 聚拢最多 5 秒：大家按自己的速度过去，乌龟稍微赶一赶
      for (const id of ids) send(id, { to: seats[id].pos, facing: seats[id].facing, maxDuration: GATHER_MAX_SECONDS });
    } else if (gather === "dispersing") {
      for (const id of ids) {
        anchorIndex.current[id] = 0;
        // 回家后恢复纸偶原本的朝向（啄木鸟要面朝树干）
        send(id, {
          to: TERRITORIES[layout][id].anchors[0],
          facing: cast.find((a) => a.id === id)?.puppet.facing,
          maxDuration: GATHER_MAX_SECONDS,
        });
      }
    }
    // 只在阶段切换时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gather]);

  // 平时走动
  const wanderingId = useRef<{ animal: AnimalId; command: number } | null>(null);
  const scheduler = useRef<ReturnType<typeof createWanderScheduler> | null>(null);
  useEffect(() => {
    if (reducedMotion || gather !== "idle" || wanderPaused) {
      scheduler.current?.pause();
      return;
    }
    scheduler.current ??= createWanderScheduler({ seed: "forest-wander", animals: ids, now: performance.now() });
    const sched = scheduler.current;
    sched.resume(performance.now());
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const pick = sched.tick(performance.now());
      if (!pick) return;
      const anchors = TERRITORIES[layout][pick].anchors;
      const cur = anchorIndex.current[pick] ?? 0;
      const next = sched.pickAnchor(anchors.length, cur);
      anchorIndex.current[pick] = next;
      wanderingId.current = { animal: pick, command: send(pick, { to: anchors[next] }) };
    }, 500);
    return () => window.clearInterval(timer);
  }, [reducedMotion, gather, wanderPaused, ids, layout, send]);

  const onArrive = useCallback(
    (id: AnimalId, commandId: number) => {
      const w = wanderingId.current;
      if (w && w.animal === id && w.command === commandId) {
        wanderingId.current = null;
        scheduler.current?.done(id, performance.now());
        return;
      }
      const g = useForestStore.getState().gather;
      if (g === "gathering" || g === "dispersing") arrived();
    },
    [arrived],
  );

  return (
    <>
      {cast.map((a) => (
        <ForestAnimal
          key={a.id}
          animal={a}
          command={commands[a.id] ?? null}
          onArrive={(cid) => onArrive(a.id, cid)}
          onActivate={(at) => onActivate?.(a.id, at)}
          badge={companion === a.id ? <CompanionBadge /> : null}
        />
      ))}
    </>
  );
}
