import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProfileStore, type Profile } from "./profile";

const sample: Profile = { nickname: "小满", companion: "fox", onboardedAt: 1_790_000_000_000 };

describe("createProfileStore（IndexedDB 可用）", () => {
  let dbName: string;
  beforeEach(() => {
    dbName = `jieyou-test-${Math.random().toString(36).slice(2)}`;
  });

  it("首次读取为 null", async () => {
    const store = await createProfileStore(dbName);
    expect(store.persistent).toBe(true);
    expect(await store.load()).toBeNull();
  });

  it("保存后能读回，重新打开数据库也在", async () => {
    const a = await createProfileStore(dbName);
    await a.save(sample);
    expect(await a.load()).toEqual(sample);
    const b = await createProfileStore(dbName);
    expect(await b.load()).toEqual(sample);
  });

  it("再次保存会覆盖（只有一份资料）", async () => {
    const store = await createProfileStore(dbName);
    await store.save(sample);
    await store.save({ ...sample, nickname: "阿满" });
    expect((await store.load())?.nickname).toBe("阿满");
  });
});

describe("createProfileStore（IndexedDB 不可用）", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("IndexedDB 存在但打开被拒绝时仍能在内存里读写", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Dexie.prototype, "open").mockRejectedValue(new Error("blocked"));
    const store = await createProfileStore("blocked-profile");
    expect(store.persistent).toBe(false);
    await store.save(sample);
    expect(await store.load()).toEqual(sample);
    expect(warning).toHaveBeenCalled();
  });

  it("打开失败时退回内存存储，persistent 为 false，本次访问内仍可读写", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const store = await createProfileStore("whatever");
    expect(store.persistent).toBe(false);
    expect(await store.load()).toBeNull();
    await store.save(sample);
    expect(await store.load()).toEqual(sample);
  });
});
