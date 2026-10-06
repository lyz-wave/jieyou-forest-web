"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { ClientPaperScene } from "@/components/scene/ClientPaperScene";
import type { CameraFocus } from "@/components/scene/PaperScene";
import { ForestAnimals } from "@/components/forest/ForestAnimals";
import { GatherControls } from "@/components/forest/GatherControls";
import { GatheringSpot } from "@/components/forest/Gathering";
import { MorningMist } from "@/components/onboarding/MorningMist";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { ANIMALS, ANIMAL_CAST } from "@/lib/animals";
import { clearingCenter, gatherHalfWidth } from "@/lib/forest/gather";
import { useAppStore } from "@/lib/stores/app";
import { useForestStore } from "@/lib/stores/forest";

function Actors(): ReactElement {
  const gather = useForestStore((s) => s.gather);
  return <><GatheringSpot visible={gather === "gathering" || gather === "seated"} /><ForestAnimals cast={ANIMAL_CAST} /></>;
}

export function ForestApp(): ReactElement {
  const phase = useAppStore((s) => s.phase);
  const profile = useAppStore((s) => s.profile);
  const persistent = useAppStore((s) => s.persistent);
  const boot = useAppStore((s) => s.boot);
  const gather = useForestStore((s) => s.gather);
  const companion = useForestStore((s) => s.companion);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    void boot().catch((err: unknown) => console.error("森林启动失败", err));
  }, [boot]);

  const focus = useMemo<CameraFocus | null>(() => {
    if (phase === "onboarding" && entered) return { depth: 280, point: { x: 0, y: 600 }, z: 80, anchorY: 0.6 };
    if (gather !== "gathering" && gather !== "seated") return null;
    const center = clearingCenter();
    return { depth: center.depth, point: { x: center.x, y: center.y }, z: 220, anchorY: 0.62,
      keepWidth: { portrait: gatherHalfWidth(companion, "portrait"), landscape: gatherHalfWidth(companion, "landscape") } };
  }, [phase, entered, gather, companion]);

  if (phase === "loading") return <main className="fixed inset-0 flex items-center justify-center bg-cream"><p role="status" className="text-lg text-ink-soft">森林正在醒来…</p></main>;

  return (
    <main aria-label="解忧森林">
      <ClientPaperScene focus={focus} timeOverride={phase === "onboarding" ? "dawn" : undefined}
        actors={phase === "forest" ? <Actors /> : undefined}
        overlay={phase === "onboarding" ? <><MorningMist parted={entered} /><Onboarding onEnter={() => setEntered(true)} /></> : <>
          <header className="paper-card absolute left-3 top-3 z-20 max-w-[calc(100vw-24px)] px-4 py-3" style={{ marginTop: "env(safe-area-inset-top)" }}>
            <h1 className="text-base">{profile?.nickname}，欢迎回到森林</h1>
            <p className="mt-1 text-xs text-ink-soft">今天的伙伴 · {ANIMALS[companion].name}</p>
          </header>
          {!persistent && <p role="status" className="paper-card absolute inset-x-4 top-24 z-30 mx-auto max-w-md px-4 py-2 text-center text-xs leading-5">森林这次记不住你，关掉页面后需要重新认识哦</p>}
          <GatherControls count={ANIMAL_CAST.length} />
          <p className="pointer-events-none absolute inset-x-0 bottom-1 z-20 text-center text-[10px] text-cream">解忧森林不能替代专业心理咨询</p>
        </>} />
    </main>
  );
}
