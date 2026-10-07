"use client";

import { PaperGlyph } from "@/components/ui/PaperGlyph";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  LEAF_MAX_CHARS,
  LEAF_MIN_CHARS,
  LEAF_NOTICE,
  leafCharOpacity,
  leafFadeMs,
  leafFloatContext,
} from "@/lib/games/leaf-float";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { GameShell } from "./GameShell";

const GAME_NAME = "落叶漂流";
const TICK_MS = 120;

interface Leaf {
  id: number;
  text: string;
  startedAt: number;
}

/**
 * 落叶漂流（漂漂）：写一句烦恼放到溪流上，看着字逐字晕开、漂走。
 * 叶子上的字只活在这个组件的局部状态里：不写 IndexedDB、不进 gameContext、不打日志、不发请求。
 * 漂走以后连状态一起删掉，只留下「放走了几片」这个数字。
 */
export function LeafFloatGame({ onClose }: { onClose: () => void }): ReactElement {
  const add = useGameContextStore((s) => s.add);
  const [line, setLine] = useState("");
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [count, setCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const nextId = useRef(1);
  const chars = [...line].length;
  const canFloat = chars >= LEAF_MIN_CHARS && chars <= LEAF_MAX_CHARS;

  useEffect(() => {
    if (leaves.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [leaves.length]);

  const floatLeaf = (): void => {
    if (!canFloat) return;
    const text = line;
    const id = nextId.current;
    nextId.current += 1;
    setLeaves((current) => [...current, { id, text, startedAt: Date.now() }]);
    setCount((current) => current + 1);
    setLine("");
    window.setTimeout(() => {
      setLeaves((current) => current.filter((leaf) => leaf.id !== id));
    }, leafFadeMs([...text].length) + 200);
  };

  const close = (): void => {
    const context = leafFloatContext(count);
    if (context) add(GAME_NAME, context);
    onClose();
  };

  return (
    <GameShell title={GAME_NAME} animal="otter" onClose={close}>
      <p role="note" className="paper-card px-3 py-2 text-[11px] leading-5 text-ink-soft">
        {LEAF_NOTICE}
      </p>
      <p className="mt-3 text-xs leading-6 text-ink-soft">
        写一句想放走的烦恼，交给漂漂。它顺水漂走，字也会跟着散开。
      </p>
      <textarea
        aria-label="写一句想放走的烦恼"
        value={line}
        rows={2}
        onChange={(e) => setLine(e.target.value)}
        className="paper-card mt-2 w-full px-3 py-2 text-sm text-ink"
        placeholder="比如：今天有点累"
      />
      <p className="mt-1 text-right text-[11px] text-ink-soft">
        {chars}/{LEAF_MAX_CHARS}
      </p>
      <button type="button" disabled={!canFloat} onClick={floatLeaf} className="paper-button mt-2 w-full py-2.5 text-sm">
        放到溪流上
      </button>

      {leaves.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {leaves.map((leaf) => {
            const letters = [...leaf.text];
            const elapsed = now - leaf.startedAt;
            return (
              <p
                key={leaf.id}
                data-testid={"leaf-" + leaf.id}
                className="paper-card flex items-center justify-center gap-0.5 px-3 py-2 text-sm text-ink"
              >
                {letters.map((letter, index) => (
                  <span key={index} style={{ opacity: leafCharOpacity(index, letters.length, elapsed) }}>
                    {letter}
                  </span>
                ))}
                <span aria-hidden className="ml-2 inline-flex items-center text-ink-soft"><PaperGlyph kind="leaf" size={12} /></span>
              </p>
            );
          })}
        </div>
      ) : null}

      {count > 0 ? <p className="mt-3 text-[11px] text-ink-soft">已经放走了 {count} 片。</p> : null}
    </GameShell>
  );
}