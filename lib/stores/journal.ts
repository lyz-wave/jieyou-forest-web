/**
 * 年轮里的记录：成长卡片与暂存的会话。
 * 组件不直接碰数据库，读写都从这里过；IndexedDB 打不开时这一步也照常能用，只是关掉页面就没了。
 */
import { create } from "zustand";
import { DB_NAME } from "../db/db";
import { createJournalStore, type JournalStore } from "../db/journal";
import type { Memory, Session } from "../journal/types";

export interface JournalState {
  ready: boolean;
  /** false 表示只存在内存里 */
  persistent: boolean;
  /** 成长卡片，按日期倒序 */
  memories: Memory[];
  /** 上次「先放一放」的那一次 */
  paused: Session | null;
  /** 某一次倾诉的原文（年轮里展开「那天的对话」用） */
  getSession(id: string): Promise<Session | null>;
  load(dbName?: string): Promise<void>;
  addMemory(memory: Memory): Promise<void>;
  putSession(session: Session): Promise<void>;
  removeMemory(id: string): Promise<void>;
  clear(): Promise<void>;
}

let backend: { name: string; store: JournalStore } | null = null;

async function storeFor(name: string): Promise<JournalStore> {
  if (backend === null || backend.name !== name) {
    backend = { name, store: await createJournalStore(name) };
  }
  return backend.store;
}

async function currentStore(): Promise<JournalStore> {
  return backend === null ? storeFor(DB_NAME) : backend.store;
}

async function snapshot(store: JournalStore): Promise<Pick<JournalState, "persistent" | "memories" | "paused">> {
  const [memories, paused] = await Promise.all([store.listMemories(), store.latestPaused()]);
  return { persistent: store.persistent, memories, paused };
}

export const useJournalStore = create<JournalState>()((set) => ({
  ready: false,
  persistent: true,
  memories: [],
  paused: null,
  load: async (dbName = DB_NAME) => {
    const store = await storeFor(dbName);
    set({ ...(await snapshot(store)), ready: true });
  },
  addMemory: async (memory) => {
    const store = await currentStore();
    await store.saveMemory(memory);
    set(await snapshot(store));
  },
  getSession: async (id) => (await currentStore()).getSession(id),
  putSession: async (session) => {
    const store = await currentStore();
    await store.saveSession(session);
    set(await snapshot(store));
  },
  removeMemory: async (id) => {
    const store = await currentStore();
    await store.deleteMemory(id);
    set(await snapshot(store));
  },
  clear: async () => {
    const store = await currentStore();
    await store.clear();
    set(await snapshot(store));
  },
}));
