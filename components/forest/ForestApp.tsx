"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { DevTools } from "@/components/dev/DevTools";
import { ClientPaperScene } from "@/components/scene/ClientPaperScene";
import type { CameraFocus } from "@/components/scene/PaperScene";
import { ForestAnimals } from "@/components/forest/ForestAnimals";
import { ForestHome } from "@/components/forest/ForestHome";
import { GatheringSpot } from "@/components/forest/Gathering";
import { TreeSpot } from "@/components/forest/TreeSpot";
import { MorningMist } from "@/components/onboarding/MorningMist";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { ANIMAL_CAST } from "@/lib/animals";
import { clearingCenter, gatherHalfWidth } from "@/lib/forest/gather";
import { TREE_HOTSPOT } from "@/lib/scene";
import { useAppStore } from "@/lib/stores/app";
import { useForestStore } from "@/lib/stores/forest";
import { useJournalStore } from "@/lib/stores/journal";

/** 3D 世界里的角色：古树热区、聚拢空地、7 只动物 */
function Actors(): ReactElement {
  const gather = useForestStore((s) => s.gather);
  const openCard = useForestStore((s) => s.openCard);
  return (
    <>
      <TreeSpot onActivate={() => openCard("tree")} />
      <GatheringSpot visible={gather === "gathering" || gather === "seated"} />
      <ForestAnimals cast={ANIMAL_CAST} onActivate={(id, at) => openCard(id, at)} />
    </>
  );
}

export function ForestApp(): ReactElement {
  const phase = useAppStore((s) => s.phase);
  const boot = useAppStore((s) => s.boot);
  const gather = useForestStore((s) => s.gather);
  const companion = useForestStore((s) => s.companion);
  const opened = useForestStore((s) => s.opened);
  const openedAt = useForestStore((s) => s.openedAt);
  const pendingGame = useForestStore((s) => s.pendingGame);
  const gameAt = useForestStore((s) => s.gameAt);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    void boot().catch((err: unknown) => console.error("森林启动失败", err));
  }, [boot]);

  // 进森林就把年轮读进内存：成长卡片、年轮页和「上次那件事」都从这里来
  useEffect(() => {
    void useJournalStore.getState().load();
  }, []);

  const focus = useMemo<CameraFocus | null>(() => {
    if (phase === "onboarding" && entered) return { depth: 280, point: { x: 0, y: 600 }, z: 80, anchorY: 0.6 };
    // 打开角色卡：镜头轻轻推向那只动物（古树推到树冠），把画面留出下方的纸卡位置
    if (opened) {
      const at =
        openedAt ?? (opened === "tree" ? { x: TREE_HOTSPOT.x, y: TREE_HOTSPOT.y - TREE_HOTSPOT.height / 2, depth: TREE_HOTSPOT.depth } : null);
      return at ? { depth: at.depth, point: { x: at.x, y: at.y }, z: 120, anchorY: 0.4 } : null;
    }
    // 玩小游戏：镜头继续对着玩游戏的这只动物
    if (pendingGame && gameAt) {
      return { depth: gameAt.depth, point: { x: gameAt.x, y: gameAt.y }, z: 140, anchorY: 0.5 };
    }
    if (gather !== "gathering" && gather !== "seated") return null;
    const center = clearingCenter();
    return { depth: center.depth, point: { x: center.x, y: center.y }, z: 220, anchorY: 0.62,
      keepWidth: { portrait: gatherHalfWidth(companion, "portrait"), landscape: gatherHalfWidth(companion, "landscape") } };
  }, [phase, entered, gather, companion, opened, openedAt, pendingGame, gameAt]);

  if (phase === "loading") return <main className="fixed inset-0 flex items-center justify-center bg-cream"><p role="status" className="text-lg text-ink-soft">森林正在醒来…</p></main>;

  return (
    <main aria-label="解忧森林">
      <ClientPaperScene focus={focus} timeOverride={phase === "onboarding" ? "dawn" : undefined}
        actors={phase === "forest" ? <Actors /> : undefined}
        overlay={phase === "onboarding" ? <><MorningMist parted={entered} /><Onboarding onEnter={() => setEntered(true)} /></> : <><ForestHome /><DevTools /></>} />
    </main>
  );
}
