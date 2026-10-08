"use client";

import { useState, type ReactElement } from "react";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useTalkStore } from "@/lib/stores/talk";
import { CRISIS, HOTLINES } from "@/lib/talk/guard";

/**
 * 守护页（文档第八节）：这里不谈事，只给人和出路。
 * 岁岁先说话，然后三条现在能做的事、一张求助卡；
 * 他自己确认「我现在是安全的」之前，继续的按钮不放开。
 */
export function RiskStage({ onLeave }: { onLeave: () => void }): ReactElement {
  const [safe, setSafe] = useState(false);

  return (
    <div role="alert" data-autofocus tabIndex={-1} className="flex flex-col gap-4 outline-none">
      <div className="flex items-start gap-2">
        <PuppetMark id="tree" size={32} />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-ink-soft">岁岁</p>
          <p className="font-serif text-base leading-relaxed text-ink">{CRISIS.treeSays}</p>
        </div>
      </div>
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        {CRISIS.title}
      </h2>
      <p className="text-base leading-relaxed text-ink">{CRISIS.body}</p>
      <ul className="flex flex-col gap-3">
        {CRISIS.steps.map((step) => (
          <li key={step} className="rounded-xl bg-[var(--paper-soft)] p-3 text-sm leading-relaxed text-ink">
            {step}
          </li>
        ))}
      </ul>
      <div
        data-testid="hotline-card"
        className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--paper-shadow)] p-3"
      >
        <p className="text-sm text-ink-soft">{CRISIS.hotlineTitle}</p>
        {HOTLINES.map((line) => (
          <p key={line.number} className="flex items-baseline justify-between gap-3 text-base text-ink">
            <span>{line.name}</span>
            <span className="font-serif tabular-nums">{line.number}</span>
          </p>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-ink-soft">{CRISIS.tail}</p>
      <label className="flex min-h-11 items-center gap-2 text-base text-ink">
        <input
          type="checkbox"
          checked={safe}
          onChange={(event) => setSafe(event.target.checked)}
          className="size-5 shrink-0"
        />
        {CRISIS.confirm}
      </label>
      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          disabled={!safe}
          onClick={() => {
            useTalkStore.getState().resume();
          }}
          className="paper-button min-h-11 px-5 py-3 text-base"
        >
          {CRISIS.continueLabel}
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="min-h-11 text-sm text-ink-soft underline decoration-dotted"
        >
          {CRISIS.leaveLabel}
        </button>
      </div>
    </div>
  );
}
