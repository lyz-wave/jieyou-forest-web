import { describe, expect, it } from "vitest";
import type { Emotion } from "./knock-tree";
import {
  EMOTIONS,
  EMOTION_MAX,
  KNOCK_MAX_MS,
  KNOCK_STOP_MS,
  knockContext,
  knockReply,
  knockState,
  newKnockSession,
  tap,
  toggleEmotion,
} from "./knock-tree";

describe("敲树洞的状态机", () => {
  it("第一次点击记下起始时间，连续点击累加连击数", () => {
    const first = tap(newKnockSession(), 1000);
    const second = tap(first, 1200);
    expect(second.count).toBe(2);
    expect(second.startedAt).toBe(1000);
    expect(second.lastTapAt).toBe(1200);
  });

  it("还没点过时是 waiting", () => {
    expect(knockState(newKnockSession(), 0)).toBe("waiting");
  });

  it("点过之后没到停手时间还是 knocking", () => {
    const s = tap(newKnockSession(), 1000);
    expect(knockState(s, 1000 + KNOCK_STOP_MS - 1)).toBe("knocking");
  });

  it("停手满 3 秒就结束", () => {
    const s = tap(newKnockSession(), 1000);
    expect(knockState(s, 1000 + KNOCK_STOP_MS)).toBe("stop");
  });

  it("从第一次点击起满 30 秒自动结束", () => {
    const first = tap(newKnockSession(), 0);
    const last = tap(first, 1000);
    expect(knockState(last, KNOCK_MAX_MS)).toBe("cap");
  });

  it("满 30 秒优先于停手判定", () => {
    const first = tap(newKnockSession(), 0);
    const last = tap(first, KNOCK_STOP_MS);
    expect(knockState(last, KNOCK_MAX_MS)).toBe("cap");
  });
});

describe("情绪词的选择上限", () => {
  it("最多选 3 个，第 4 个不会被选中并给出提示", () => {
    let picked: Emotion[] = [];
    picked = toggleEmotion(picked, "愤怒").selected;
    picked = toggleEmotion(picked, "委屈").selected;
    picked = toggleEmotion(picked, "焦虑").selected;
    const fourth = toggleEmotion(picked, "失落");
    expect(fourth.selected).toEqual(["愤怒", "委屈", "焦虑"]);
    expect(fourth.blocked).toBe(true);
  });

  it("再点一次已选的词就取消", () => {
    const r = toggleEmotion(["愤怒", "委屈"], "愤怒");
    expect(r.selected).toEqual(["委屈"]);
    expect(r.blocked).toBe(false);
  });

  it("从满 3 个里取消一个以后就能再选", () => {
    const after = toggleEmotion(["愤怒", "委屈", "焦虑"], "愤怒").selected;
    expect(toggleEmotion(after, "失落").blocked).toBe(false);
  });

  it("情绪词表就是规格里的 10 个", () => {
    expect(EMOTIONS).toHaveLength(10);
    expect(EMOTIONS).toEqual([
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
    ]);
    expect(EMOTION_MAX).toBe(3);
  });
});

describe("笃笃的回应", () => {
  it("选一个词", () => {
    expect(knockReply(["委屈"])).toBe("原来你是委屈啊，这很正常");
  });

  it("选两个词用「和」连接", () => {
    expect(knockReply(["委屈", "疲惫"])).toBe("原来你是委屈和疲惫啊，这很正常");
  });

  it("选三个词先用「、」再用「和」", () => {
    expect(knockReply(["委屈", "疲惫", "孤独"])).toBe("原来你是委屈、疲惫和孤独啊，这很正常");
  });

  it("只选「说不清」时说另一句", () => {
    expect(knockReply(["说不清"])).toBe("说不清也没关系，情绪本来就是一团乱麻");
  });

  it("gameContext 只记选中的情绪词", () => {
    expect(knockContext(["委屈", "疲惫"])).toBe("此刻的情绪：委屈、疲惫");
  });

  it("没选词时 gameContext 为空", () => {
    expect(knockContext([])).toBeNull();
  });
});