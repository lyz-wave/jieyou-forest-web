import { getServerAI } from "@/lib/ai/server";
import { invalid, readJson, runAi, unavailable } from "@/lib/ai/route";
import { readContext, readTarget } from "@/lib/ai/request";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const context = readContext(body);
  const target = readTarget(body);
  if (!context || !target) return invalid();
  const ai = getServerAI();
  if (!ai) return unavailable();
  return runAi(() => ai.reply({ ...context, target }));
}
