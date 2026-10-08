/**
 * 本机 IndexedDB 的 Dexie 实例。数据只存在用户设备上，不上传。
 * 第 1 版只有资料表；第 2 版（第三阶段）加入 sessions 与 memories。
 */
import Dexie, { type EntityTable } from "dexie";
import type { Memory, Session } from "../journal/types";
import type { Profile } from "./profile";

interface ProfileRow extends Profile {
  /** 只有一份资料，固定主键 */
  id: "me";
}

export class JieyouDB extends Dexie {
  profile!: EntityTable<ProfileRow, "id">;
  sessions!: EntityTable<Session, "id">;
  memories!: EntityTable<Memory, "id">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ profile: "id" });
    this.version(2).stores({
      profile: "id",
      sessions: "id, startedAt, status",
      memories: "id, date, sessionId",
    });
  }
}

export const DB_NAME = "jieyou";

/** 打不开时返回 null（隐私模式等），调用方退回内存存储 */
export async function openJieyouDb(name: string = DB_NAME): Promise<JieyouDB | null> {
  if (typeof indexedDB === "undefined" || !indexedDB) return null;
  const db = new JieyouDB(name);
  try {
    await db.open();
  } catch (err) {
    console.warn("IndexedDB 不可用，数据只保存在本次访问中", err);
    return null;
  }
  return db;
}
