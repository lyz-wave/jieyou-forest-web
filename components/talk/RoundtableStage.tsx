"use client";

import { useEffect, type ReactElement } from "react";
import { ANIMALS } from "@/lib/animals";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useTalkStore } from "@/lib/stores/talk";
import type { TalkFlow } from "./useTalkFlow";
import { FailureLine } from "./FailureLine";
import { useTypewriter } from "./useTypewriter";

/** 圆桌：一只一只说，说完可以圈出说到心里的那句。 */
export function RoundtableStage({ flow }: { flow: TalkFlow }): ReactElement {
  const speeches = useTalkStore((s) => s.speeches);
  const shown = useTalkStore((s) => s.shown);
  const all = useTalkStore((s) => s.all);
  const marked = useTalkStore((s) => s.marked);
  const visible = speeches.slice(0, shown);
  const last = shown >= speeches.length;
  const reducedMotion = useReducedMotion();
  // 列表里是整段（好读、好回看），头顶气泡跟着一个字一个字出
  const current = visible.length > 0 ? visible[visible.length - 1] : null;
  const currentAnimal = current?.animal ?? null;
  const typed = useTypewriter(current?.text ?? "", reducedMotion);

  useEffect(() => {
    if (!currentAnimal) return;
    useTalkStore.getState().setBubble(typed);
    return () => {
      useTalkStore.getState().setBubble(null);
    };
  }, [typed, currentAnimal]);

  if (speeches.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 id="talk-title" className="font-serif text-xl text-ink">
          森林里的声音
        </h2>
        {flow.roundStatus === "failed" ? (
          <FailureLine onRetry={flow.retryRound} />
        ) : (
          <p role="status" className="text-sm text-ink-soft">
            它们在商量怎么跟你说……
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        森林里的声音
      </h2>
      <ul aria-live="polite" className="flex flex-col gap-3">
        {visible.map((speech) => {
          const def = ANIMALS[speech.animal];
          const isMarked = marked.includes(speech.animal);
          return (
            <li
              key={speech.animal}
              data-testid="talk-speech"
              data-animal={speech.animal}
              className="flex gap-3 rounded-2xl bg-[var(--paper-soft)] p-3"
            >
              <PuppetMark id={speech.animal} size={40} />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-ink">{def.name}</p>
                <p className="text-xs text-ink-soft">{def.species + " · " + def.mindset}</p>
                <p className="text-base leading-relaxed text-ink">
                  {speech.text}
                  {speech.animal === currentAnimal && typed.length < speech.text.length ? (
                    <span aria-hidden className="animate-pulse text-ink-soft">
                      ▍
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  aria-pressed={isMarked}
                  aria-label={"说到心里了：" + def.name}
                  onClick={() => {
                    useTalkStore.getState().toggleMark(speech.animal);
                  }}
                  className="min-h-11 self-start text-sm text-ink-soft underline decoration-dotted"
                >
                  {isMarked ? "记下了" : "说到心里了"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {flow.roundStatus === "failed" ? <FailureLine onRetry={flow.retryRound} /> : null}
      <div className="flex flex-col gap-2">
        {last ? (
          <>
            <button
              type="button"
              onClick={flow.summarize}
              disabled={flow.summaryStatus === "thinking"}
              className="paper-button min-h-11 px-5 py-3 text-base disabled:opacity-40"
            >
              {flow.summaryStatus === "thinking" ? "岁岁正在想……" : "听听古树怎么说"}
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
          </>
        ) : (
          <>
            <button
              type="button"
              data-autofocus
              onClick={() => {
                useTalkStore.getState().next();
              }}
              className="paper-button min-h-11 px-5 py-3 text-base"
            >
              下一位
            </button>
            <button
              type="button"
              onClick={() => {
                useTalkStore.getState().showAll();
              }}
              className="min-h-11 text-sm text-ink-soft underline decoration-dotted"
            >
              全部显示
            </button>
          </>
        )}
      </div>
      {all ? <span className="sr-only">七只都说完了</span> : null}
    </div>
  );
}