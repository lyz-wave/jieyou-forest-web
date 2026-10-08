import { describe, expect, it } from "vitest";
import { ANIMAL_CAST, type AnimalId } from "@/lib/animals";
import { LISTEN_GESTURE, REACTIONS, gestureFor, reactionPlan } from "./gesture";

const CAST: AnimalId[] = ANIMAL_CAST.map((animal) => animal.id);

describe("聆听时的动作", () => {
  it("每只都有动作；松鼠竖耳朵、团团托腮，其余点头", () => {
    for (const id of CAST) expect(["nod", "ears", "chin"]).toContain(LISTEN_GESTURE[id]);
    expect(LISTEN_GESTURE.squirrel).toBe("ears");
    expect(LISTEN_GESTURE.bear).toBe("chin");
    expect(LISTEN_GESTURE.fox).toBe("nod");
  });
});

describe("别人说话时的反应", () => {
  it("发言的那只不排动作，其余每只都轮到点头、思考或笑", () => {
    const plan = reactionPlan(CAST, "owl", 0);
    expect(plan.owl).toBeUndefined();
    for (const id of CAST) {
      if (id === "owl") continue;
      expect(REACTIONS).toContain(plan[id]);
    }
    expect(Object.keys(plan)).toHaveLength(CAST.length - 1);
    expect(new Set(Object.values(plan))).toEqual(new Set(REACTIONS));
  });

  it("每换一位发言人，动作都往后错一格", () => {
    const first = reactionPlan(CAST, "owl", 0);
    const second = reactionPlan(CAST, "owl", 1);
    expect(second[CAST[0]]).not.toBe(first[CAST[0]]);
  });
});

describe("此刻该做什么动作", () => {
  it("聆听时每只做自己的那个动作", () => {
    expect(gestureFor("listening", "squirrel", {})).toBe("ears");
    expect(gestureFor("listening", "bear", {})).toBe("chin");
  });

  it("圆桌上做轮到的反应，其余时候不做", () => {
    expect(gestureFor("roundtable", "fox", { fox: "think" })).toBe("think");
    expect(gestureFor("roundtable", "owl", { fox: "think" })).toBeNull();
    expect(gestureFor("mood", "fox", { fox: "think" })).toBeNull();
    expect(gestureFor("away", "fox", { fox: "think" })).toBeNull();
  });
});
