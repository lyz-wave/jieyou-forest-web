import { create } from "zustand";
import { createProfileStore, type Profile, type ProfileStore } from "../db/profile";
import { useForestStore } from "./forest";

/**
 * 应用状态：启动阶段、用户资料、本地存储是否可用。
 * - loading：正在读本地资料
 * - onboarding：没有资料，走入林引导
 * - forest：已入林
 */
export type AppPhase = "loading" | "onboarding" | "forest";

interface AppState {
  phase: AppPhase;
  profile: Profile | null;
  /** false：IndexedDB 不可用，资料只在本次访问中 */
  persistent: boolean;
  boot(): Promise<void>;
  /** 入林引导最后一步：写入资料并进入森林 */
  completeOnboarding(profile: Profile): Promise<void>;
}

let store: ProfileStore | null = null;
const getStore = async () => (store ??= await createProfileStore());

/** 测试用：换一个资料存储（比如指向临时数据库） */
export function __setProfileStoreForTest(s: ProfileStore | null): void {
  store = s;
}

export const useAppStore = create<AppState>()((set) => ({
  phase: "loading",
  profile: null,
  persistent: true,
  boot: async () => {
    const s = await getStore();
    let profile: Profile | null = null;
    try {
      profile = await s.load();
    } catch (err) {
      console.warn("读取资料失败，重新入林", err);
    }
    if (profile) useForestStore.getState().setCompanion(profile.companion);
    set({ persistent: s.persistent, profile, phase: profile ? "forest" : "onboarding" });
  },
  completeOnboarding: async (profile) => {
    const s = await getStore();
    try {
      await s.save(profile);
    } catch (err) {
      console.warn("保存资料失败，本次访问内继续使用", err);
      set({ persistent: false });
    }
    useForestStore.getState().setCompanion(profile.companion);
    set({ profile, phase: "forest" });
  },
}));
