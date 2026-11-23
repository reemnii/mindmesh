import { setTimeout as delay } from "node:timers/promises";

const MAX_RETRIES = 3;
const MAX_RETRY_WAIT_MS = 60000;

export function redact(value, apiKey) {
  let result = String(value ?? "");
  for (const key of [apiKey, process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY]) {
    if (key) {
      result = result.split(key).join("[REDACTED]");
      result = result.split(encodeURIComponent(key)).join("[REDACTED]");
    }
  }
  return result.replace(/AIza[\w-]+/g, "[REDACTED]")
    .replace(/([?&](?:key|api_key)=)[^\s&"']+/gi, "$1[REDACTED]")
    .slice(0, 4000);
}

export function errorDetails(error) {
  let googleError;
  try { googleError = JSON.parse(error.message)?.error; } catch { /* Plain network error. */ }
  const rawStatus = error.status || googleError?.code || error.code;
  const status = Number(rawStatus) || ({ UNAVAILABLE: 503, RESOURCE_EXHAUSTED: 429 }[rawStatus]) || null;
  return { status, message: googleError?.message || error.message || "Unknown Gemini error" };
}

export function retryAfterMs(value, now = Date.now()) {
  if (value == null || String(value).trim() === "") return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  if (Number.isFinite(seconds)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : null;
}

function readRetryAfter(headers) {
  return typeof headers?.get === "function" ? headers.get("retry-after") : headers?.["retry-after"] ?? headers?.["Retry-After"];
}

export async function withGeminiRetry(operation, { model, apiKey, signal }, {
  sleep = (ms, abortSignal) => delay(ms, undefined, { signal: abortSignal }),
  random = Math.random,
  now = Date.now,
  log = (entry) => console.warn("[Gemini request failed]", entry),
} = {}) {
  for (let retry = 0; ; retry++) {
    signal?.throwIfAborted();
    let retryAfter = null;
    try {
      return await operation((response) => {
        // The SDK's ApiError omits headers; observe them without reading the body.
        retryAfter = readRetryAfter(response.headers);
      });
    } catch (error) {
      const { status, message } = errorDetails(error);
      const providerWait = retryAfterMs(retryAfter ?? readRetryAfter(error.headers || error.response?.headers), now());
      const transient = status === 429 || status === 503;
      const backoff = 1000 * 2 ** retry;
      const wait = Math.max(backoff + Math.floor(random() * backoff), providerWait || 0);
      // Do not retry early or keep an HTTP request open for a very long hint.
      // Instead, return the failure and pass the cooldown back to the caller.
      const shouldRetry = transient && retry < MAX_RETRIES && wait <= MAX_RETRY_WAIT_MS && !signal?.aborted;
      log({ model: redact(model, apiKey), httpStatus: status, message: redact(message, apiKey), attempt: retry + 1, retryDelayMs: shouldRetry ? wait : null });
      if (!shouldRetry) {
        if (transient) error.retryAfterSeconds = Math.max(1, Math.ceil((providerWait ?? 30000) / 1000));
        throw error;
      }
      await sleep(wait, signal);
    }
  }
}
