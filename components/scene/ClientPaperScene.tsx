"use client";

import dynamic from "next/dynamic";

/**
 * 场景依赖本地时间、视口尺寸和设备能力，只在客户端渲染。
 * 服务端只输出米白纸色底，避免水合不一致。
 */
export const ClientPaperScene = dynamic(() => import("./PaperScene").then((m) => m.PaperScene), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-cream" aria-hidden />,
});
