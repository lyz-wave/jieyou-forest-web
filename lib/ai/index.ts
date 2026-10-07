import { useDevStore } from "@/lib/stores/dev";
import { createMockAI } from "./mock";
import type { ForestAI } from "./types";

/**
 * 森林里唯一露出的 AI。
 * 第一阶段是本地 mock；第二阶段换成真实现时只改这一行，小游戏代码不用动。
 */
export const forestAI: ForestAI = createMockAI({
  shouldFail: () => useDevStore.getState().simulateAIFailure,
});
