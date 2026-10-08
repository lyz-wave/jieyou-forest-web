"use client";

import type { ReactElement } from "react";
import { AI_FAILURE_LINE } from "@/lib/ai/types";

/** 请求没接上时的那一句，都长一样。 */
export function FailureLine({ onRetry }: { onRetry: () => void }): ReactElement {
  return (
    <div role="status" className="flex flex-col items-start gap-2 rounded-xl bg-[var(--paper-soft)] p-3">
      <p className="text-sm text-ink">{AI_FAILURE_LINE}</p>
      <button type="button" onClick={onRetry} className="paper-button min-h-11 px-4 py-2 text-sm">
        再试一次
      </button>
    </div>
  );
}
