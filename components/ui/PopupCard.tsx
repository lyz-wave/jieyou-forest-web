"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * 立体书式的纸卡片：从平躺状态以底边为轴折起弹出，关闭时折回去。
 * - 打开时把焦点移到卡片里；关闭后焦点回到打开它的元素
 * - Esc、点卡片外部都会关闭（dismissible 为 false 时不响应，用于入林引导这类必须走完的步骤）
 */
export function PopupCard({
  open,
  onClose,
  labelledBy,
  children,
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  labelledBy?: string;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const behavior = useRef({ dismissible, onClose });
  useEffect(() => {
    behavior.current = { dismissible, onClose };
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 等折起动画开始后再聚焦，避免屏幕阅读器读到半折的卡片
    const t = window.setTimeout(() => {
      // 用户已经自己点进卡片里了（比如一打开就开始打字），别把焦点抢走
      const active = document.activeElement;
      if (active && active !== card.current && card.current?.contains(active)) return;
      const target = card.current?.querySelector<HTMLElement>("[data-autofocus]") ?? card.current;
      target?.focus();
    }, 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && behavior.current.dismissible) behavior.current.onClose?.();
      if (e.key !== "Tab" || !card.current) return;
      const targets = [...card.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
      )];
      const first = targets[0];
      const last = targets.at(-1);
      if (!first || !last) {
        e.preventDefault();
        card.current.focus();
      } else if (!card.current.contains(document.activeElement) || document.activeElement === card.current) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      returnFocus.current?.focus?.();
    };
  }, [open]);

  const fold = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { rotateX: -88, opacity: 0.4 },
        animate: { rotateX: 0, opacity: 1 },
        exit: { rotateX: -88, opacity: 0 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="absolute inset-0 z-30 flex items-end justify-center p-4 sm:items-center"
          style={{ perspective: 900, paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          initial={{ backgroundColor: "rgb(59 51 40 / 0)" }}
          animate={{ backgroundColor: "rgb(59 51 40 / 0.25)" }}
          exit={{ backgroundColor: "rgb(59 51 40 / 0)" }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget && dismissible) onClose?.();
          }}
        >
          <motion.div
            ref={card}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={`paper-card max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto p-5 outline-none ${className ?? ""}`}
            style={{ transformOrigin: "50% 100%" }}
            {...fold}
            transition={reducedMotion ? { duration: 0.2 } : { type: "spring", stiffness: 160, damping: 20 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
