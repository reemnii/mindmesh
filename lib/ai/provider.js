import "server-only";
import { generateJSON as generateGeminiJSON, AnalysisError } from "./gemini";
import { generateGroqJSON, getGroqModel, GroqError } from "./groq";

export { AnalysisError } from "./gemini";

export function getProviderConfig() {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "gemini";
  if (provider !== "gemini" && provider !== "groq") {
    throw new AnalysisError("AI_PROVIDER must be either gemini or groq. No provider was called.", 500, "INVALID_PROVIDER");
  }
  return { provider, model: provider === "groq" ? getGroqModel() : process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash" };
}

export async function generateJSON(options) {
  const { provider } = getProviderConfig();
  if (provider === "gemini") return generateGeminiJSON(options);
  try {
    // Retry only this stage when rate-limited; never switch providers.
    return await generateGroqJSON(options);
  } catch (error) {
    if (!(error instanceof GroqError)) throw error;
    const safeError = new AnalysisError(error.message, error.status, error.code);
    safeError.retryAfterSeconds = error.retryAfterSeconds;
    safeError.providerMessage = error.providerMessage;
    safeError.providerHttpStatus = error.providerHttpStatus;
    safeError.providerCode = error.providerCode;
    throw safeError;
  }
}
