"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const ForestApp = dynamic(() => import("@/components/forest/ForestApp").then((module) => module.ForestApp), {
  ssr: false,
  loading: () => <main className="fixed inset-0 flex items-center justify-center bg-cream"><p role="status" className="text-lg text-ink-soft">森林正在醒来…</p></main>,
});

export default function Home(): ReactElement {
  return <ForestApp />;
}
