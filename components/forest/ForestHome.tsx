"use client";

import type { ReactElement } from "react";
import { CharacterCard } from "@/components/forest/CharacterCard";
import { GatherControls } from "@/components/forest/GatherControls";
import { GameHost } from "@/components/games/GameHost";
import { PausedPrompt } from "@/components/forest/PausedPrompt";
import { RingBrowser } from "@/components/rings/RingBrowser";
import { TalkFlow } from "@/components/talk/TalkFlow";
import { ANIMALS, ANIMAL_CAST } from "@/lib/animals";
import { useAppStore } from "@/lib/stores/app";
import { useForestStore } from "@/lib/stores/forest";

/**
 * 森林主场景的纸面浮层：欢迎条、存储提醒、开始倾诉、免责声明，以及当前打开的角色卡。
 * 动物和古树本身画在 3D 场景里（见 ForestApp 的 Actors），这里只管浮层。
 */
export function ForestHome(): ReactElement {
  const profile = useAppStore((s) => s.profile);
  const persistent = useAppStore((s) => s.persistent);
  const companion = useForestStore((s) => s.companion);
  const opened = useForestStore((s) => s.opened);
  const closeCard = useForestStore((s) => s.closeCard);
  const startGame = useForestStore((s) => s.startGame);
  const rings = useForestStore((s) => s.rings);
  const openRings = useForestStore((s) => s.openRings);
  const closeRings = useForestStore((s) => s.closeRings);

  return (
    <>
      <header
        className="paper-card absolute left-3 top-3 z-20 max-w-[calc(100vw-24px)] px-4 py-3"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <h1 className="text-base">{profile?.nickname}，欢迎回到森林</h1>
        <p className="mt-1 text-xs text-ink-soft">今天的伙伴 · {ANIMALS[companion].name}</p>
      </header>

      {!persistent && (
        <p
          role="status"
          className="paper-card absolute inset-x-4 top-24 z-30 mx-auto max-w-md px-4 py-2 text-center text-xs leading-5"
        >
          森林这次记不住你，关掉页面后需要重新认识哦
        </p>
      )}

      <GatherControls count={ANIMAL_CAST.length} />

      {opened && (
        <CharacterCard
          key={opened}
          id={opened}
          companion={companion}
          onClose={closeCard}
          onPlay={(gameId) => {
            // 古树没有游戏，其它都是动物
            if (opened !== "tree") startGame(gameId, opened);
          }}
          onRings={openRings}
        />
      )}

      {rings && <RingBrowser onClose={closeRings} />}

      <PausedPrompt />

      <GameHost />

      <TalkFlow />

      <p className="pointer-events-none absolute inset-x-0 bottom-1 z-20 text-center text-[10px] text-cream">
        解忧森林不能替代专业心理咨询
      </p>
    </>
  );
}