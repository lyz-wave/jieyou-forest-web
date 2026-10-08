import { BREAKDOWN_MAX } from "@/lib/ai/types";
import { readText } from "@/lib/ai/request";
import { invalid, limitReached, readJson, runAi, unavailable } from "@/lib/ai/route";
import { getServerAI } from "@/lib/ai/server";

export async function POST(request: Request): Promise<Response> {
  const limited = limitReached(request);
  if (limited) return limited;
  const body = await readJson(request);
  const text = readText(body, BREAKDOWN_MAX);
  if (!text) return invalid();
  const ai = getServerAI();
  if (!ai) return unavailable();
  return runAi(() => ai.breakDown(text));
}
