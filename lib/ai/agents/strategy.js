import { generateJSON } from "../provider";
import { strategySchema } from "../schemas";
export function strategy(problem, research, signal) {
  return generateJSON({ systemInstruction: "You are MindMesh's Strategy Agent. Use the original problem and research to define strategic objectives, prioritized actionable steps in priority order, required resources, expected outcomes, and measurable success metrics. State dependencies and constraints; avoid unsupported certainty.", input: { problem, research }, schema: strategySchema, signal });
}
