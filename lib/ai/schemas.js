const text = { type: "string", minLength: 1 };
const list = { type: "array", items: text, minItems: 1 };

export function objectSchema(properties) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}
const records = (properties, maxItems = 5) => ({ type: "array", items: objectSchema(properties), minItems: 1, maxItems });

export const researchSchema = objectSchema({ coreProblem: text, rootCauses: list, context: list, opportunities: list, assumptions: list, risks: list, missingInformation: list });
export const strategySchema = objectSchema({ objectives: list, prioritizedSteps: list, requiredResources: list, expectedOutcomes: list, successMetrics: list, researchInfluences: records({ researchFinding: text, decision: text }) });
export const creativeSchema = objectSchema({ innovativeApproaches: { ...list, minItems: 3, maxItems: 3 }, unconventionalOpportunities: list, solutionIdeas: list, strategyImprovements: list, strategyComparisons: { ...records({ strategyRecommendation: text, creativeApproach: text, improvement: text }, 3), minItems: 3 } });
export const criticSchema = objectSchema({ weakAssumptions: list, contradictions: list, unrealisticRecommendations: list, missingConsiderations: list, improvements: list, specificCorrections: { ...records({ priorClaim: text, weakness: text, correction: text }), minItems: 0 } });
export const reportSchema = objectSchema({
  executiveSummary: text,
  problemDiagnosis: text,
  keyResearchFindings: list,
  recommendedSolution: text,
  alternativeApproaches: list,
  implementationRoadmap: records({ phase: text, timeframe: text, owner: text, actions: list, milestone: text }, 4),
  resourcesAndBudget: records({ category: text, resources: text, estimate: text, basis: text }, 6),
  risksAndMitigations: records({ risk: text, mitigation: text }),
  ethicalAndPrivacyConsiderations: list,
  successMetrics: records({ metric: text, baseline: text, proposedTarget: text, measurement: text }),
  criticRecommendations: list,
  evidence: objectSchema({
    verifiedInformation: { ...list, minItems: 0 },
    providedInformation: list,
    assumptions: list,
    proposedTargets: list,
  }),
  contradictionsAndTradeoffs: { ...records({ issue: text, resolution: text, remainingTradeoff: text }), minItems: 0 },
});

export function validate(value, schema) {
  if (schema.type === "string") return typeof value === "string" && value.trim().length > 0;
  if (schema.type === "array") return Array.isArray(value) && value.length >= (schema.minItems || 0) && (!schema.maxItems || value.length <= schema.maxItems) && value.every((item) => validate(item, schema.items));
  return value !== null && typeof value === "object" && !Array.isArray(value) && schema.required.every((key) => Object.hasOwn(value, key) && validate(value[key], schema.properties[key])) && Object.keys(value).every((key) => Object.hasOwn(schema.properties, key));
}
