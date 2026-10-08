import { afterEach, describe, expect, it } from "vitest";
import type { Speech } from "@/lib/ai/schema";
import { roundtableOrder } from "@/lib/talk/flow";
import { useForestStore } from "@/lib/stores/forest";
import { useTalkStore } from "./talk";

function speechesOf(order: readonly string[]): Speech[] {
  return order.map((animal, i) => ({ animal, text: "第" + (i + 1) + "句", mood: "gentle" })) as Speech[];
}

afterEach(() => {
  useTalkStore.getState().finish();
  useForestStore.setState({ companion: "fox" });
});

describe("倾诉的过程", () => {
  it("开始倾诉先进打分与写字，提交后安静下来听", () => {
    const talk = useTalkStore.getState();
    talk.open();
    expect(useTalkStore.getState().phase).toBe("mood");
    expect(useTalkStore.getState().mood).toBe(null);

    useTalkStore.getState().setMood(7);
    useTalkStore.getState().setText("他两天没回我消息，他一定讨厌我了");
    expect(useTalkStore.getState().mood).toBe(7);

    useTalkStore.getState().submit();
    expect(useTalkStore.getState().phase).toBe("listening");
    expect(useTalkStore.getState().text).toBe("他两天没回我消息，他一定讨厌我了");
  });

  it("圆桌按「今天的伙伴先说」排好，重复的一只只留第一次", () => {
    useForestStore.setState({ companion: "turtle" });
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    const order = ["owl", "turtle", "fox"];
    const messy = speechesOf(order);
    messy.push({ animal: "fox", text: "又说了一遍", mood: "calm" } as Speech);
    useTalkStore.getState().gotSpeeches(messy);

    const s = useTalkStore.getState();
    expect(s.phase).toBe("roundtable");
    expect(s.speeches.map((x) => x.animal).slice(0, 3)).toEqual(["turtle", "owl", "fox"]);
    expect(s.speeches.filter((x) => x.animal === "fox").length).toBe(1);
    expect(s.shown).toBe(1);
    expect(s.speaker).toBe("turtle");
  });

  it("下一位一次出一只，到底就停住；全部显示把剩下的都放出来", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    const order = roundtableOrder(useForestStore.getState().companion);
    useTalkStore.getState().gotSpeeches(speechesOf(order));

    for (let i = 0; i < order.length - 1; i += 1) useTalkStore.getState().next();
    expect(useTalkStore.getState().shown).toBe(order.length);
    expect(useTalkStore.getState().all).toBe(true);
    expect(useTalkStore.getState().speaker).toBe(order[order.length - 1]);
    useTalkStore.getState().next();
    expect(useTalkStore.getState().shown).toBe(order.length);

    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().gotSpeeches(speechesOf(order));
    useTalkStore.getState().showAll();
    expect(useTalkStore.getState().all).toBe(true);
    expect(useTalkStore.getState().shown).toBe(order.length);
  });

  it("说到心里了可以点上也可以取消", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().toggleMark("owl");
    expect(useTalkStore.getState().marked).toEqual(["owl"]);
    useTalkStore.getState().toggleMark("owl");
    expect(useTalkStore.getState().marked).toEqual([]);
  });

  it("高风险先停住：发言到了也还在守护页，按继续才回到圆桌", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().guard("crisis");
    expect(useTalkStore.getState().phase).toBe("risk");
    expect(useTalkStore.getState().risk).toBe("crisis");

    useTalkStore.getState().gotSpeeches(speechesOf(["fox"]));
    expect(useTalkStore.getState().phase).toBe("risk");
    useTalkStore.getState().resume();
    expect(useTalkStore.getState().phase).toBe("roundtable");
    expect(useTalkStore.getState().shown).toBe(1);
  });

  it("守护页按下继续时发言还没到，就再等一会儿", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().guard("concern");
    useTalkStore.getState().resume();
    expect(useTalkStore.getState().phase).toBe("listening");
  });

  it("古树总结之后可以继续对话，回复最多留 20 条", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().gotSpeeches(speechesOf(["fox"]));
    useTalkStore.getState().toSummary({
      heard: "我听见了",
      voices: [{ animal: "owl", point: "分开看" }],
      thought: "先歇一歇",
      nextStep: "今晚早点睡",
      question: "你愿意先做哪一件？",
    });
    expect(useTalkStore.getState().phase).toBe("summary");
    expect(useTalkStore.getState().summary?.thought).toBe("先歇一歇");

    for (let i = 0; i < 25; i += 1) useTalkStore.getState().addReply({ speaker: "tree", text: "第" + (i + 1) + "次回答" });
    expect(useTalkStore.getState().phase).toBe("followup");
    expect(useTalkStore.getState().replies.length).toBe(20);
    expect(useTalkStore.getState().replies[19].text).toBe("第25次回答");
  });

  it("让大家再说说会回到安静地听，再进来的发言重新从第一只开始", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().gotSpeeches(speechesOf(["fox", "owl"]));
    useTalkStore.getState().next();
    useTalkStore.getState().again();
    expect(useTalkStore.getState().phase).toBe("listening");
    useTalkStore.getState().gotSpeeches(speechesOf(["owl", "fox"]));
    expect(useTalkStore.getState().phase).toBe("roundtable");
    expect(useTalkStore.getState().shown).toBe(1);
  });

  it("结束就全都清掉，回到森林", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().setMood(3);
    useTalkStore.getState().setText("今天有点撑不住");
    useTalkStore.getState().submit();
    useTalkStore.getState().finish();
    const s = useTalkStore.getState();
    expect(s.phase).toBe("away");
    expect(s.text).toBe("");
    expect(s.mood).toBe(null);
    expect(s.speeches).toEqual([]);
    expect(s.replies).toEqual([]);
  });

  it("头顶气泡：打出来的字放在 store 里，收场时清掉", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().setBubble("你");
    expect(useTalkStore.getState().bubble).toBe("你");
    useTalkStore.getState().again();
    expect(useTalkStore.getState().bubble).toBe(null);
    useTalkStore.getState().setBubble("算了");
    useTalkStore.getState().finish();
    expect(useTalkStore.getState().bubble).toBe(null);
  });

  it("圆桌没接上时要从聆听里出来，但站在守护页上就别动", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().toRoundtable();
    expect(useTalkStore.getState().phase).toBe("roundtable");

    useTalkStore.getState().open();
    useTalkStore.getState().submit();
    useTalkStore.getState().guard("crisis");
    useTalkStore.getState().toRoundtable();
    expect(useTalkStore.getState().phase).toBe("risk");
  });
});

describe("concern 只记一笔", () => {
  it("markConcern 记下来，下一次 open 就清掉", () => {
    const state = () => useTalkStore.getState();
    state().markConcern(true);
    expect(state().concern).toBe(true);
    state().open();
    expect(state().concern).toBe(false);
  });
});
