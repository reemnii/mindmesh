import { generateJSON } from "../gemini";
import { creativeSchema } from "../schemas";
export function creative(problem, research, strategy, signal) {
  return generateJSON({ systemInstruction: "You are MindMesh's Creative Agent. Build on the original problem, research, and strategy. Propose exactly three distinct innovative approaches, unconventional opportunities, concrete product or solution ideas, and improvements to the strategy. Explain each approach's value and a practical experiment to test it.", input: { problem, research, strategy }, schema: creativeSchema, signal });
}
