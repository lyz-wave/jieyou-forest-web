"use client";

import type { ReactElement } from "react";
import { GrowthCard } from "@/components/rings/GrowthCard";
import { useTalkStore } from "@/lib/stores/talk";

/** 这次留下的成长卡片：收好它，或者去古树里看年轮。 */
export function GrowthCardStage({
  onRings,
  onLeave,
}: {
  onRings: () => void;
  onLeave: () => void;
}): ReactElement | null {
  const memory = useTalkStore((s) => s.memory);
  if (memory === null) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        这次留下了什么
      </h2>
      <GrowthCard memory={memory} />
      <button type="button" onClick={onRings} className="paper-button min-h-11 px-5 py-3 text-base">
        看看我的年轮
      </button>
      <button
        type="button"
        onClick={onLeave}
        className="min-h-11 text-sm text-ink-soft underline decoration-dotted"
      >
        收好，回到森林
      </button>
    </div>
  );
}
