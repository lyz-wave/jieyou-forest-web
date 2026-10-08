"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { devToolsEnabled } from "@/lib/dev";
import { DemoDataButton } from "./DemoDataButton";
import { GameContextTray } from "./GameContextTray";

/**
 * 开发工具的入口：开发服务器里默认出现，生产构建里带 ?dev=1 才出现。
 * 地址走 useSyncExternalStore：服务端只知道空地址，客户端拿到真实地址后
 * React 自己会重新渲染，不需要在 effect 里 setState。
 */
const subscribe = (): (() => void) => () => {};
const getSearch = (): string => window.location.search;
const getServerSearch = (): string => "";

export function DevTools(): ReactElement | null {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  if (!devToolsEnabled(search, process.env.NODE_ENV)) return null;
  return (
    <>
      <GameContextTray />
      <DemoDataButton />
    </>
  );
}
