import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useForestStore } from "./forest";
import type { Profile, ProfileStore } from "../db/profile";
import { __setProfileStoreForTest, useAppStore } from "./app";

const sample: Profile = { nickname: "小满", companion: "bear", onboardedAt: 1 };

function fakeStore(initial: Profile | null, persistent = true): ProfileStore & { saved: Profile[] } {
  let value = initial;
  const saved: Profile[] = [];
  return {
    persistent,
    saved,
    load: async () => value,
    save: async (p) => {
      saved.push(p);
      value = p;
    },
  };
}

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({ phase: "loading", profile: null, persistent: true });
    useForestStore.setState({ companion: "fox" });
  });
  afterEach(() => vi.restoreAllMocks());

  it("保存失败仍能继续，提示资料不能持久化", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    __setProfileStoreForTest({ persistent: true, load: async () => null, save: async () => { throw new Error("quota"); } });
    await useAppStore.getState().boot();
    await useAppStore.getState().completeOnboarding(sample);
    expect(useAppStore.getState()).toMatchObject({ phase: "forest", profile: sample, persistent: false });
    expect(warning).toHaveBeenCalled();
  });

  it("恢复资料时同步森林的伙伴", async () => {
    __setProfileStoreForTest(fakeStore(sample));
    await useAppStore.getState().boot();
    expect(useForestStore.getState().companion).toBe("bear");
  });

  it("新选伙伴在进入森林前同步", async () => {
    __setProfileStoreForTest(fakeStore(null));
    await useAppStore.getState().completeOnboarding(sample);
    expect(useForestStore.getState().companion).toBe("bear");
  });

  it("没有资料时进入入林引导", async () => {
    __setProfileStoreForTest(fakeStore(null));
    await useAppStore.getState().boot();
    expect(useAppStore.getState().phase).toBe("onboarding");
  });

  it("有资料时直接进入森林", async () => {
    __setProfileStoreForTest(fakeStore(sample));
    await useAppStore.getState().boot();
    expect(useAppStore.getState().phase).toBe("forest");
    expect(useAppStore.getState().profile).toEqual(sample);
  });

  it("完成入林时才写入资料", async () => {
    const s = fakeStore(null);
    __setProfileStoreForTest(s);
    await useAppStore.getState().boot();
    expect(s.saved).toEqual([]);
    await useAppStore.getState().completeOnboarding(sample);
    expect(s.saved).toEqual([sample]);
    expect(useAppStore.getState().phase).toBe("forest");
  });

  it("存储不可用时标记 persistent=false，仍能进入森林", async () => {
    __setProfileStoreForTest(fakeStore(null, false));
    await useAppStore.getState().boot();
    expect(useAppStore.getState().persistent).toBe(false);
    await useAppStore.getState().completeOnboarding(sample);
    expect(useAppStore.getState().phase).toBe("forest");
  });
});
