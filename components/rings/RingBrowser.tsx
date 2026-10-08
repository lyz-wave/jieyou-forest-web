"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type ReactElement, type TouchEvent, type WheelEvent } from "react";
import { PopupCard } from "@/components/ui/PopupCard";
import { GrowthCard } from "./GrowthCard";
import {
  breadcrumbOf,
  dateKey,
  dayRings,
  highlightIds,
  monthRings,
  yearRings,
  type RingSlice,
} from "@/lib/rings/rings";
import { isBackSwipe, pinchAction, pinchDistance, zoomIn, zoomOut, type RingPath } from "@/lib/rings/gesture";
import { THEMES, type Session, type Theme } from "@/lib/journal/types";
import { useJournalStore } from "@/lib/stores/journal";

/** 年轮画在一个正方里：圆心在正中，越靠里越早 */
const BOX = 300;
const C = BOX / 2;
const YEAR_BASE = 34;
const YEAR_STEP = 24;
const MONTH_BASE = 16;
const MONTH_STEP = 9;

function keyActivate(run: () => void) {
  return (event: KeyboardEvent<SVGElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      run();
    }
  };
}

/** 「2026 年，3 条记录」这样念给读屏听 */
function ringName(slice: RingSlice, unit: "年" | "月" | "日"): string {
  const named = unit === "年" ? slice.label + " 年" : slice.label.replace(unit, " " + unit);
  return named + "，" + String(slice.count) + " 条记录";
}

interface RingRowProps {
  radius: number;
  width: number;
  color: string;
  name: string;
  /** 画在圈上的字（年层写年份，月层不写） */
  label?: string;
  highlighted: boolean;
  testId: string;
  onPick: () => void;
  /** 手指停在、或键盘落到这一圈时，把名字报给下面那行字 */
  onFocusName?: (name: string | null) => void;
}

/** 一圈纸：真正看得见的纸边 + 一层透明的加宽热区（手指够得着） */
function RingRow({ radius, width, color, name, label, highlighted, testId, onPick, onFocusName }: RingRowProps): ReactElement {
  const pad = Math.max(width + 16, 26);
  return (
    <g>
      <circle cx={C} cy={C} r={radius} fill="none" stroke={color} strokeWidth={width} opacity={highlighted ? 1 : 0.72} />
      {highlighted ? (
        <circle
          cx={C}
          cy={C}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={pad}
          strokeOpacity={0.16}
          pointerEvents="none"
        />
      ) : null}
      <circle
        cx={C}
        cy={C}
        r={radius}
        fill="none"
        stroke="transparent"
        strokeWidth={pad}
        pointerEvents="stroke"
        role="button"
        tabIndex={0}
        aria-label={name}
        data-testid={testId}
        data-highlighted={highlighted ? "true" : "false"}
        onClick={onPick}
        onKeyDown={keyActivate(onPick)}
        onMouseEnter={() => {
          onFocusName?.(name);
        }}
        onMouseLeave={() => {
          onFocusName?.(null);
        }}
        onFocus={() => {
          onFocusName?.(name);
        }}
        onBlur={() => {
          onFocusName?.(null);
        }}
        className="cursor-pointer"
      />
      {label === undefined ? null : (
        <text
          data-testid="ring-label"
          x={C}
          y={C + radius + 4}
          textAnchor="middle"
          fontSize="11"
          fill="var(--ink-soft)"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** 日层：有记录的日子一颗一颗缀在圈上 */
function DayBead({
  index,
  total,
  slice,
  highlighted,
  onPick,
  onFocusName,
}: {
  index: number;
  total: number;
  slice: RingSlice;
  highlighted: boolean;
  onPick: () => void;
  onFocusName?: (name: string | null) => void;
}): ReactElement {
  const step = 360 / Math.max(total, 1);
  const angle = ((-90 + step * index) * Math.PI) / 180;
  const radius = 86;
  const x = C + radius * Math.cos(angle);
  const y = C + radius * Math.sin(angle);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={ringName(slice, "日")}
      data-testid="ring-day"
      data-highlighted={highlighted ? "true" : "false"}
      onClick={onPick}
      onKeyDown={keyActivate(onPick)}
      onMouseEnter={() => {
        onFocusName?.(ringName(slice, "日"));
      }}
      onMouseLeave={() => {
        onFocusName?.(null);
      }}
      onFocus={() => {
        onFocusName?.(ringName(slice, "日"));
      }}
      onBlur={() => {
        onFocusName?.(null);
      }}
      className="cursor-pointer"
    >
      <circle cx={x} cy={y} r={19} fill={slice.color} opacity={highlighted ? 1 : 0.78} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="#fff8ec">
        {slice.label}
      </text>
    </g>
  );
}

/** 年轮：年层 → 月层 → 日层 → 那天的成长卡片 */
export function RingBrowser({ onClose }: { onClose: () => void }): ReactElement {
  const memories = useJournalStore((s) => s.memories);
  const getSession = useJournalStore((s) => s.getSession);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [talked, setTalked] = useState<Record<string, Session | null>>({});
  /** 手指停在哪一圈上（或键盘焦点在哪一圈），下面那行字就写它 */
  const [focus, setFocus] = useState<string | null>(null);

  const years = useMemo(() => yearRings(memories), [memories]);
  const months = useMemo(() => (year === null ? [] : monthRings(memories, year)), [memories, year]);
  const days = useMemo(
    () => (year === null || month === null ? [] : dayRings(memories, year, month)),
    [memories, year, month],
  );
  /** 没挑主题时不点亮任何一圈，挑了才亮 */
  const lit = useMemo(() => (theme === null ? new Set<string>() : new Set(highlightIds(memories, theme))), [memories, theme]);
  const crumbs = breadcrumbOf(year, month, day);
  const cards = useMemo(() => {
    if (year === null || month === null || day === null) return [];
    const key = dateKey(year, month, day);
    return memories.filter((m) => m.date === key);
  }, [memories, year, month, day]);
  const chips = useMemo(() => THEMES.filter((t) => memories.some((m) => m.themes.includes(t))), [memories]);
  const yearRing = year === null ? null : (years.find((ring) => ring.year === year) ?? null);
  const monthSlice = month === null ? null : (months[month - 1] ?? null);
  const pathName = yearRing === null ? null : monthSlice === null ? ringName(yearRing, "年") : ringName(monthSlice, "月");
  const caption = focus ?? pathName ?? "点一圈，看看那一年";

  const touch = useRef<{ x: number; y: number; pinch: number | null } | null>(null);

  /** 手指停在哪儿、两根手指隔多远（手势的基准） */
  function applyPath(next: RingPath): void {
    setFocus(null);
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
  }

  function step(direction: "in" | "out"): void {
    const here: RingPath = { year, month, day };
    const next = direction === "in" ? zoomIn(here, memories) : zoomOut(here);
    if (next.year === here.year && next.month === here.month && next.day === here.day) return;
    applyPath(next);
  }

  function onTouchStart(event: TouchEvent): void {
    const first = event.touches[0];
    const second = event.touches[1];
    touch.current =
      first === undefined
        ? null
        : {
            x: first.clientX,
            y: first.clientY,
            pinch: second === undefined ? null : pinchDistance({ x: first.clientX, y: first.clientY }, { x: second.clientX, y: second.clientY }),
          };
  }

  function onTouchMove(event: TouchEvent): void {
    const from = touch.current;
    const first = event.touches[0];
    const second = event.touches[1];
    if (from === null || from.pinch === null || first === undefined || second === undefined) return;
    const now = pinchDistance({ x: first.clientX, y: first.clientY }, { x: second.clientX, y: second.clientY });
    const action = pinchAction(from.pinch, now);
    if (action === null) return;
    step(action);
    touch.current = { ...from, pinch: now };
  }

  function onTouchEnd(event: TouchEvent): void {
    const from = touch.current;
    touch.current = null;
    const last = event.changedTouches[0];
    if (from === null || last === undefined || from.pinch !== null) return;
    if (isBackSwipe(last.clientX - from.x, last.clientY - from.y)) step("out");
  }

  /** 桌面上按住 Command / Control 滚一格，等于张开或捏合 */
  function onWheel(event: WheelEvent): void {
    if (!event.metaKey && !event.ctrlKey) return;
    step(event.deltaY > 0 ? "out" : "in");
  }

  function back(level: number): void {
    if (level === 0) {
      setYear(null);
      setMonth(null);
      setDay(null);
      return;
    }
    if (level === 1) {
      setMonth(null);
      setDay(null);
      return;
    }
    setDay(null);
  }

  async function openTalk(sessionId: string, open: boolean): Promise<void> {
    if (!open || sessionId in talked) return;
    const session = await getSession(sessionId);
    setTalked((prev) => ({ ...prev, [sessionId]: session }));
  }

  return (
    <PopupCard open onClose={onClose} labelledBy="rings-title">
      <div
        data-testid="ring-stage"
        className="flex flex-col gap-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="rings-title" className="text-xl">
            我的年轮
          </h2>
          <button
            type="button"
            aria-label="关闭年轮"
            onClick={onClose}
            className="paper-button min-h-11 min-w-11 px-3 py-2 text-base"
          >
            ✕
          </button>
        </div>

        {memories.length === 0 ? (
          <p role="status" className="py-8 text-center text-base text-ink-soft">
            你的第一圈年轮，正在生长
          </p>
        ) : (
          <>
            <nav
              data-testid="ring-breadcrumb"
              aria-label="年轮层级"
              className="flex flex-wrap items-center gap-1 text-sm text-ink-soft"
            >
              {crumbs.map((crumb, index) => (
                <span key={crumb} className="flex items-center gap-1">
                  {index > 0 ? <span aria-hidden>›</span> : null}
                  <button
                    type="button"
                    onClick={() => {
                      back(index);
                    }}
                    className="min-h-11 whitespace-nowrap px-1 underline decoration-dotted"
                  >
                    {crumb}
                  </button>
                </span>
              ))}
            </nav>

            <p role="status" data-testid="ring-caption" className="text-sm text-ink">
              {caption}
            </p>

            <p className="text-xs text-ink-soft">双指张开进下一层，捏合（或向右划）退回上一层。</p>

            <svg viewBox={"0 0 " + String(BOX) + " " + String(BOX)} role="img" aria-label="古树的年轮" className="mx-auto w-full max-w-[320px]">
              <circle cx={C} cy={C} r={9} fill="#e7ddc9" />
              {year === null
                ? years.map((ring, index) => (
                    <RingRow
                      key={ring.key}
                      radius={YEAR_BASE + index * YEAR_STEP}
                      width={ring.width}
                      color={ring.color}
                      name={ringName(ring, "年")}
                      highlighted={ring.ids.some((id) => lit.has(id))}
                      label={String(ring.year)}
                      testId="ring-year"
                      onFocusName={setFocus}
                      onPick={() => {
                        setFocus(null);
                        setYear(ring.year);
                        setMonth(null);
                        setDay(null);
                      }}
                    />
                  ))
                : null}
              {year !== null && month === null
                ? months.map((slice, index) =>
                    slice.count === 0 ? (
                      <circle
                        key={slice.key}
                        data-testid="month-line"
                        cx={C}
                        cy={C}
                        r={MONTH_BASE + index * MONTH_STEP}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={1.5}
                        strokeOpacity={0.5}
                      />
                    ) : (
                      <RingRow
                        key={slice.key}
                        radius={MONTH_BASE + index * MONTH_STEP}
                        width={slice.width}
                        color={slice.color}
                        name={ringName(slice, "月")}
                        highlighted={slice.ids.some((id) => lit.has(id))}
                        testId="ring-month"
                        onFocusName={setFocus}
                        onPick={() => {
                          setFocus(null);
                          setMonth(index + 1);
                          setDay(null);
                        }}
                      />
                    ),
                  )
                : null}
              {year !== null && month !== null && day === null
                ? days.map((slice, index) => (
                    <DayBead
                      key={slice.key}
                      index={index}
                      total={days.length}
                      slice={slice}
                      highlighted={slice.ids.some((id) => lit.has(id))}
                      onFocusName={setFocus}
                      onPick={() => {
                        setFocus(null);
                        setDay(index >= 0 ? Number(slice.label.replace("日", "")) : null);
                      }}
                    />
                  ))
                : null}
            </svg>

            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  aria-pressed={theme === chip}
                  onClick={() => {
                    setTheme(theme === chip ? null : chip);
                  }}
                  className={
                    "min-h-11 rounded-full px-3 py-2 text-sm " +
                    (theme === chip ? "bg-[var(--leaf)] text-cream" : "bg-[var(--paper)] text-ink-soft")
                  }
                >
                  {chip}
                </button>
              ))}
            </div>

            {cards.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {cards.map((memory) => (
                  <li key={memory.id} className="flex flex-col gap-2">
                    <GrowthCard memory={memory} />
                    <details
                      data-testid="day-talk"
                      className="rounded-2xl bg-[var(--paper)] px-3 py-2"
                      onToggle={(event) => {
                        void openTalk(memory.sessionId, (event.target as HTMLDetailsElement).open);
                      }}
                    >
                      <summary className="min-h-11 cursor-pointer text-sm text-ink-soft">那天的对话</summary>
                      {talked[memory.sessionId] == null ? (
                        <p className="py-2 text-sm text-ink-soft">那天的原话已经不在了。</p>
                      ) : (
                        <ul className="flex flex-col gap-2 py-2 text-sm">
                          {talked[memory.sessionId]?.messages.map((message) => (
                            <li key={message.id}>
                              <span className="text-ink-soft">{message.speaker === "user" ? "我" : message.speaker}：</span>
                              {message.content}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </PopupCard>
  );
}
