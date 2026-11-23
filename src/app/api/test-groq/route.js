import { generateGroqJSON, getGroqModel, GroqError, redactGroq } from "@/lib/ai/groq";
import { objectSchema } from "@/lib/ai/schemas";

export const maxDuration = 90;
const headers = { "Cache-Control": "no-store" };
const schema = objectSchema({ message: { type: "string", minLength: 1 } });

export async function POST(request) {
  const started = Date.now();
  const metadata = { provider: "groq", model: redactGroq(getGroqModel()) };
  try {
    const output = await generateGroqJSON({
      systemInstruction: "You are testing API connectivity. Return a JSON object with a message containing one short greeting.",
      input: { prompt: "Say hello in one short sentence." },
      schema,
      signal: request.signal,
      maxRetries: 0,
      retryInvalidResponse: false,
      retryRateLimits: false,
    });
    return Response.json({ ok: true, ...metadata, output, elapsedMs: Date.now() - started }, { headers });
  } catch (error) {
    const known = error instanceof GroqError;
    const status = known ? error.status : 500;
    return Response.json({ ok: false, ...metadata, elapsedMs: Date.now() - started, error: { httpStatus: status, providerHttpStatus: known ? error.providerHttpStatus || null : null, code: known ? error.code : "INTERNAL_ERROR", message: known ? error.message : "Groq connectivity test failed.", providerMessage: known ? error.providerMessage || null : null, retryAfterSeconds: known ? error.retryAfterSeconds || null : null } }, { status, headers: { ...headers, ...(known && error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : {}) } });
  }
}
