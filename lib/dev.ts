/**
 * 开发工具（查看 gameContext、模拟 AI 失败）的开关。
 * 开发服务器里默认打开；生产构建里只有带 ?dev=1 才打开——E2E 需要它。
 */
export function devToolsEnabled(search: string, nodeEnv: string): boolean {
  if (nodeEnv === "development") return true;
  return new URLSearchParams(search).get("dev") === "1";
}
