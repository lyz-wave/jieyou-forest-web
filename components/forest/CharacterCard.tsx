"use client";

import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useState, type ReactElement } from "react";
import { PopupCard } from "@/components/ui/PopupCard";
import { ANIMALS, type AnimalId, type CharacterId } from "@/lib/animals";

/**
 * 角色卡：点动物或古树时弹出的纸卡，以底边为轴折起（PopupCard 负责折起动画和关闭）。
 * 内容是名字、物种 · 思维方式、一句话介绍、心理学依据、一句样句，以及一起玩的游戏入口。
 * 古树没有小游戏，换成「我的年轮」——本阶段只给一张纸条提示。
 */
export function CharacterCard({
  id,
  companion,
  onClose,
  onPlay,
}: {
  id: CharacterId;
  companion?: AnimalId;
  onClose: () => void;
  onPlay?: (gameId: string) => void;
}): ReactElement {
  const def = ANIMALS[id];
  const game = def.game;
  const [ringTip, setRingTip] = useState(false);

  return (
    <PopupCard open labelledBy="character-card-title" onClose={onClose}>
      <div className="flex items-start gap-3">
        <PuppetMark id={id} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="character-card-title" className="text-xl">
              {def.name}
            </h2>
            {companion === id && (
              <span className="rounded-full bg-moss/15 px-2 py-0.5 text-[11px] text-ink-soft">我的伙伴</span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {def.species} · {def.mindset}
          </p>
        </div>
        <button type="button" aria-label="关闭" onClick={onClose} className="paper-button shrink-0 px-3 py-1 text-sm">
          ✕
        </button>
      </div>

      <p className="mt-4 text-sm leading-6">{def.summary}</p>
      <p className="mt-2 text-xs leading-5 text-ink-soft">心理学依据 · {def.basis}</p>
      <p className="mt-4 border-l-2 border-ink-soft/30 pl-3 text-sm leading-6 text-ink-soft">「{def.sample}」</p>

      {game ? (
        <button
          type="button"
          onClick={() => onPlay?.(game.id)}
          className="paper-button mt-5 w-full py-2.5"
        >
          一起玩：{game.name}
        </button>
      ) : (
        <>
          <button type="button" onClick={() => setRingTip(true)} className="paper-button mt-5 w-full py-2.5">
            <span className="inline-flex items-center gap-1.5">
              <PuppetMark id="tree" size={18} />
              我的年轮
            </span>
          </button>
          {ringTip && (
            <p role="status" className="paper-card mt-3 px-3 py-2 text-center text-xs leading-5">
              年轮还在生长，过些日子再来看看
            </p>
          )}
        </>
      )}
    </PopupCard>
  );
}
