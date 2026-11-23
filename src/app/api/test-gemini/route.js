import "server-only";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 90;

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
const headers = { "Cache-Control": "no-store" };

// Keep diagnostics useful without returning credentials, headers, or stacks.
function redact(value, apiKey) {
  let text = String(value ?? "");
  for (const secret of [apiKey, process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY]) {
    if (secret) {
      text = text.split(secret).join("[REDACTED]");
      text = text.split(encodeURIComponent(secret)).join("[REDACTED]");
    }
  }
  return text
    .replace(/AIza[\w-]+/g, "[REDACTED]")
    .replace(/([?&](?:key|api_key)=)[^\s&"']+/gi, "$1[REDACTED]")
    .slice(0, 4000);
}

export async function POST(request) {
  const started = Date.now();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel = process.env.GEMINI_MODEL?.trim() || null;
  const metadata = { model: MODEL, configuredModel };
  if (!apiKey) {
    return Response.json({ ok: false, ...metadata, error: { httpStatus: 503, googleHttpStatus: null, message: "GEMINI_API_KEY is missing from the server environment. Set it in the root .env.local and restart Next.js." } }, { status: 503, headers });
  }

  try {
    // One plain text call, with no agent prompts, schemas, or automatic retries.
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: "Reply with one short sentence confirming you received this connectivity test.",
      config: {
        maxOutputTokens: 1024,
        httpOptions: { timeout: 60000, retryOptions: { attempts: 1 } },
        abortSignal: request.signal,
      },
    });
    const text = response.text;
    const finishReason = response.candidates?.[0]?.finishReason || null;
    if (!text?.trim()) {
      return Response.json({ ok: false, ...metadata, elapsedMs: Date.now() - started, finishReason, error: { httpStatus: 502, googleHttpStatus: 200, message: "Google responded without text.", blockReason: response.promptFeedback?.blockReason || null } }, { status: 502, headers });
    }
    return Response.json({ ok: true, ...metadata, elapsedMs: Date.now() - started, text: redact(text, apiKey), finishReason }, { headers });
  } catch (error) {
    // SDK ApiError.message commonly contains Google's JSON error envelope.
    let googleError;
    try { googleError = JSON.parse(error.message)?.error; } catch { /* Network errors are plain text. */ }
    const candidateStatus = Number(error.status || googleError?.code);
    const googleHttpStatus = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus <= 599 ? candidateStatus : null;
    const timedOut = /timeout|timed out/i.test(`${error.name} ${error.message} ${error.cause?.message}`);
    const httpStatus = googleHttpStatus || (timedOut ? 504 : request.signal.aborted ? 499 : 502);
    return Response.json({
      ok: false,
      ...metadata,
      elapsedMs: Date.now() - started,
      error: {
        httpStatus,
        googleHttpStatus,
        googleStatus: googleError?.status ? redact(googleError.status, apiKey) : null,
        name: redact(error.name || "Error", apiKey),
        message: redact(googleError?.message || error.message || "Gemini request failed.", apiKey),
        networkCode: error.cause?.code ? redact(error.cause.code, apiKey) : null,
        cause: error.cause?.message ? redact(error.cause.message, apiKey) : null,
      },
    }, { status: httpStatus, headers });
  }
}
