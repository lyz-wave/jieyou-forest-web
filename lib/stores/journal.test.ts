import { beforeEach, describe, expect, it } from "vitest";
import type { Memory, Session } from "@/lib/journal/types";
import { useJournalStore } from "./journal";

let dbName = "";
beforeEach(() => {
  dbName = "jieyou-journal-" + Math.random().toString(36).slice(2);
  useJournalStore.setState({ ready: false, persistent: true, memories: [], paused: null });
});

function memory(id: string, date: string, title: string): Memory {
  return {
    id,
    sessionId: "s-" + id,
    date,
    title,
    summary: "一次汇报没做好。",
    emotions: ["委屈"],
    themes: ["工作压力"],
    coreBelief: "我不行",
    shift: { from: "我整个人不行", to: "一次没做好" },
    insight: "我可以做得不好，也还是我。",
    helpfulAnimals: ["owl"],
  };
}

function session(id: string, startedAt: number, status: Session["status"]): Session {
  return {
    id,
    startedAt,
    status,
    companion: "owl",
    gameContext: [],
    matchedMemoryIds: [],
    messages: [{ id: "m-0", speaker: "user", content: "这次汇报我觉得搞砸了。", createdAt: startedAt }],
  };
}

describe("年轮里的记录", () => {
  it("读出来按日期倒序，最近的在前", async () => {
    await useJournalStore.getState().load(dbName);
    await useJournalStore.getState().addMemory(memory("a", "2025-03-05", "去年的那次"));
    await useJournalStore.getState().addMemory(memory("b", "2026-03-05", "这次汇报"));
    expect(useJournalStore.getState().memories.map((m) => m.id)).toEqual(["b", "a"]);
    expect(useJournalStore.getState().ready).toBe(true);
  });

  it("暂存的会话单独留着，给古树那句追问用", async () => {
    await useJournalStore.getState().load(dbName);
    await useJournalStore.getState().putSession(session("s-1", 100, "resolved"));
    expect(useJournalStore.getState().paused).toBeNull();
    await useJournalStore.getState().putSession(session("s-2", 200, "paused"));
    expect(useJournalStore.getState().paused?.id).toBe("s-2");
  });

  it("删一条、清空都只动年轮里的东西", async () => {
    await useJournalStore.getState().load(dbName);
    await useJournalStore.getState().addMemory(memory("a", "2025-03-05", "去年的那次"));
    await useJournalStore.getState().addMemory(memory("b", "2026-03-05", "这次汇报"));
    await useJournalStore.getState().removeMemory("a");
    expect(useJournalStore.getState().memories.map((m) => m.id)).toEqual(["b"]);
    await useJournalStore.getState().clear();
    expect(useJournalStore.getState().memories).toEqual([]);
    expect(useJournalStore.getState().paused).toBeNull();
  });
});

describe("那天的对话", () => {
  it("按 id 取回某一次的原文", async () => {
    const name = "jieyou-journal-" + String(Date.now());
    await useJournalStore.getState().load(name);
    useJournalStore.setState({ ready: false, persistent: true, memories: [], paused: null });
    await useJournalStore.getState().load(name);
    await useJournalStore.getState().putSession(session("s-1", 100, "paused"));
    const got = await useJournalStore.getState().getSession("s-1");
    expect(got?.id).toBe("s-1");
    expect(await useJournalStore.getState().getSession("没有这一个")).toBeNull();
  });
});
