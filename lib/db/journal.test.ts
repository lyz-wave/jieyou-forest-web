import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Memory, Session } from "@/lib/journal/types";
import { createJournalStore } from "./journal";
import { createProfileStore } from "./profile";

const session: Session = {
  id: "s-1",
  startedAt: 1_790_000_000_000,
  status: "open",
  companion: "fox",
  moodBefore: 3,
  gameContext: ["【敲树洞】此刻的情绪：委屈"],
  matchedMemoryIds: [],
  messages: [{ id: "m-1", speaker: "user", content: "这次汇报我觉得搞砸了。", createdAt: 1_790_000_000_100 }],
};

const memory: Memory = {
  id: "mem-1",
  sessionId: "s-1",
  date: "2026-03-12",
  title: "一次汇报",
  summary: "汇报搞砸了，觉得自己不行。",
  emotions: ["委屈"],
  themes: ["工作压力"],
  coreBelief: "我什么都做不好",
  shift: { from: "我就是不行", to: "这件事可以再练" },
  insight: "一次汇报不等于我这个人。",
  action: "明天写三行提纲",
  helpfulAnimals: ["fox"],
  moodBefore: 3,
  moodAfter: 6,
};

let dbName = "";
const freshName = () => `jieyou-journal-${Math.random().toString(36).slice(2)}`;

describe("createJournalStore（IndexedDB 可用）", () => {
  it("第 1 版写的资料，升到第 2 版后还在", async () => {
    dbName = freshName();
    const legacy = new Dexie(dbName);
    legacy.version(1).stores({ profile: "id" });
    const table = legacy.table("profile") as unknown as { put(row: Record<string, unknown>): Promise<unknown> };
    await table.put({ id: "me", nickname: "小满", companion: "fox", onboardedAt: 1, selfPicks: [] });
    legacy.close();

    const journal = await createJournalStore(dbName);
    expect(journal.persistent).toBe(true);
    await journal.saveSession(session);
    const profile = await createProfileStore(dbName);
    expect((await profile.load())?.nickname).toBe("小满");
  });

  it("存会话、按 id 取、按开始时间倒序列出", async () => {
    const journal = await createJournalStore(freshName());
    await journal.saveSession(session);
    await journal.saveSession({ ...session, id: "s-2", startedAt: session.startedAt + 1000, status: "paused" });
    expect((await journal.getSession("s-1"))?.companion).toBe("fox");
    expect(await journal.getSession("s-不存在")).toBeNull();
    expect((await journal.listSessions()).map((s) => s.id)).toEqual(["s-2", "s-1"]);
  });

  it("最新的暂存会话能找出来（古树要问「上次那件事，还想接着聊吗？」）", async () => {
    const journal = await createJournalStore(freshName());
    await journal.saveSession({ ...session, id: "s-1", status: "resolved", startedAt: 1 });
    expect(await journal.latestPaused()).toBeNull();
    await journal.saveSession({ ...session, id: "s-2", status: "paused", startedAt: 2 });
    await journal.saveSession({ ...session, id: "s-3", status: "paused", startedAt: 3 });
    expect((await journal.latestPaused())?.id).toBe("s-3");
  });

  it("记忆按日期倒序，删一条、清空都能用", async () => {
    const journal = await createJournalStore(freshName());
    await journal.saveMemory(memory);
    await journal.saveMemory({ ...memory, id: "mem-2", date: "2026-11-02" });
    await journal.saveMemory({ ...memory, id: "mem-3", date: "2024-03-12" });
    expect((await journal.listMemories()).map((m) => m.id)).toEqual(["mem-2", "mem-1", "mem-3"]);
    await journal.deleteMemory("mem-2");
    expect((await journal.listMemories()).map((m) => m.id)).toEqual(["mem-1", "mem-3"]);
    await journal.clear();
    expect(await journal.listMemories()).toEqual([]);
    expect(await journal.listSessions()).toEqual([]);
  });
});

describe("createJournalStore（IndexedDB 打不开）", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("退回内存存储，本次访问里照样能读写", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Dexie.prototype, "open").mockRejectedValue(new Error("blocked"));
    const journal = await createJournalStore("blocked-journal");
    expect(journal.persistent).toBe(false);
    await journal.saveMemory(memory);
    expect((await journal.listMemories()).map((m) => m.id)).toEqual(["mem-1"]);
  });
});
