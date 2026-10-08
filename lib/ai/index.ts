import { useDevStore } from "@/lib/stores/dev";
import { createHttpAI } from "./http";
import type { ForestAI } from "./types";

/**
 * 森林里唯一露出的 AI。
 * 界面（七个小游戏、useAiRequest）只认这个对象，实现换了它们一行都不用改；
 * 第二阶段起它走自家的 /api 接口（见 ./http.ts），服务端没配 Key 时接口回 503，
 * 界面拿到的就是那句「风太大了没听清，能再说一次吗？」。
 */
export const forestAI: ForestAI = createHttpAI({
  shouldFail: () => useDevStore.getState().simulateAIFailure,
});

export function getForestAI(): ForestAI {
  return forestAI;
}
