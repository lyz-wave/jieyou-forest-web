"use client";

import { motion } from "motion/react";
import { useRef, type ReactElement, type ReactNode } from "react";
import { useDnd } from "./DndProvider";

/**
 * 一个可以拖的小物件。除了拖，还支持：
 * - 点一下选中（点选模式），再点投放区就放进去
 * - 键盘：Tab 聚焦 → 回车选中 → 目标上回车放下
 * - 没放进目标就弹回原位，也不产生任何结果
 */
export function Draggable({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label?: string;
  className?: string;
  children: ReactNode;
}): ReactElement {
  const { selectedId, toggle, dropAt } = useDnd();
  const ref = useRef<HTMLButtonElement | null>(null);
  const selected = selectedId === id;

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      data-draggable={id}
      drag
      dragSnapToOrigin
      dragMomentum={false}
      whileDrag={{ scale: 1.06 }}
      onClick={() => toggle(id)}
      onDragEnd={() => {
        const element = ref.current;
        if (element === null) return;
        // 用物件松手时的实际位置判定落点：和投放区的 getBoundingClientRect 是同一套视口坐标
        const rect = element.getBoundingClientRect();
        dropAt(id, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }}
      className={
        "paper-card pointer-events-auto cursor-grab touch-none select-none px-3 py-2 text-sm text-ink active:cursor-grabbing aria-pressed:ring-2 aria-pressed:ring-moss " +
        (className ?? "")
      }
    >
      {children}
    </motion.button>
  );
}
