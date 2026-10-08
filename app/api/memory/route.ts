import { getServerAI } from "@/lib/ai/server";
import { invalid, readJson, runAi, unavailable } from "@/lib/ai/route";
import { readContext } from "@/lib/ai/request";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const context = readContext(body);
  if (!context) return invalid();
  const ai = getServerAI();
  if (!ai) return unavailable();
  return runAi(() => ai.memory(context));
}
