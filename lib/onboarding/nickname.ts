export const NICKNAME_MAX = 12;

export function isValidNickname(value: string): boolean {
  return value.trim().length > 0;
}

/** 按字符截断（emoji 等代理对算一个字） */
export function clampNickname(value: string): string {
  return Array.from(value).slice(0, NICKNAME_MAX).join("");
}
