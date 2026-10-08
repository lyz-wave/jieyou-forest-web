import { AI_FAILURE_LINE } from "./types";

/** 只用到 fetch 的这一点点形状，测试里换成一个数调用次数的假函数就行 */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface Envelope {
  ok: boolean;
  data?: unknown;
}

export function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export interface PostOptions {
  fetch?: FetchLike;
  signal?: AbortSignal;
}

/**
 * 往自家接口 POST 一次，只认 { ok: true, data } 这一种回话。
 * 没连上、服务端说不行、形状对不上，都只给用户同一句话；只有「是自己取消的」原样抛出去。
 */
export async function postJson<T>(
  path: string,
  body: unknown,
  parse: (value: unknown) => T | null,
  options: PostOptions = {},
): Promise<T> {
  const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  try {
    const response = await doFetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    });
    if (!response.ok) throw new Error(AI_FAILURE_LINE);
    const envelope = (await response.json()) as Envelope | null;
    const parsed = envelope && envelope.ok ? parse(envelope.data) : null;
    if (!parsed) throw new Error(AI_FAILURE_LINE);
    return parsed;
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new Error(AI_FAILURE_LINE);
  }
}
