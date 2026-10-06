"use client";

import { useEffect, useMemo, useState } from "react";
import { CastGallery } from "@/components/dev/CastGallery";
import { DebugPanel } from "@/components/dev/DebugPanel";
import { ForestAnimals } from "@/components/forest/ForestAnimals";
import { GatherControls } from "@/components/forest/GatherControls";
import { GatheringSpot } from "@/components/forest/Gathering";
import { ClientPaperScene } from "@/components/scene/ClientPaperScene";
import type { CameraFocus } from "@/components/scene/PaperScene";
import { ANIMAL_CAST, type AnimalDef, type AnimalId } from "@/lib/animals";
import { clearingCenter, gatherHalfWidth } from "@/lib/forest/gather";
import { TIMES_OF_DAY, type TimeOfDay } from "@/lib/scene/lighting";
import { useForestStore } from "@/lib/stores/forest";
import { useSceneStore } from "@/lib/stores/scene";

function Actors({ cast }: { cast: (AnimalDef & { id: AnimalId })[] }) {
  const gather = useForestStore((s) => s.gather);
  return (
    <>
      <GatheringSpot visible={gather === "gathering" || gather === "seated"} />
      <ForestAnimals cast={cast} />
    </>
  );
}

export function StyleSample() {
  const cast = ANIMAL_CAST;

  // 支持 ?time=night 直接打开某个时段，方便截图对比
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("time");
    if (t && (TIMES_OF_DAY as readonly string[]).includes(t)) {
      useSceneStore.getState().setTimeOverride(t as TimeOfDay);
    }
  }, []);

  const gather = useForestStore((s) => s.gather);
  const companion = useForestStore((s) => s.companion);
  // 聚拢时镜头推近空地，但要让两侧所有动物都还在画面里
  const focus = useMemo<CameraFocus | null>(() => {
    if (gather !== "gathering" && gather !== "seated") return null;
    const c = clearingCenter();
    return {
      depth: c.depth,
      point: { x: c.x, y: c.y },
      z: 220,
      anchorY: 0.62,
      keepWidth: { portrait: gatherHalfWidth(companion, "portrait"), landscape: gatherHalfWidth(companion, "landscape") },
    };
  }, [gather, companion]);

  const [gallery, setGallery] = useState(false);

  return (
    <ClientPaperScene
      focus={focus}
      actors={<Actors cast={cast} />}
      overlay={
        <>
          <DebugPanel onShowCast={() => setGallery(true)} />
          <GatherControls count={cast.length} />
          {gallery && <CastGallery onClose={() => setGallery(false)} />}
        </>
      }
    />
  );
}
