"use client";

import { useRef } from "react";
import { PaperPuppet, type PuppetHandle } from "@/components/puppet/PaperPuppet";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ANIMALS, type AnimalDef, type CharacterId } from "@/lib/animals";

const ORDER: CharacterId[] = ["woodpecker", "owl", "fox", "bear", "turtle", "otter", "squirrel", "tree"];

function Card({ a }: { a: AnimalDef }) {
  const ref = useRef<PuppetHandle>(null);
  const reducedMotion = useReducedMotion();
  return (
    <figure className="paper-card flex flex-col items-center gap-1 p-3">
      <div className="h-28 w-28">
        <PaperPuppet
          ref={ref}
          def={a.puppet}
          label={`${a.name}，${a.species}，${a.mindset}`}
          shadow={{ dx: 0, dy: 3 }}
          reducedMotion={reducedMotion}
          onActivate={() => void ref.current?.react()}
        />
      </div>
      <figcaption className="text-center">
        <div className="text-base">
          {a.emoji} {a.name}
        </div>
        <div className="text-xs text-ink-soft">{a.mindset}</div>
      </figcaption>
    </figure>
  );
}

/** 样板页的「全部角色」视图：8 个纸偶排在一起，方便对比造型和配色 */
export function CastGallery({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-cream/95 p-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <h1 className="text-xl">全部角色</h1>
        <button type="button" onClick={onClose} className="paper-button px-3 py-1.5 text-sm">
          回到森林
        </button>
      </div>
      <div className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDER.map((id) => (
          <Card key={id} a={ANIMALS[id]} />
        ))}
      </div>
    </div>
  );
}
