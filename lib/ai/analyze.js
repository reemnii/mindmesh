import "server-only";
import { research } from "./agents/research";
import { strategy } from "./agents/strategy";
import { creative } from "./agents/creative";
import { critic } from "./agents/critic";
import { generateJSON, AnalysisError, getProviderConfig } from "./provider";
import { reportSchema } from "./schemas";
import { reportInstructions } from "./reportInstructions";

export async function analyze(problem, signal) {
  const outputs = {};
  let stage = "research";
  let config = {};
  try {
    config = getProviderConfig();
    outputs.research = await research(problem, signal);
    stage = "strategy";
    outputs.strategy = await strategy(problem, outputs.research, signal);
    stage = "creative";
    outputs.creative = await creative(problem, outputs.research, outputs.strategy, signal);
    stage = "critic";
    outputs.critic = await critic(problem, outputs.research, outputs.strategy, outputs.creative, signal);
    stage = "report";
    const report = await generateJSON({ systemInstruction: reportInstructions, input: { problem, ...outputs }, schema: reportSchema, signal, maxOutputTokens: 8192, reasoningEffort: "low" });
    return { ...config, outputs, report };
  } catch (error) {
    const safeError = error instanceof AnalysisError ? error : new AnalysisError("Analysis could not be completed. Please retry.");
    safeError.stage = stage;
    safeError.outputs = outputs;
    safeError.provider = config.provider || null;
    safeError.model = config.model || null;
    throw safeError;
  }
}
