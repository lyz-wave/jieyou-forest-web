"use client";

import type { ReactElement } from "react";

/** 伙伴动物身上的小叶子徽记（移动到哪都跟着，不吃点击） */
export function CompanionBadge(): ReactElement {
  return (
    <span
      data-testid="companion-badge"
      aria-label="今天的伙伴"
      className="pointer-events-none absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-cream text-[11px] leading-none shadow-[0_1px_3px_rgb(59_51_40/0.3)]"
    >
      🍃
    </span>
  );
}
