"use client";

import { useState, type ReactElement } from "react";
import { useDevStore } from "@/lib/stores/dev";
import { useGameContextStore } from "@/lib/stores/gameContext";

/** 开发模式的小抽屉：看小游戏攒下的 gameContext，也能一键让 AI 装死 */
export function GameContextTray(): ReactElement {
  const [open, setOpen] = useState(false);
  const entries = useGameContextStore((s) => s.entries);
  const clear = useGameContextStore((s) => s.clear);
  const simulateFailure = useDevStore((s) => s.simulateAIFailure);
  const setSimulateFailure = useDevStore((s) => s.setSimulateAIFailure);

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col-reverse items-end gap-2"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <button
        type="button"
        aria-label={"开发工具：gameContext " + String(entries.length) + " 条"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="paper-card pointer-events-auto px-3 py-1 text-xs text-ink"
      >
        调试 · gameContext {entries.length}
      </button>
      {open ? (
        <div className="paper-card pointer-events-auto max-h-64 w-64 max-w-[calc(100vw-24px)] overflow-y-auto p-3 text-xs text-ink">
          <p className="text-ink-soft">小游戏留下的上下文（只在内存里，最多 20 条）</p>
          {entries.length === 0 ? (
            <p className="mt-2 text-ink-soft">还没有记录</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {entries.map((entry, index) => (
                <li key={index} className="break-words">
                  {entry}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={clear} className="paper-button px-2 py-1 text-[11px]">
              清空
            </button>
            <label className="flex items-center gap-1 text-ink-soft">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(event) => setSimulateFailure(event.target.checked)}
              />
              模拟 AI 失败
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
