"use client";

import type { ReactElement } from "react";
import { useTalkStore } from "@/lib/stores/talk";

const MOODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** 说完了，再打一次分：现在心里松一点了吗？可以跳过。 */
export function RateStage({ onGrow }: { onGrow: () => void }): ReactElement {
  const mood = useTalkStore((s) => s.mood);
  const moodAfter = useTalkStore((s) => s.moodAfter);
  const setMoodAfter = useTalkStore((s) => s.setMoodAfter);

  return (
    <div className="flex flex-col gap-4">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        现在心里松一点了吗？
      </h2>
      <p className="text-sm leading-relaxed text-ink-soft">
        {mood === null ? "进来的时候没打分，这次也可以跳过。" : "进来的时候是 " + String(mood) + " 分。"}
      </p>
      <div
        data-autofocus
        tabIndex={-1}
        role="group"
        aria-label="现在的心情，一到十分，可以跳过"
        className="grid grid-cols-5 gap-2"
      >
        {MOODS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={moodAfter === value}
            aria-label={"心情 " + String(value) + " 分"}
            onClick={() => {
              setMoodAfter(moodAfter === value ? null : value);
            }}
            className="paper-button flex min-h-11 items-center justify-center text-base"
          >
            {value}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          setMoodAfter(null);
          useTalkStore.getState().toGrow();
          onGrow();
        }}
        className="min-h-11 self-start text-sm text-ink-soft underline decoration-dotted"
      >
        跳过打分
      </button>
      <button
        type="button"
        onClick={() => {
          useTalkStore.getState().toGrow();
          onGrow();
        }}
        className="paper-button min-h-11 px-5 py-3 text-base"
      >
        看看这次留下了什么
      </button>
    </div>
  );
}
