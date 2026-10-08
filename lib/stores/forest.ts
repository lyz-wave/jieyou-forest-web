import { create } from "zustand";
import type { AnimalId, CharacterId } from "../animals";
import type { WorldPos } from "../forest/ground";

/**
 * 森林状态。
 * - gather：idle 平时 → gathering 正在聚拢 → seated 都坐好了 → dispersing 正在散开 → idle
 * - wanderPaused：卡片 / 小游戏打开时暂停走动
 * - opened：当前打开的角色卡（动物或古树），openedAt 是打开时那只动物在哪，镜头据此推近
 * - pendingGame：角色卡里点了「一起玩」，等 GameHost 把对应的游戏面板挂出来；
 *   gameAnimal 是玩它的动物，gameAt 是镜头在游戏期间继续对着的位置
 * - lastPlayed / playedTimes：刚玩完游戏的动物与已玩次数，回到森林后它轻跳一下
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
  /** 年轮页开着没有 */
  rings: boolean;
  pendingGame: string | null;
  gameAnimal: AnimalId | null;
  gameAt: WorldPos | null;
  lastPlayed: AnimalId | null;
  playedTimes: number;
  setCompanion(a: AnimalId): void;
  startGather(count: number): void;
  startDisperse(count: number): void;
  /** 某只动物到位了 */
  arrived(): void;
  setWanderPaused(v: boolean): void;
  /** 打开角色卡：同时暂停动物走动 */
  openCard(id: CharacterId, at?: WorldPos): void;
  closeCard(): void;
  /** 点「一起玩」：卡片折回，交给游戏面板，镜头继续对着这只动物 */
  startGame(gameId: string, animal: AnimalId): void;
  /** 游戏面板收起：记下刚玩过的动物，走动恢复 */
  closeGame(): void;
  /** 去古树里看年轮 */
  openRings(): void;
  closeRings(): void;
}

export const useForestStore = create<ForestState>()((set) => ({
  companion: "fox",
  gather: "idle",
  pending: 0,
  wanderPaused: false,
  opened: null,
  openedAt: null,
  rings: false,
  pendingGame: null,
  gameAnimal: null,
  gameAt: null,
  lastPlayed: null,
  playedTimes: 0,
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
  startGame: (pendingGame, gameAnimal) =>
    set((s) => ({ pendingGame, gameAnimal, gameAt: s.openedAt, opened: null, openedAt: null, wanderPaused: true })),
  openRings: () => set({ rings: true, opened: null, openedAt: null, wanderPaused: true }),
  closeRings: () => set({ rings: false, wanderPaused: false }),
  closeGame: () =>
    set((s) => {
      // 没开着游戏时按 Esc 不算玩过一次
      if (!s.pendingGame) return {};
      return {
        pendingGame: null,
        gameAnimal: null,
        gameAt: null,
        lastPlayed: s.gameAnimal,
        playedTimes: s.playedTimes + 1,
        wanderPaused: false,
      };
    }),
}));
