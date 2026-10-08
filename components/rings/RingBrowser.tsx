"use client";

"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement, type TouchEvent, type WheelEvent } from "react";
import { PopupCard } from "@/components/ui/PopupCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
import { LAYER_THICKNESS, RISE_EXTRA, RISE_MS, layerLifts, lighten, shade, sparkAt } from "@/lib/rings/stack";
import {
  BARK,
  MIN_BAND,
  WOOD_LIGHT,
  eccentricAt,
  grainPath,
  packedRings,
  ringPaperPath,
  smoothClosedPath,
  wobbledCircle,
  woodTint,
} from "@/lib/rings/paper";
import { hashString } from "@/lib/paper/random";
import { THEMES, type Session, type Theme } from "@/lib/journal/types";
import { useJournalStore } from "@/lib/stores/journal";

/** 年轮画在一个正方里：圆心在正中，越靠里越早 */
const BOX = 300;
const C = BOX / 2;
/** 第一圈年轮长在髓外面一点点 */
const YEAR_CORE = 26;
/** 年层最外面那一圈能画到多大 */
const YEAR_MAX = 100;
/** 木头的种子：年轮的形状由它定，改了所有人的年轮都会变样 */
const TREE_SEED = 20261008;
/** 情绪色往木头色里调多少 */
const TINT = 0.34;
/** 每一圈的种子按自己的名字取，多一年也不会让别的圈变样 */
function seedOf(key: string): number {
  return hashString(key) % 100000;
}
const MONTH_BASE = 14;
const MONTH_STEP = 7;
const MONTH_LIFT = 5;
const DAY_BASE = 18;
const DAY_MAX = 100;
const DAY_LIFT_MAX = 60;

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

interface PaperRingProps {
  /** 这一圈的中心（真年轮不同心，每一圈都偏一点） */
  cx: number;
  cy: number;
  radius: number;
  width: number;
  /** 这一圈的形状种子 */
  seed: number;
  color: string;
  name: string;
  /** 这一层抬多高（负数向上，越靠里越高） */
  lift: number;
  /** 画在纸上的字（年层写年份、日层写日期，月层不写） */
  label?: string;
  highlighted: boolean;
  /** 正被点起来的那一层 */
  raised: boolean;
  /** 有记录的月份，纸边上缀一颗光点 */
  spark?: boolean;
  testId: string;
  onPick: () => void;
  /** 手指停在、或键盘落到这一圈时，把名字报给下面那行字 */
  onFocusName?: (name: string | null) => void;
}

/** 一层环形纸片：纸面 + 侧面的裁口厚度 + 一圈读得着的热区 */
function PaperRing({
  cx,
  cy,
  radius,
  width,
  seed,
  color,
  name,
  lift,
  label,
  highlighted,
  raised,
  spark = false,
  testId,
  onPick,
  onFocusName,
}: PaperRingProps): ReactElement {
  const reducedMotion = useReducedMotion();
  /** 键盘落到这一圈上时，用自己的纸色发光，而不是浏览器那个方框 */
  const [focused, setFocused] = useState(false);
  /** 环带够宽才挖剪纸的小口：宽的地方多剪两个，像真剪出来的纸 */
  const cuts = width >= 11 ? 3 : width >= 7 ? 2 : width >= 4.5 ? 1 : 0;
  const path = ringPaperPath({ cx, cy, radius, width, seed, cuts });
  /** 能点的地方是整条环带：剪出来的小口不该让这一圈点不着 */
  const solid = cuts === 0 ? path : ringPaperPath({ cx, cy, radius, width, seed });
  const dy = lift + (raised ? -RISE_EXTRA : 0);
  const dot = sparkAt(radius, cx, cy);
  return (
    <g
      data-ring-layer
      data-testid={testId}
      data-lift={String(lift)}
      data-raised={raised ? "true" : "false"}
      data-highlighted={highlighted ? "true" : "false"}
      data-focused={focused ? "true" : "false"}
      style={{
        transform: "translateY(" + String(dy) + "px)",
        transition: reducedMotion ? "none" : "transform " + String(RISE_MS) + "ms cubic-bezier(0.2, 0.8, 0.3, 1)",
      }}
    >
      <path
        data-ring-shadow
        d={ringPaperPath({ cx, cy, radius, width: width + 3, seed })}
        pointerEvents="none"
        fillRule="evenodd"
        fill="#3b3328"
        opacity={0.15}
        transform={"translate(0 " + String(LAYER_THICKNESS * 2) + ")"}
      />
      <path data-ring-side d={path} pointerEvents="none" fillRule="evenodd" fill={shade(color, 0.34)} transform={"translate(0 " + String(LAYER_THICKNESS) + ")"} />
      <path
        data-ring-face
        data-cuts={String(cuts)}
        d={path}
        pointerEvents="none"
        fillRule="evenodd"
        fill={color}
        stroke={shade(color, 0.3)}
        strokeWidth={1}
        opacity={highlighted || raised ? 1 : 0.9}
      />
      <path
        data-ring-grain
        d={grainPath({ cx, cy, radius: radius - width * 0.18, seed })}
        pointerEvents="none"
        fill="none"
        stroke={shade(color, 0.18)}
        strokeWidth={1}
        opacity={0.45}
      />
      {raised ? <path data-testid="ring-rise-glow" d={path} pointerEvents="none" fillRule="evenodd" fill={lighten(color, 0.5)} opacity={0.55} /> : null}
      {highlighted && !raised ? (
        <path data-ring-glow d={path} pointerEvents="none" fillRule="evenodd" fill={color} opacity={0.22} transform="translate(0 -2)" />
      ) : null}
      {focused ? (
        <path data-ring-focus d={path} pointerEvents="none" fillRule="evenodd" fill={lighten(color, 0.45)} opacity={0.5} transform="translate(0 -2)" />
      ) : null}
      {spark ? <circle data-testid="month-spark" cx={dot.x} cy={dot.y} r={2.6} pointerEvents="none" fill={lighten(color, 0.6)} /> : null}
      {label === undefined ? null : (
        <text
          data-testid="ring-label"
          x={C}
          y={cy + radius + width / 2 + 11}
          textAnchor="middle"
          fontSize="11"
          fill="var(--ink-soft)"
          pointerEvents="none"
        >
          {label}
        </text>
      )}
      <path
        data-ring-hit
        d={solid}
        fillRule="evenodd"
        fill="transparent"
        pointerEvents="fill"
        role="button"
        tabIndex={0}
        aria-label={name}
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
          setFocused(true);
          onFocusName?.(name);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusName?.(null);
        }}
        className="cursor-pointer outline-none"
      />
    </g>
  );
}

/** 「12日」→ 12 */
function dayOf(slice: RingSlice): number {
  return Number(slice.label.replace("日", ""));
}

/** 年轮：年层 → 月层 → 日层 → 那天的成长卡片 */
export function RingBrowser({ onClose, riseMs = RISE_MS }: { onClose: () => void; riseMs?: number }): ReactElement {
  const reducedMotion = useReducedMotion();
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
  const yearLiftStep =
    years.length <= 1 ? 0 : Math.max(6, Math.min(14, Math.round(36 / (years.length - 1))));
  const yearLifts = layerLifts(years.length, yearLiftStep);
  const monthLifts = layerLifts(months.length, MONTH_LIFT);
  /** 只有一天的时候，这一圈画得粗一点、往外挪一点，不要缩成一颗小点 */
  const dayBase = days.length <= 1 ? 34 : DAY_BASE;
  const dayStep = days.length <= 1 ? 0 : Math.min(12, (DAY_MAX - dayBase) / (days.length - 1));
  const dayWidth = days.length <= 1 ? 14 : Math.max(5, Math.min(12, dayStep + 2));
  const dayLiftStep =
    days.length <= 1 ? 0 : Math.max(2, Math.min(6, Math.round(DAY_LIFT_MAX / (days.length - 1))));
  const dayLifts = layerLifts(days.length, dayLiftStep);
  const lifts = day !== null ? dayLifts : month !== null ? monthLifts : yearLifts;
  /** 整盘纸雕往下挪半个层高：最内圈抬起来之后不会顶出画框 */
  const shiftY = -Math.min(0, ...lifts) / 2;
  const coreLift = (lifts[0] ?? 0) - 6;
  /** 年轮不是同一个圆心：越往外偏得越多 */
  const yearAt = (index: number): { x: number; y: number } => eccentricAt(TREE_SEED, index, 3);
  const monthAt = (index: number): { x: number; y: number } => eccentricAt(TREE_SEED + 1, index, 2);
  const dayAt = (index: number): { x: number; y: number } => eccentricAt(TREE_SEED + 2, index, 2);
  /** 一圈挨着一圈地长：宽窄看那一年的记录数，但不再等距排成靶子 */
  const yearBands = packedRings(years.map((ring) => Math.min(ring.width, 20)), YEAR_CORE, YEAR_MAX);
  const yearRadiusAt = (index: number): number => yearBands[index]?.radius ?? YEAR_CORE;
  const yearWidthAt = (index: number): number => yearBands[index]?.width ?? MIN_BAND;
  /** 树皮包住当前这一层最外的那一圈，整块像一截锯下来的木头 */
  const outerYearRadius =
    years.length === 0 ? YEAR_CORE : yearRadiusAt(years.length - 1) + yearWidthAt(years.length - 1) / 2;
  const layerOuter =
    day !== null && days.length > 0
      ? dayBase + dayStep * (days.length - 1) + dayWidth / 2
      : month !== null && months.length > 0
        ? MONTH_BASE + (months.length - 1) * MONTH_STEP + Math.max(...months.map((slice) => slice.width)) / 2
        : outerYearRadius;
  const barkRadius = Math.max(outerYearRadius, layerOuter) + 18;
  const barkPath = ringPaperPath({ cx: C, cy: C, radius: barkRadius, width: 9, seed: TREE_SEED, petals: 13, petal: 0.02 });
  const woodPath = smoothClosedPath(wobbledCircle({ cx: C, cy: C, radius: barkRadius - 3, seed: TREE_SEED + 3, wobble: 0.025 }));
  const woodGrain = grainPath({ cx: C, cy: C, radius: barkRadius - 13, seed: TREE_SEED + 5 });
  const pithPath = smoothClosedPath(wobbledCircle({ cx: C, cy: C, radius: 9, seed: TREE_SEED + 9, wobble: 0.26 }));

  const touch = useRef<{ x: number; y: number; pinch: number | null } | null>(null);
  /** 正被点起来的那一层：先抬起发光，抬到位再展开成下一级 */
  const [rising, setRising] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  function pick(id: string, run: () => void): void {
    setFocus(null);
    if (riseMs <= 0 || reducedMotion) {
      run();
      return;
    }
    setRising(id);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      setRising(null);
      run();
    }, riseMs);
  }

  /** 手指停在哪儿、两根手指隔多远（手势的基准） */
  function applyPath(next: RingPath): void {
    setRising(null);
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
              <g transform={"translate(0 " + String(shiftY) + ")"}>
                <ellipse
                  data-testid="ring-drop"
                  cx={C}
                  cy={C + barkRadius - 2}
                  rx={barkRadius + 2}
                  ry={9}
                  fill="#3b3328"
                  opacity={0.07}
                />
                <g data-testid="ring-bark">
                  <path
                    data-ring-bark-side
                    d={barkPath}
                    pointerEvents="none"
                    fillRule="evenodd"
                    fill={shade(BARK, 0.32)}
                    transform={"translate(0 " + String(LAYER_THICKNESS) + ")"}
                  />
                  <path data-ring-face d={barkPath} pointerEvents="none" fillRule="evenodd" fill={BARK} />
                  <path data-testid="ring-wood" d={woodPath} pointerEvents="none" fillRule="evenodd" fill={WOOD_LIGHT} />
                  <path data-ring-grain d={woodGrain} pointerEvents="none" fill="none" stroke={shade(WOOD_LIGHT, 0.16)} strokeWidth={1} opacity={0.5} />
                </g>
                <g
                  data-testid="ring-core"
                  data-lift={String(coreLift)}
                  style={{
                    transform: "translateY(" + String(coreLift) + "px)",
                    transition: reducedMotion ? "none" : "transform " + String(RISE_MS) + "ms cubic-bezier(0.2, 0.8, 0.3, 1)",
                  }}
                >
                  <path d={pithPath} fill="#3b3328" opacity={0.1} transform={"translate(0 " + String(LAYER_THICKNESS * 2) + ")"} />
                  <path d={pithPath} fill={shade("#e7ddc9", 0.2)} transform={"translate(0 " + String(LAYER_THICKNESS) + ")"} />
                  <path data-testid="ring-pith" d={pithPath} fill="#e7ddc9" />
                </g>
                {year === null
                  ? years.map((ring, index) => (
                      <PaperRing
                        key={ring.key}
                        cx={C + yearAt(index).x}
                        cy={C + yearAt(index).y}
                        radius={yearRadiusAt(index)}
                        width={yearWidthAt(index)}
                        seed={seedOf(ring.key)}
                        color={woodTint(ring.color, TINT)}
                        name={ringName(ring, "年")}
                        lift={yearLifts[index] ?? 0}
                        label={String(ring.year)}
                        highlighted={ring.ids.some((id) => lit.has(id))}
                        raised={rising === ring.key}
                        testId="ring-year"
                        onFocusName={setFocus}
                        onPick={() => {
                          pick(ring.key, () => {
                            setYear(ring.year);
                            setMonth(null);
                            setDay(null);
                          });
                        }}
                      />
                    ))
                  : null}
                {year !== null && month === null
                  ? months.map((slice, index) =>
                      slice.count === 0 ? (
                        <g
                          key={slice.key}
                          data-testid="month-line"
                          data-lift={String(monthLifts[index] ?? 0)}
                          style={{
                            transform: "translateY(" + String(monthLifts[index] ?? 0) + "px)",
                            transition: reducedMotion ? "none" : "transform " + String(RISE_MS) + "ms ease-out",
                          }}
                        >
                          <path
                            d={ringPaperPath({
                              cx: C + monthAt(index).x,
                              cy: C + monthAt(index).y,
                              radius: MONTH_BASE + index * MONTH_STEP,
                              width: 1.5,
                              seed: seedOf(slice.key),
                            })}
                            fillRule="evenodd"
                            fill={shade(WOOD_LIGHT, 0.22)}
                            opacity={0.6}
                            pointerEvents="none"
                          />
                        </g>
                      ) : (
                        <PaperRing
                          key={slice.key}
                          cx={C + monthAt(index).x}
                          cy={C + monthAt(index).y}
                          radius={MONTH_BASE + index * MONTH_STEP}
                          width={slice.width}
                          seed={seedOf(slice.key)}
                          color={woodTint(slice.color, TINT)}
                          name={ringName(slice, "月")}
                          lift={monthLifts[index] ?? 0}
                          highlighted={slice.ids.some((id) => lit.has(id))}
                          raised={rising === slice.key}
                          spark
                          testId="ring-month"
                          onFocusName={setFocus}
                          onPick={() => {
                            pick(slice.key, () => {
                              setMonth(index + 1);
                              setDay(null);
                            });
                          }}
                        />
                      ),
                    )
                  : null}
                {year !== null && month !== null
                  ? days.map((slice, index) => (
                      <PaperRing
                        key={slice.key}
                        cx={C + dayAt(index).x}
                        cy={C + dayAt(index).y}
                        radius={dayBase + index * dayStep}
                        width={dayWidth}
                        seed={seedOf(slice.key)}
                        color={woodTint(slice.color, 0.22)}
                        name={ringName(slice, "日")}
                        lift={dayLifts[index] ?? 0}
                        label={days.length <= 12 ? slice.label : undefined}
                        highlighted={slice.ids.some((id) => lit.has(id)) || day === dayOf(slice)}
                        raised={rising === slice.key}
                        testId="ring-day"
                        onFocusName={setFocus}
                        onPick={() => {
                          pick(slice.key, () => {
                            setDay(dayOf(slice));
                          });
                        }}
                      />
                    ))
                  : null}
              </g>
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
