import { getServerAI } from "@/lib/ai/server";
import { invalid, limitReached, readJson, runAi, unavailable } from "@/lib/ai/route";
import { readContext } from "@/lib/ai/request";

export async function POST(request: Request): Promise<Response> {
  const limited = limitReached(request);
  if (limited) return limited;
  const body = await readJson(request);
  const context = readContext(body);
  if (!context) return invalid();
  const ai = getServerAI();
  if (!ai) return unavailable();
  return runAi(() => ai.roundtable(context));
}
