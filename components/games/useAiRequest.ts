"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AiOptions } from "@/lib/ai/types";

export type AiStatus = "idle" | "thinking" | "ready" | "failed";

export interface AiRequest<T> {
  status: AiStatus;
  result: T | null;
  error: Error | null;
  /** 发一次请求；正在想的时候再点会被忽略（防重复提交） */
  run(text: string): Promise<void>;
  /** 拿上一次的输入再试一次 */
  retry(): Promise<void>;
  reset(): void;
}

/**
 * 把「一段输入到 AI 结果」包成可以直接渲染的状态。
 * 输入原文由游戏自己保管，所以失败后输入不会丢，重试直接复用上一次的输入。
 */
export function useAiRequest<T>(call: (text: string, options: AiOptions) => Promise<T>): AiRequest<T> {
  const [status, setStatus] = useState<AiStatus>("idle");
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const callRef = useRef(call);
  const lastText = useRef<string | null>(null);
  const running = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);

  const send = useCallback(async (text: string): Promise<void> => {
    if (running.current) return;
    running.current = true;
    lastText.current = text;
    const current = new AbortController();
    controller.current = current;
    setStatus("thinking");
    setError(null);
    try {
      const value = await callRef.current(text, { signal: current.signal });
      if (!alive.current || current.signal.aborted) return;
      setResult(value);
      setStatus("ready");
    } catch (cause) {
      if (!alive.current || current.signal.aborted) return;
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      setStatus("failed");
    } finally {
      running.current = false;
    }
  }, []);

  const run = useCallback((text: string): Promise<void> => send(text), [send]);

  const retry = useCallback((): Promise<void> => {
    const text = lastText.current;
    if (text === null) return Promise.resolve();
    return send(text);
  }, [send]);

  const reset = useCallback(() => {
    lastText.current = null;
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, run, retry, reset };
}
