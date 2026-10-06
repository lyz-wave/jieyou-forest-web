import { create } from "zustand";

/** 小游戏产生的上下文，只存在内存里；第二阶段创建倾诉会话时并入 Session */
export const GAME_CONTEXT_LIMIT = 20;

interface GameContextState {
  entries: string[];
  add(game: string, content: string): void;
  clear(): void;
}

export const useGameContextStore = create<GameContextState>()((set) => ({
  entries: [],
  add: (game, content) => set((s) => ({ entries: [...s.entries, `【${game}】${content}`].slice(-GAME_CONTEXT_LIMIT) })),
  clear: () => set({ entries: [] }),
}));
