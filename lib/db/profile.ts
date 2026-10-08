/**
 * 用户资料（昵称、伙伴动物）。数据只存在本地 IndexedDB；
 * 打不开时（比如部分浏览器的隐私模式）退回内存存储，本次访问仍能正常使用。
 */
import type { AnimalId } from "../animals";
import type { SelfPick } from "../onboarding/selfpick";
import { DB_NAME, openJieyouDb } from "./db";

export interface Profile {
  nickname: string;
  companion: AnimalId;
  onboardedAt: number;
  /** 每次入林怎么选的伙伴：时间、想被怎么陪、最后选了谁、自己挑还是问出来的。老资料没有这个字段时读出来是空数组 */
  selfPicks: SelfPick[];
}

export interface ProfileStore {
  /** false 表示数据只在内存里，关掉页面就没了 */
  readonly persistent: boolean;
  load(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}

function memoryStore(): ProfileStore {
  let value: Profile | null = null;
  return {
    persistent: false,
    load: async () => value,
    save: async (next) => {
      value = next;
    },
  };
}

export async function createProfileStore(dbName: string = DB_NAME): Promise<ProfileStore> {
  const db = await openJieyouDb(dbName);
  if (!db) return memoryStore();
  return {
    persistent: true,
    load: async () => {
      const row = await db.profile.get("me");
      if (!row) return null;
      return {
        nickname: row.nickname,
        companion: row.companion,
        onboardedAt: row.onboardedAt,
        selfPicks: row.selfPicks ?? [],
      };
    },
    save: async (next) => {
      await db.profile.put({ ...next, id: "me" });
    },
  };
}
