/**
 * 用户资料（昵称、伙伴动物）。数据只存在本地 IndexedDB；
 * 打不开时（比如部分浏览器的隐私模式）退回内存存储，本次访问仍能正常使用。
 */
import Dexie, { type EntityTable } from "dexie";
import type { AnimalId } from "../animals";

export interface Profile {
  nickname: string;
  companion: AnimalId;
  onboardedAt: number;
}

interface ProfileRow extends Profile {
  /** 只有一份资料，固定主键 */
  id: "me";
}

export interface ProfileStore {
  /** false 表示数据只在内存里，关掉页面就没了 */
  readonly persistent: boolean;
  load(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}

class JieyouDB extends Dexie {
  profile!: EntityTable<ProfileRow, "id">;
  constructor(name: string) {
    super(name);
    // 第 1 版只有资料表；第二、三阶段升级版本加入 sessions、memories
    this.version(1).stores({ profile: "id" });
  }
}

function memoryStore(): ProfileStore {
  let value: Profile | null = null;
  return {
    persistent: false,
    load: async () => value,
    save: async (p) => {
      value = p;
    },
  };
}

const toProfile = (row: ProfileRow): Profile => ({
  nickname: row.nickname,
  companion: row.companion,
  onboardedAt: row.onboardedAt,
});

export async function createProfileStore(dbName = "jieyou"): Promise<ProfileStore> {
  if (typeof indexedDB === "undefined" || !indexedDB) return memoryStore();
  const db = new JieyouDB(dbName);
  try {
    await db.open();
  } catch (err) {
    console.warn("IndexedDB 不可用，资料只保存在本次访问中", err);
    return memoryStore();
  }
  return {
    persistent: true,
    load: async () => {
      const row = await db.profile.get("me");
      return row ? toProfile(row) : null;
    },
    save: async (p) => {
      await db.profile.put({ ...p, id: "me" });
    },
  };
}
