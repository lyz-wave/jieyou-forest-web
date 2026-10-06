import { create } from "zustand";
import type { AnimalId, CharacterId } from "../animals";
import type { WorldPos } from "../forest/ground";

/**
 * 森林状态。
 * - gather：idle 平时 → gathering 正在聚拢 → seated 都坐好了 → dispersing 正在散开 → idle
 * - wanderPaused：卡片 / 小游戏打开时暂停走动
 * - opened：当前打开的角色卡（动物或古树），openedAt 是打开时那只动物在哪，镜头据此推近
 * - pendingGame：角色卡里点了「一起玩」，等游戏面板接管（游戏面板在阶段 1 第 9 组）
 */
export type GatherPhase = "idle" | "gathering" | "seated" | "dispersing";

interface ForestState {
  companion: AnimalId;
  gather: GatherPhase;
  /** 聚拢 / 散开时还没到位的动物数 */
  pending: number;
  wanderPaused: boolean;
  opened: CharacterId | null;
  openedAt: WorldPos | null;
  pendingGame: string | null;
  setCompanion(a: AnimalId): void;
  startGather(count: number): void;
  startDisperse(count: number): void;
  /** 某只动物到位了 */
  arrived(): void;
  setWanderPaused(v: boolean): void;
  /** 打开角色卡：同时暂停动物走动 */
  openCard(id: CharacterId, at?: WorldPos): void;
  closeCard(): void;
  /** 点「一起玩」：卡片折回，交给游戏面板 */
  startGame(gameId: string): void;
  closeGame(): void;
}

export const useForestStore = create<ForestState>()((set) => ({
  companion: "fox",
  gather: "idle",
  pending: 0,
  wanderPaused: false,
  opened: null,
  openedAt: null,
  pendingGame: null,
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
  openCard: (opened, at) => set({ opened, openedAt: at ?? null, wanderPaused: true }),
  closeCard: () => set({ opened: null, openedAt: null, wanderPaused: false }),
  startGame: (pendingGame) => set({ pendingGame, opened: null, openedAt: null, wanderPaused: true }),
  closeGame: () => set({ pendingGame: null, wanderPaused: false }),
}));
