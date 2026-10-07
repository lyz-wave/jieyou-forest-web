"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { zoneAtPoint, type ZoneRect } from "@/lib/games/dnd";

export interface DndValue {
  /** 点选模式下被拿起来的那个物件 */
  selectedId: string | null;
  toggle(id: string): void;
  /** 把手上拿着的物件放进某个投放区 */
  dropOn(zoneId: string): void;
  /** 拖拽松手时按屏幕坐标判定落点；没落在任何目标上返回 false，物件自己弹回去 */
  dropAt(itemId: string, x: number, y: number): boolean;
  registerZone(id: string, element: HTMLElement | null): void;
}

const DndContext = createContext<DndValue | null>(null);

export function useDnd(): DndValue {
  const value = useContext(DndContext);
  if (value === null) throw new Error("useDnd 必须在 <DndProvider> 里使用");
  return value;
}

/** 拖拽游戏共用的状态：谁被拿起来了、目标在哪、放下去回调谁 */
export function DndProvider({
  onDrop,
  children,
}: {
  onDrop: (itemId: string, zoneId: string) => void;
  children: ReactNode;
}): ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const zones = useRef(new Map<string, HTMLElement>());

  const registerZone = useCallback((id: string, element: HTMLElement | null) => {
    if (element === null) zones.current.delete(id);
    else zones.current.set(id, element);
  }, []);

  const rects = useCallback((): ZoneRect[] => {
    const out: ZoneRect[] = [];
    zones.current.forEach((element, id) => {
      const rect = element.getBoundingClientRect();
      out.push({ id, left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    });
    return out;
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const dropOn = useCallback(
    (zoneId: string) => {
      if (selectedId === null) return;
      onDrop(selectedId, zoneId);
      setSelectedId(null);
    },
    [onDrop, selectedId],
  );

  const dropAt = useCallback(
    (itemId: string, x: number, y: number): boolean => {
      const zoneId = zoneAtPoint(x, y, rects());
      if (zoneId === null) return false;
      onDrop(itemId, zoneId);
      setSelectedId(null);
      return true;
    },
    [onDrop, rects],
  );

  const value = useMemo<DndValue>(
    () => ({ selectedId, toggle, dropOn, dropAt, registerZone }),
    [selectedId, toggle, dropOn, dropAt, registerZone],
  );

  return <DndContext.Provider value={value}>{children}</DndContext.Provider>;
}
