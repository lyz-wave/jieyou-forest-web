/* **/
/* * 翻面镜（阿橘）的收藏与记录。*/
/* * 没收藏任何一句就不产生 gameContext（规格里明确要求）。*/
/* */

import { REFRAME_LABELS, type ReframeVersion } from "@/lib/ai/types";

/* 同一种版本只留一句：点同一句取消，点同种类的另一句就替换*/
export function toggleCollection(
  collected: readonly ReframeVersion[],
  version: ReframeVersion,
): ReframeVersion[] {
  const sameOne = collected.some((item) => item.kind === version.kind && item.text === version.text);
  if (sameOne) {
    return collected.filter((item) => !(item.kind === version.kind && item.text === version.text));
  }
  return [...collected.filter((item) => item.kind !== version.kind), version];
}

export function flipMirrorContext(
  thought: string,
  collected: readonly ReframeVersion[],
): string | null {
  if (collected.length === 0) return null;
  const parts = collected.map((item) => REFRAME_LABELS[item.kind] + "：" + item.text);
  return "原来的想法：" + thought + "；收藏的说法：" + parts.join("；");
}