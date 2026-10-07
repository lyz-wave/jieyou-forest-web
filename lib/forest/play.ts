import type { AnimalId } from "../animals";

/**
 * 回到森林后的轻跳：哪只动物该跳，数字是几。
 * 不是刚玩过的那只给 0（不跳）；是刚玩过的那只给已玩次数 ——
 * 每玩完一次这个数字都会变大，所以玩第二次还会再跳一次。
 */
export function playTokenFor(lastPlayed: AnimalId | null, playedTimes: number, id: AnimalId): number {
  return lastPlayed === id ? playedTimes : 0;
}
