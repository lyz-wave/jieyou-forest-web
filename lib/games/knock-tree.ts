/* **/
/* * 敲树洞（笃笃）的纯逻辑：敲击状态机、情绪词的选择上限、笃笃的回应。*/
/* * 界面只管画，判断都在这里，方便单测。*/
/* */

/* 停手多久算敲击结束*/
export const KNOCK_STOP_MS = 3000;
/* 从第一次点击起最多敲多久*/
export const KNOCK_MAX_MS = 30000;
/* 情绪词表（规格里的 10 个）*/
export const EMOTIONS = [
  "愤怒",
  "委屈",
  "焦虑",
  "失落",
  "疲惫",
  "羞愧",
  "孤独",
  "害怕",
  "不甘",
  "说不清",
] as const;
export type Emotion = (typeof EMOTIONS)[number];
/* 最多能选几个情绪词*/
export const EMOTION_MAX = 3;
export const EMOTION_LIMIT_HINT = "最多选 3 个就好";

export interface KnockSession {
  count: number;
  startedAt: number | null;
  lastTapAt: number | null;
}

/* waiting：还没敲；knocking：正在敲；stop：停手满 3 秒；cap：满 30 秒*/
export type KnockState = "waiting" | "knocking" | "stop" | "cap";

export function newKnockSession(): KnockSession {
  return { count: 0, startedAt: null, lastTapAt: null };
}

export function tap(session: KnockSession, now: number): KnockSession {
  return {
    count: session.count + 1,
    startedAt: session.startedAt ?? now,
    lastTapAt: now,
  };
}

export function knockState(session: KnockSession, now: number): KnockState {
  const { startedAt, lastTapAt } = session;
  if (session.count === 0 || startedAt === null || lastTapAt === null) return "waiting";
  // 满 30 秒优先：连续点满时不会被「停手」抢先
  if (now - startedAt >= KNOCK_MAX_MS) return "cap";
  if (now - lastTapAt >= KNOCK_STOP_MS) return "stop";
  return "knocking";
}

export interface EmotionPick {
  selected: Emotion[];
/* 因为已经选满 3 个而被拒*/
  blocked: boolean;
}

export function toggleEmotion(selected: readonly Emotion[], emotion: Emotion): EmotionPick {
  if (selected.includes(emotion)) {
    return { selected: selected.filter((item) => item !== emotion), blocked: false };
  }
  if (selected.length >= EMOTION_MAX) return { selected: [...selected], blocked: true };
  return { selected: [...selected, emotion], blocked: false };
}

/* 「委屈」「委屈和疲惫」「委屈、疲惫和孤独」*/
export function joinEmotions(selected: readonly Emotion[]): string {
  if (selected.length === 0) return "";
  if (selected.length === 1) return selected[0];
  return selected.slice(0, -1).join("、") + "和" + selected[selected.length - 1];
}

export function knockReply(selected: readonly Emotion[]): string {
  if (selected.length === 1 && selected[0] === "说不清") {
    return "说不清也没关系，情绪本来就是一团乱麻";
  }
  return "原来你是" + joinEmotions(selected) + "啊，这很正常";
}

export function knockContext(selected: readonly Emotion[]): string | null {
  if (selected.length === 0) return null;
  return "此刻的情绪：" + selected.join("、");
}