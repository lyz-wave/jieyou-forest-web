"use client";

import type { ReactElement } from "react";
import { ANIMALS } from "@/lib/animals";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { CONCERN_LINE } from "@/lib/talk/guard";
import { useTalkStore } from "@/lib/stores/talk";
import type { TalkFlow } from "./useTalkFlow";

/** 古树的总结：我听到的、森林的声音、一个念头、一小步、一个问题。 */
export function SummaryStage({ flow, onLeave }: { flow: TalkFlow; onLeave: () => void }): ReactElement {
  const summary = useTalkStore((s) => s.summary);
  const concern = useTalkStore((s) => s.concern);

  if (summary === null) {
    return (
      <div className="flex flex-col gap-4">
        <h2 id="talk-title" className="font-serif text-xl text-ink">
          岁岁在整理
        </h2>
        <p role="status" className="text-sm text-ink-soft">
          它把你的话又说了一遍，正想着要不要添一句。
        </p>
        {concern ? (
          <p role="note" className="text-sm leading-relaxed text-ink-soft">
            {CONCERN_LINE}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        岁岁说
      </h2>
      <div className="flex flex-col gap-3 rounded-2xl bg-[var(--paper-soft)] p-4">
        <p className="text-base leading-relaxed text-ink" data-testid="summary-heard">
          {summary.heard}
        </p>
        <ul className="flex flex-col gap-2">
          {summary.voices.map((voice) => (
            <li key={voice.animal + voice.point} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
              <PuppetMark id={voice.animal} size={20} />
              <span>
                {ANIMALS[voice.animal].name}：{voice.point}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-base leading-relaxed text-ink" data-testid="summary-thought">
          {summary.thought}
        </p>
        <p className="text-base leading-relaxed text-ink" data-testid="summary-next">
          {summary.nextStep}
        </p>
        <p className="font-serif text-base leading-relaxed text-ink" data-testid="summary-question">
          {summary.question}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-autofocus
          onClick={flow.again}
          className="paper-button min-h-11 px-5 py-3 text-base"
        >
          让大家再说说
        </button>
        <button
          type="button"
          onClick={() => {
            useTalkStore.getState().toFollowUp();
          }}
          className="min-h-11 text-sm text-ink-soft underline decoration-dotted"
        >
          我还想说一句
        </button>
      </div>
      <div className="mt-1 flex flex-col gap-2 border-t border-dashed border-[var(--paper-shadow)] pt-4">
        <button
          type="button"
          onClick={onLeave}
          className="paper-button min-h-11 px-5 py-3 text-base"
        >
          心结解开了
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="min-h-11 text-sm text-ink-soft underline decoration-dotted"
        >
          先放一放
        </button>
      </div>
    </div>
  );
}