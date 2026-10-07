/* **/
/* * 藏坚果（跳跳）的选择与记录：把愿意尝试的小步骤放进树洞，点「就这些」收尾。*/
/* */

export const EMPTY_HOARD_HINT = "挑一颗最小的试试？";
export const ENCOURAGE_ONE = "一颗也很好，先啃下这一颗。";

export function canFinish(selected: readonly string[]): boolean {
  return selected.length > 0;
}

export function toggleStep(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  return [...selected, id];
}

export function encourageLine(steps: readonly string[]): string {
  if (steps.length === 0) return EMPTY_HOARD_HINT;
  if (steps.length === 1) return ENCOURAGE_ONE;
  return "藏了 " + steps.length + " 颗，今天就先啃最小的一颗。";
}

export function hideNutsContext(topic: string, steps: readonly string[]): string | null {
  if (steps.length === 0) return null;
  return "让人焦虑的事：" + topic + "；愿意尝试的小步骤：" + steps.join("、");
}