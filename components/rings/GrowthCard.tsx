"use client";

import type { ReactElement } from "react";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { ANIMALS } from "@/lib/animals";
import type { Memory } from "@/lib/journal/types";

/** 一次倾诉留下的成长卡片：日期与标题、心情变化、思维转变、一句领悟、一个小行动、帮到我的那几只 */
export function GrowthCard({ memory, className = "" }: { memory: Memory; className?: string }): ReactElement {
  const hasMood = typeof memory.moodBefore === "number" || typeof memory.moodAfter === "number";

  return (
    <article data-testid="growth-card" className={"paper-card flex flex-col gap-3 px-4 py-4 " + className}>
      <header className="flex flex-col gap-1">
        <p className="text-xs text-ink-soft">{memory.date}</p>
        <h3 className="font-serif text-lg text-ink">{memory.title}</h3>
      </header>
      {hasMood ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft" data-testid="growth-mood">
          <span>{typeof memory.moodBefore === "number" ? String(memory.moodBefore) : "没打分"}</span>
          <span aria-hidden>→</span>
          <span>{typeof memory.moodAfter === "number" ? String(memory.moodAfter) : "没打分"}</span>
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-ink">
        {"从「" + memory.shift.from + "」到「" + memory.shift.to + "」"}
      </p>
      <p className="text-sm leading-relaxed text-ink-soft">{memory.insight}</p>
      {memory.action ? (
        <p className="text-sm leading-relaxed text-ink-soft">{"下一步：" + memory.action}</p>
      ) : null}
      {memory.helpfulAnimals.length > 0 ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span>帮到我的：</span>
          {memory.helpfulAnimals.map((id) => (
            <span key={id} className="inline-flex items-center gap-1">
              <PuppetMark id={id} size={16} />
              {ANIMALS[id].name}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}
