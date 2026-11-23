const text = { type: "string", minLength: 1 };
const list = { type: "array", items: text, minItems: 1 };

export function objectSchema(properties) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

export const researchSchema = objectSchema({ coreProblem: text, rootCauses: list, context: list, opportunities: list, assumptions: list, risks: list, missingInformation: list });
export const strategySchema = objectSchema({ objectives: list, prioritizedSteps: list, requiredResources: list, expectedOutcomes: list, successMetrics: list });
export const creativeSchema = objectSchema({ innovativeApproaches: { ...list, minItems: 3, maxItems: 3 }, unconventionalOpportunities: list, solutionIdeas: list, strategyImprovements: list });
export const criticSchema = objectSchema({ weakAssumptions: list, contradictions: list, unrealisticRecommendations: list, missingConsiderations: list, improvements: list });
export const reportSchema = objectSchema({ reading: text, path: text, keyInsights: list, recommendations: list, questions: list });

export function validate(value, schema) {
  if (schema.type === "string") return typeof value === "string" && value.trim().length > 0;
  if (schema.type === "array") return Array.isArray(value) && value.length >= (schema.minItems || 0) && (!schema.maxItems || value.length <= schema.maxItems) && value.every((item) => validate(item, schema.items));
  return value !== null && typeof value === "object" && !Array.isArray(value) && schema.required.every((key) => Object.hasOwn(value, key) && validate(value[key], schema.properties[key])) && Object.keys(value).every((key) => Object.hasOwn(schema.properties, key));
}
