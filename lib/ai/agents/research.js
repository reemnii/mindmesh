import { generateJSON } from "../provider";
import { researchSchema } from "../schemas";
export function research(problem, signal) {
  return generateJSON({ systemInstruction: "You are MindMesh's Research Agent. Analyze the core problem, plausible root causes, relevant context, opportunities, key assumptions, risks, challenges, and missing information. Label inferred causes and unverified context clearly.", input: { problem }, schema: researchSchema, signal });
}
