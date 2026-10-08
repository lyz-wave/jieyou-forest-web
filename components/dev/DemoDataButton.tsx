"use client";

import { useState, type ReactElement } from "react";
import { demoMemories } from "@/lib/rings/rings";
import { useJournalStore } from "@/lib/stores/journal";

/** 种子固定，点几次都是同一批假记录 */
export const DEMO_SEED = 20260401;

/**
 * 开发用：造一批跨两三年的假记录，看年轮长什么样子（产品文档第十一节）。
 * 只在开发工具里出现，生产构建要带 ?dev=1。
 */
export function DemoDataButton(): ReactElement {
  const [count, setCount] = useState(0);
  return (
    <p className="paper-card pointer-events-auto fixed right-3 top-24 z-40 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={() => {
          void (async () => {
            const list = demoMemories(DEMO_SEED);
            for (const memory of list) {
              await useJournalStore.getState().addMemory(memory);
            }
            setCount(list.length);
          })();
        }}
        className="min-h-11 text-left"
      >
        生成演示数据{count > 0 ? "（" + String(count) + " 条）" : ""}
      </button>
    </p>
  );
}
