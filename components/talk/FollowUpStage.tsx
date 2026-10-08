"use client";

import { useState, type ReactElement } from "react";
import { ANIMALS, ANIMAL_CAST, type CharacterId } from "@/lib/animals";
import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useTalkStore } from "@/lib/stores/talk";
import { mentioned, type TalkFlow } from "./useTalkFlow";
import { FailureLine } from "./FailureLine";

/** 可以点头像点名的人：岁岁排在第一个（不点就默认给他） */
const ASKABLE: CharacterId[] = ["tree", ...ANIMAL_CAST.map((a) => a.id)];

function nameOf(id: CharacterId): string {
  return id === "tree" ? ANIMALS.tree.name : ANIMALS[id].name;
}

/** 追问：还想跟谁说一句就说；点头像或写 @墨墨 都能指名。 */
export function FollowUpStage({ flow, onPause }: { flow: TalkFlow; onPause: () => void }): ReactElement {
  const replies = useTalkStore((s) => s.replies);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<CharacterId | null>(null);
  const typed = draft.includes("@") ? mentioned(draft) : null;
  const target = typed ?? picked;

  return (
    <div className="flex flex-col gap-4">
      <h2 id="talk-title" className="font-serif text-xl text-ink">
        还想说点什么
      </h2>
      {replies.length > 0 ? (
        <ul aria-live="polite" className="flex max-h-64 flex-col gap-3 overflow-y-auto">
          {replies.map((reply, index) => {
            const tree = reply.speaker === "tree";
            const name = tree ? "岁岁" : ANIMALS[reply.speaker].name;
            return (
              <li
                key={String(index) + reply.speaker}
                data-testid="talk-reply"
                className="flex gap-3 rounded-2xl bg-[var(--paper-soft)] p-3"
              >
                <PuppetMark id={reply.speaker} size={36} />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-ink">{name}</p>
                  <p className="text-base leading-relaxed text-ink">{reply.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {flow.replyStatus === "failed" ? <FailureLine onRetry={flow.retryReply} /> : null}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-soft" id="talk-followup-label">
          想跟谁说一句？（点头像，或写 @墨墨）
        </p>
        <div role="group" aria-label="想跟谁说这一句" className="flex flex-wrap gap-1">
          {ASKABLE.map((id) => (
            <button
              key={id}
              type="button"
              data-testid="ask-avatar"
              aria-pressed={picked === id}
              aria-label={"问 " + nameOf(id)}
              onClick={() => {
                setPicked(picked === id ? null : id);
              }}
              className={
                "min-h-11 min-w-11 rounded-full p-1 " +
                (picked === id ? "bg-[var(--paper-soft)] ring-2 ring-[var(--leaf)]" : "")
              }
            >
              <PuppetMark id={id} size={28} />
            </button>
          ))}
        </div>
        <textarea
          id="talk-followup"
          aria-labelledby="talk-followup-label"
          value={draft}
          rows={3}
          maxLength={200}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          className="paper-input w-full resize-none p-3 text-base leading-relaxed"
        />
        <p className="text-xs text-ink-soft">
          {target === null ? "这句话会交给：岁岁（默认）" : "这句话会交给：" + nameOf(target)}
        </p>
        <button
          type="button"
          disabled={draft.trim() === "" || flow.replyStatus === "thinking"}
          onClick={() => {
            flow.ask(draft, picked);
            setDraft("");
          }}
          className="paper-button min-h-11 px-5 py-3 text-base disabled:opacity-40"
        >
          {flow.replyStatus === "thinking" ? "在想了……" : "说出去"}
        </button>
      </div>
      <div className="flex flex-col gap-2 border-t border-dashed border-[var(--paper-shadow)] pt-4">
        <button
          type="button"
          onClick={() => {
            useTalkStore.getState().toRate();
          }}
          className="paper-button min-h-11 px-5 py-3 text-base"
        >
          心结解开了
        </button>
        <button
          type="button"
          onClick={onPause}
          className="min-h-11 text-sm text-ink-soft underline decoration-dotted"
        >
          先放一放
        </button>
      </div>
    </div>
  );
}
