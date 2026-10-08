import type { Gesture } from "@/lib/talk/gesture";

/** 一段小动作要动的部件与关键帧；part 为空串表示整只身体 */
export interface GestureMove {
  part: string;
  keyframes: { rotate?: number[]; scaleY?: number[]; y?: number[] };
}

/** 播放参数：听的时候反复轻轻做，别的时候只做一次 */
export interface GestureTiming {
  duration: number;
  repeat: number;
  repeatDelay: number;
}

/** 屡次轻柔地做（聆听），还是一次做完（反应） */
export function gestureTiming(loop: boolean): GestureTiming {
  return loop ? { duration: 1.1, repeat: Infinity, repeatDelay: 1.6 } : { duration: 0.9, repeat: 0, repeatDelay: 0 };
}

/**
 * 每种动作落到哪些部件上。
 * 动物身上没有对应的部件时（比如狐狸没有手臂），由 PaperPuppet 退回头部点头。
 */
export function gestureMoves(gesture: Gesture): GestureMove[] {
  switch (gesture) {
    case "nod":
      return [{ part: "head", keyframes: { rotate: [0, 7, -3, 2, 0] } }];
    case "ears":
      return [{ part: "ear", keyframes: { rotate: [0, -9, 2, -5, 0] } }];
    case "chin":
      return [
        { part: "arm", keyframes: { rotate: [0, -28, -24, -28, 0] } },
        { part: "head", keyframes: { rotate: [0, -4, -4, -2, 0] } },
      ];
    case "think":
      return [{ part: "head", keyframes: { rotate: [0, -9, -9, -2, 0] } }];
    case "smile":
      return [
        { part: "", keyframes: { scaleY: [1, 1.05, 0.97, 1.03, 1], y: [0, -6, 0, -2, 0] } },
        { part: "head", keyframes: { rotate: [0, 3, -2, 1, 0] } },
      ];
  }
}
