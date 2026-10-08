import { getServerAI } from "@/lib/ai/server";
import { invalid, readJson, runAi, unavailable } from "@/lib/ai/route";
import { readRiskText } from "@/lib/ai/request";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const text = readRiskText(body);
  if (!text) return invalid();
  const ai = getServerAI();
  if (!ai) return unavailable();
  return runAi(() => ai.risk(text));
}
