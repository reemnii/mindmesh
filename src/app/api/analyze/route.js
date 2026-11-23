import { analyze } from "@/lib/ai/analyze";
import { AnalysisError } from "@/lib/ai/gemini";

export const maxDuration = 300;
const headers = { "Cache-Control": "no-store" };

export async function POST(request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: { message: "Send an application/json request." } }, { status: 415, headers });
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 24000) return Response.json({ error: { message: "Request body is too large." } }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch { return Response.json({ error: { message: "Request body must be valid JSON." } }, { status: 400, headers }); }
  if (typeof body?.problem !== "string" || !body.problem.trim() || body.problem.trim().length > 10000) return Response.json({ error: { message: "Provide a problem between 1 and 10,000 characters." } }, { status: 400, headers });
  try {
    return Response.json(await analyze(body.problem.trim(), request.signal), { headers });
  } catch (error) {
    const known = error instanceof AnalysisError;
    const retryAfterSeconds = known ? error.retryAfterSeconds : null;
    return Response.json({ provider: known ? error.provider || null : null, model: known ? error.model || null : null, outputs: known ? error.outputs || {} : {}, report: null, error: { message: known ? error.message : "Analysis failed. Please retry.", code: known ? error.code : "INTERNAL_ERROR", stage: known ? error.stage : null, retryAfterSeconds: retryAfterSeconds || null, providerMessage: known ? error.providerMessage || null : null, providerHttpStatus: known ? error.providerHttpStatus || null : null, providerCode: known ? error.providerCode || null : null } }, { status: known ? error.status : 500, headers: { ...headers, ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}) } });
  }
}
