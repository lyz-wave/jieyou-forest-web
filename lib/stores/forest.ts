import { create } from "zustand";
import type { AnimalId } from "../animals";

/**
 * 森林状态。
 * - gather：idle 平时 → gathering 正在聚拢 → seated 都坐好了 → dispersing 正在散开 → idle
 * - wanderPaused：卡片 / 小游戏打开时暂停走动
 */
export type GatherPhase = "idle" | "gathering" | "seated" | "dispersing";

interface ForestState {
  companion: AnimalId;
  gather: GatherPhase;
  /** 聚拢 / 散开时还没到位的动物数 */
  pending: number;
  wanderPaused: boolean;
  setCompanion(a: AnimalId): void;
  startGather(count: number): void;
  startDisperse(count: number): void;
  /** 某只动物到位了 */
  arrived(): void;
  setWanderPaused(v: boolean): void;
}

export const useForestStore = create<ForestState>()((set) => ({
  companion: "fox",
  gather: "idle",
  pending: 0,
  wanderPaused: false,
  setCompanion: (companion) => set({ companion }),
  startGather: (count) => set({ gather: "gathering", pending: count }),
  startDisperse: (count) => set({ gather: "dispersing", pending: count }),
  arrived: () =>
    set((s) => {
      const pending = Math.max(0, s.pending - 1);
      if (pending > 0) return { pending };
      if (s.gather === "gathering") return { pending, gather: "seated" };
      if (s.gather === "dispersing") return { pending, gather: "idle" };
      return { pending };
    }),
  setWanderPaused: (wanderPaused) => set({ wanderPaused }),
}));
