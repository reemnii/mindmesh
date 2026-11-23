import { generateJSON } from "../gemini";
import { criticSchema } from "../schemas";
export function critic(problem, research, strategy, creative, signal) {
  return generateJSON({ systemInstruction: "You are MindMesh's Critic Agent. Independently evaluate the original problem and all three prior outputs. Identify weak assumptions, contradictions, unrealistic recommendations, missing considerations, and specific improvements. Refer to the claims you challenge and explain how to verify or correct them. Do not manufacture objections just to fill a category.", input: { problem, research, strategy, creative }, schema: criticSchema, signal });
}
