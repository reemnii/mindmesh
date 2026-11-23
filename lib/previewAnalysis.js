/**
 * Sample analysis used only to preview the interface.
 * Replace this module with Gemini calls when the API is connected.
 */
export function buildPreviewAnalysis(problem) {
  const subject = problem.trim().replace(/\s+/g, " ");

  return {
    outputs: {
      research: `The brief asks for more than a single answer. The useful material is the tension inside it: who the decision is for, what must stay unresolved, and which constraints are real. A first pass would gather the stated goal, the people affected, and two or three comparable cases that faced a similar split between clarity and disagreement.\n\nSource brief: “${truncate(subject, 180)}”`,
      strategy: `Sequence the work in three moves. First, name the decision that actually has to be made. Second, separate facts the group already shares from claims that are still contested. Third, choose one next action that a real person can take this week, and say what would count as progress.\n\nTradeoff: a tighter recommendation is easier to act on, and it can hide a viewpoint the group still needs.`,
      creative: `Treat the workspace as a table with four chairs, not a funnel into one voice. One option is a short “split brief”: a shared paragraph, then a column for each agent that is allowed to disagree in public. Another is a one-page map that shows where the agents converge and where they refuse to.\n\nThe distinctive move is to keep the disagreement on the page instead of smoothing it into a generic summary.`,
      critic: `The main risk is false consensus. A polished consolidated report can look finished while the underlying evidence is still thin. Check that each recommendation names its assumption, and that the critic’s objections are still visible after the report is written.\n\nIf every agent agrees in the same tone, the analysis is probably under-specified.`,
    },
    report: {
      reading:
        "The problem is not a lack of ideas. It is that several legitimate readings are competing, and collapsing them too early would make the result sound confident and generic.",
      path: "Hold a shared reading first, then a recommended next step, and leave the open disagreements attached to the report rather than deleting them.",
      questions: [
        "Which decision has to be made now, and which can stay open?",
        "Whose viewpoint is easiest to erase in a summary?",
        "What evidence would change the recommended path?",
      ],
    },
  };
}

function truncate(value, length) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}…`;
}
