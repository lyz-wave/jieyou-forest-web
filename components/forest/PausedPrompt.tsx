"use client";

import { useState, type ReactElement } from "react";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useJournalStore } from "@/lib/stores/journal";
import { useTalkStore } from "@/lib/stores/talk";
import { ANIMAL_CAST } from "@/lib/animals";
import { useForestStore } from "@/lib/stores/forest";

export const PAUSED_QUESTION = "上次那件事，还想接着聊吗？";

/**
 * 上次写到一半、按了「先放一放」的那一次：进森林时古树轻声问一句（文档 6.2 / 6.3.9）。
 * 说「接着聊」就把上次那句原话带回倾诉框，或者也可以先不用——库里那一次还在。
 */
export function PausedPrompt(): ReactElement | null {
  const paused = useJournalStore((s) => s.paused);
  const [hidden, setHidden] = useState(false);
  if (paused === null || hidden) return null;
  const last = [...paused.messages].reverse().find((message) => message.speaker === "user");
  return (
    <section
      data-testid="paused-prompt"
      aria-label="上次那件事"
      className="paper-card absolute inset-x-4 bottom-24 z-30 mx-auto flex max-w-md flex-col gap-3 px-4 py-3"
    >
      <div className="flex items-start gap-2">
        <PuppetMark id="tree" size={28} />
        <p className="text-sm leading-6">{PAUSED_QUESTION}</p>
      </div>
      {last ? <p className="text-xs leading-5 text-ink-soft">上次停在这句：「{last.content}」</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            useForestStore.getState().startGather(ANIMAL_CAST.length);
            useTalkStore.getState().open();
            if (last) useTalkStore.getState().setText(last.content);
            void useJournalStore.getState().putSession({ ...paused, status: "open" });
            setHidden(true);
          }}
          className="paper-button min-h-11 px-4 py-2 text-sm"
        >
          接着聊
        </button>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
          }}
          className="min-h-11 px-2 text-sm text-ink-soft underline decoration-dotted"
        >
          先不用
        </button>
      </div>
    </section>
  );
}
