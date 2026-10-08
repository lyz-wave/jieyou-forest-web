/**
 * 四个接口共用的回话方式：成功 { ok: true, data }，其余一律 { ok: false, reason }。
 * 三种失败分得很清楚——400 是前端给的形状不对，503 是这台机器还没配 Key，
 * 502 是模型那边没给出合用的结果。三种前端都走同一句降级文案。
 *
 * 这里没有一行日志：用户写的话是隐私，不进日志。
 */
export function jsonResponse(status: number, payload: unknown): Response {
  return Response.json(payload, { status });
}

export function serve(data: unknown): Response {
  return jsonResponse(200, { ok: true, data });
}

export function invalid(): Response {
  return jsonResponse(400, { ok: false, reason: "invalid" });
}

export function unavailable(): Response {
  return jsonResponse(503, { ok: false, reason: "unavailable" });
}

export function upstream(): Response {
  return jsonResponse(502, { ok: false, reason: "upstream" });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

/** 跑一次模型调用：抛错、返回 null 都是 502，绝不让异常漏到 Next 的日志里 */
export async function runAi<T>(call: () => Promise<T | null>): Promise<Response> {
  try {
    const data = await call();
    if (data === null) return upstream();
    return serve(data);
  } catch {
    return upstream();
  }
}
