"use client";

import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { useDnd } from "./DndProvider";

/** 一个放东西的地方：可以是点选模式的目标，也可以是拖拽松手时的落点 */
export function DropZone({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children?: ReactNode;
}): ReactElement {
  const { registerZone, dropOn, selectedId } = useDnd();
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    registerZone(id, ref.current);
    return () => registerZone(id, null);
  }, [id, registerZone]);

  return (
    <button
      type="button"
      ref={ref}
      aria-label={label}
      data-drop-zone={id}
      data-active={selectedId === null ? undefined : "true"}
      onClick={() => dropOn(id)}
      className={
        "paper-card pointer-events-auto flex min-h-[72px] w-full flex-wrap items-center justify-center gap-1 border-2 border-dashed border-moss/40 px-3 py-2 text-left text-xs text-ink-soft transition-colors data-[active=true]:border-moss data-[active=true]:bg-moss/10 " +
        (className ?? "")
      }
    >
      {children}
    </button>
  );
}
