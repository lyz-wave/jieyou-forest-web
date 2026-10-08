"use client";

import { useRef, useState, type ReactElement } from "react";
import { TALK_MAX } from "@/lib/ai/request";
import { textLength } from "@/lib/ai/types";
import { PRIVACY_LINE } from "@/lib/talk/guard";
import { useTalkStore } from "@/lib/stores/talk";

const MOODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** 进来先写：这一刻几分，想说什么。打分可以跳过，跳过就是没有分数。 */
export function MoodStage({ onSpeak }: { onSpeak: (text: string) => void }): ReactElement {
  const mood = useTalkStore((s) => s.mood);
  const setMood = useTalkStore((s) => s.setMood);
  /** 从「上次那件事」接着聊时，框里已经放着上次那句 */
  const saved = useTalkStore((s) => s.text);
  const [text, setText] = useState(saved);
  const input = useRef<HTMLTextAreaElement | null>(null);
  const count = textLength(text);
  const canSpeak = count > 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        想说点什么？
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-soft">现在的心情，大概几分？（可以跳过）</p>
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
              aria-pressed={mood === value}
              aria-label={"心情 " + String(value) + " 分"}
              onClick={() => {
                setMood(mood === value ? null : value);
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
            setMood(null);
            input.current?.focus();
          }}
          className="self-start text-sm text-ink-soft underline decoration-dotted"
        >
          跳过打分
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-ink-soft" htmlFor="talk-text">
          想说的话
        </label>
        <textarea
          id="talk-text"
          ref={input}
          value={text}
          maxLength={TALK_MAX}
          rows={5}
          placeholder="不用组织语言，想到哪写到哪。"
          onChange={(event) => {
            setText(event.target.value);
          }}
          className="paper-input w-full resize-none p-3 text-base leading-relaxed"
        />
        <p className="self-end text-xs text-ink-soft" data-testid="talk-count">
          {count}/{TALK_MAX}
        </p>
        <p className="text-xs leading-relaxed text-ink-soft">{PRIVACY_LINE}</p>
      </div>
      <button
        type="button"
        disabled={!canSpeak}
        onClick={() => {
          onSpeak(text);
        }}
        className="paper-button min-h-11 px-5 py-3 text-base disabled:opacity-40"
      >
        说给它听
      </button>
    </div>
  );
}
