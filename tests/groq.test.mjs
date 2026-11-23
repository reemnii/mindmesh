import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Exercise the server code and real SDK with a controlled HTTP transport.
const modules = new Map();
async function load(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  let source = (await readFile(url, "utf8")).replace('import "server-only";', "");
  for (const match of [...source.matchAll(/from "([^"]+)"/g)]) {
    const specifier = match[1];
    const resolved = specifier.startsWith("@/")
      ? await load(new URL(`../${specifier.slice(2)}.js`, import.meta.url))
      : specifier.startsWith(".")
        ? await load(new URL(specifier.endsWith(".js") ? specifier : `${specifier}.js`, url))
        : import.meta.resolve(specifier);
    source = source.replace(`from "${specifier}"`, `from "${resolved}"`);
  }
  const resolved = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  modules.set(url.href, resolved);
  return resolved;
}
const { POST: testGroq } = await import(await load(new URL("../src/app/api/test-groq/route.js", import.meta.url)));
const { POST: analyze } = await import(await load(new URL("../src/app/api/analyze/route.js", import.meta.url)));
const { withGroqRateLimitRetry } = await import(await load(new URL("../lib/ai/groq.js", import.meta.url)));

function configure(t) {
  for (const [key, value] of Object.entries({ GROQ_API_KEY: "gsk_test-secret", GROQ_MODEL: "openai/gpt-oss-20b", AI_PROVIDER: "groq" })) {
    const before = process.env[key];
    process.env[key] = value;
    t.after(() => { if (before === undefined) delete process.env[key]; else process.env[key] = before; });
  }
  t.mock.method(console, "warn", () => {});
}
function completion(output, finishReason = "stop") {
  return Response.json({ id: "test", object: "chat.completion", model: "openai/gpt-oss-20b", choices: [{ index: 0, finish_reason: finishReason, message: { role: "assistant", content: typeof output === "string" ? output : JSON.stringify(output) } }] });
}
const request = () => new Request("http://localhost/api/test-groq", { method: "POST" });
const analysisRequest = () => new Request("http://localhost/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: "test" }) });

const researchOutput = { coreProblem: "test", rootCauses: ["cause"], context: ["context"], opportunities: ["opportunity"], assumptions: ["assumption"], risks: ["risk"], missingInformation: ["question"] };
const strategyOutput = { objectives: ["objective"], prioritizedSteps: ["step"], requiredResources: ["resource"], expectedOutcomes: ["outcome"], successMetrics: ["metric"], researchInfluences: [{ researchFinding: "Research context, item 1: context", decision: "Prioritized step 1 addresses this context" }] };
const creativeOutput = { innovativeApproaches: ["approach one", "approach two", "approach three"], unconventionalOpportunities: ["opportunity"], solutionIdeas: ["idea"], strategyImprovements: ["improvement"], strategyComparisons: [1, 2, 3].map((index) => ({ strategyRecommendation: "Strategy prioritizedSteps, item 1: step", creativeApproach: `Approach ${index}`, improvement: "A distinct improvement to validate" })) };
const criticOutput = { weakAssumptions: ["assumption"], contradictions: ["contradiction"], unrealisticRecommendations: ["recommendation"], missingConsiderations: ["consideration"], improvements: ["improvement"], specificCorrections: [{ priorClaim: "Strategy successMetrics, item 1: metric", weakness: "The baseline is not known", correction: "Measure baseline first" }] };
const reportOutput = {
  executiveSummary: "Test decision summary",
  problemDiagnosis: "Test diagnosis",
  keyResearchFindings: ["Research context item 1: user-provided context"],
  recommendedSolution: "A proposed solution",
  alternativeApproaches: ["A distinct alternative"],
  implementationRoadmap: [{ phase: "Pilot", timeframe: "Proposed weeks 1–2", owner: "Coordinator", actions: ["Validate assumptions"], milestone: "Review pilot evidence" }],
  resourcesAndBudget: [{ category: "Staff", resources: "Coordinator time", estimate: "Not yet costed", basis: "Confirm available hours and local quotes" }],
  risksAndMitigations: [{ risk: "Low participation", mitigation: "Validate demand before expanding" }],
  ethicalAndPrivacyConsiderations: ["Obtain consent and minimize retained data"],
  successMetrics: [{ metric: "Participation", baseline: "Baseline unknown", proposedTarget: "Set after baseline measurement", measurement: "Count consented participation weekly" }],
  criticRecommendations: ["Verify the participation assumption before launch"],
  evidence: { verifiedInformation: [], providedInformation: ["User-provided context"], assumptions: ["Demand is unverified"], proposedTargets: ["Pilot timing is proposed"] },
  contradictionsAndTradeoffs: [{ issue: "Speed versus validation", resolution: "Pilot first", remainingTradeoff: "Expansion depends on pilot evidence" }],
};

function schemaFailure() {
  return Response.json({ error: { message: "Generated JSON does not match the expected schema: missing strategyImprovements", code: "json_validate_failed", type: "invalid_request_error", failed_generation: "PRIVATE_UNVALIDATED_OUTPUT" } }, { status: 400 });
}

test("standalone Groq endpoint makes exactly one strict JSON request and reports provider/model", async (t) => {
  configure(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return completion({ message: "A real parsed test greeting" }); });
  const response = await testGroq(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.provider, "groq");
  assert.equal(body.model, "openai/gpt-oss-20b");
  assert.deepEqual(body.output, { message: "A real parsed test greeting" });
  assert.equal(calls.length, 1);
  assert.match(String(calls[0].url), /api\.groq\.com/);
  assert.equal(calls[0].body.response_format.json_schema.strict, true);
});

test("standalone endpoint refuses malformed, mismatched, and truncated responses", async (t) => {
  configure(t);
  for (const [output, finish, code] of [["{", "stop", "INVALID_RESPONSE"], [{ message: " " }, "stop", "INVALID_RESPONSE"], [{ unexpected: "field" }, "stop", "INVALID_RESPONSE"], [{ message: "cut off" }, "length", "INCOMPLETE_RESPONSE"]]) {
    const transport = t.mock.method(globalThis, "fetch", async () => completion(output, finish));
    const response = await testGroq(request());
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, code);
    assert.equal(body.output, undefined);
    transport.mock.restore();
  }
});

test("missing Groq key fails without a network call", async (t) => {
  configure(t);
  delete process.env.GROQ_API_KEY;
  const transport = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network call"); });
  const response = await testGroq(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "MISSING_API_KEY");
  assert.equal(transport.mock.calls.length, 0);
});

test("Groq error diagnostics redact keys and honor Retry-After without hidden retries", async (t) => {
  configure(t);
  const warnings = [];
  t.mock.method(console, "warn", (...args) => warnings.push(args));
  const transport = t.mock.method(globalThis, "fetch", async () => Response.json({ error: { message: `rate limited ${process.env.GROQ_API_KEY}`, type: "rate_limit_error" } }, { status: 429, headers: { "Retry-After": "10" } }));
  const response = await testGroq(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "10");
  const body = await response.json();
  assert.match(body.error.providerMessage, /REDACTED/);
  assert.equal(JSON.stringify(body).includes(process.env.GROQ_API_KEY), false);
  assert.equal(JSON.stringify(warnings).includes(process.env.GROQ_API_KEY), false);
  assert.equal(transport.mock.calls.length, 1);
});

test("Groq pipeline preserves Research when Strategy fails and never falls back to Gemini", async (t) => {
  configure(t);
  const research = { coreProblem: "test", rootCauses: ["cause"], context: ["context"], opportunities: ["opportunity"], assumptions: ["assumption"], risks: ["risk"], missingInformation: ["question"] };
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(String(url));
    return urls.length === 1 ? completion(research) : Response.json({ error: { message: "busy" } }, { status: 503 });
  });
  const response = await analyze(new Request("http://localhost/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: "test" }) }));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.provider, "groq");
  assert.equal(body.error.stage, "strategy");
  assert.deepEqual(body.outputs, { research });
  assert.equal(body.report, null);
  assert.equal(urls.length, 2);
  assert.equal(urls.every((url) => url.includes("api.groq.com")), true);
});

test("unsupported provider is rejected instead of silently selecting a provider", async (t) => {
  configure(t);
  process.env.AI_PROVIDER = "invalid";
  const transport = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network call"); });
  const response = await analyze(new Request("http://localhost/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: "test" }) }));
  assert.equal((await response.json()).error.code, "INVALID_PROVIDER");
  assert.equal(transport.mock.calls.length, 0);
});

test("Creative schema failure keeps Research and Strategy, reports nested error, and never runs Critic", async (t) => {
  configure(t);
  const bodies = [];
  const warnings = [];
  t.mock.method(console, "warn", (...args) => warnings.push(args));
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return bodies.length === 1 ? completion(researchOutput) : bodies.length === 2 ? completion(strategyOutput) : schemaFailure();
  });
  const response = await analyze(analysisRequest());
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.error.stage, "creative");
  assert.equal(body.error.code, "SCHEMA_VALIDATION_FAILED");
  assert.equal(body.error.providerHttpStatus, 400);
  assert.equal(body.error.providerCode, "json_validate_failed");
  assert.match(body.error.providerMessage, /missing strategyImprovements/);
  assert.deepEqual(body.outputs, { research: researchOutput, strategy: strategyOutput });
  assert.equal(body.report, null);
  assert.equal(bodies.length, 4);
  for (const creativeRequest of bodies.slice(2)) {
    const schema = creativeRequest.response_format.json_schema.schema;
    assert.equal(creativeRequest.response_format.json_schema.strict, true);
    assert.equal(schema.properties.innovativeApproaches.minItems, 3);
    assert.equal(schema.properties.innovativeApproaches.maxItems, 3);
    assert.match(creativeRequest.messages[0].content, /exactly three distinct innovative approaches/);
    assert.match(creativeRequest.messages[0].content, /JSON Schema:/);
    assert.deepEqual(JSON.parse(creativeRequest.messages[1].content), { problem: "test", research: researchOutput, strategy: strategyOutput });
  }
  assert.equal(JSON.stringify(body).includes("PRIVATE_UNVALIDATED_OUTPUT"), false);
  assert.equal(JSON.stringify(warnings).includes("PRIVATE_UNVALIDATED_OUTPUT"), false);
});

test("Creative recovers with one new validated generation, then Critic and report run", async (t) => {
  configure(t);
  const replies = [() => completion(researchOutput), () => completion(strategyOutput), schemaFailure, () => completion(creativeOutput), () => completion(criticOutput), () => completion(reportOutput)];
  let calls = 0;
  const bodies = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return replies[calls++]();
  });
  const response = await analyze(analysisRequest());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.outputs.creative, creativeOutput);
  assert.deepEqual(body.outputs.critic, criticOutput);
  assert.deepEqual(body.report, reportOutput);
  assert.deepEqual(body.outputs.research, researchOutput);
  assert.deepEqual(body.outputs.strategy, strategyOutput);
  assert.deepEqual(JSON.parse(bodies.at(-1).messages[1].content), {
    problem: "test", research: researchOutput, strategy: strategyOutput,
    creative: creativeOutput, critic: criticOutput,
  });
  assert.equal(bodies.at(-1).max_completion_tokens, 8192);
  assert.equal(bodies.at(-1).reasoning_effort, "low");
  assert.equal(bodies[0].max_completion_tokens, 4096);
  assert.equal(calls, 6);
});

test("two approaches are still rejected after bounded regeneration", async (t) => {
  configure(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return calls === 1 ? completion(researchOutput) : calls === 2 ? completion(strategyOutput) : completion({ ...creativeOutput, innovativeApproaches: ["one", "two"] });
  });
  const response = await analyze(analysisRequest());
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(body.error.stage, "creative");
  assert.equal(body.error.code, "INVALID_RESPONSE");
  assert.deepEqual(body.outputs, { research: researchOutput, strategy: strategyOutput });
  assert.equal(calls, 4);
});

test("token-limit errors have useful sanitized diagnostics and no schema regeneration", async (t) => {
  configure(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ error: { message: "Request too large for org_private-account: token limit 8000", code: "rate_limit_exceeded" } }, { status: 413 });
  });
  const response = await analyze(analysisRequest());
  const body = await response.json();
  assert.equal(response.status, 413);
  assert.equal(body.error.code, "TOKEN_LIMIT");
  assert.match(body.error.message, /token or request-size limit/);
  assert.match(body.error.providerMessage, /8000/);
  assert.equal(body.error.providerMessage.includes("org_private-account"), false);
  assert.equal(calls, 1);
});

test("429 retries use exponential jitter and stop after three retries", async (t) => {
  configure(t);
  const waits = [];
  let calls = 0;
  await assert.rejects(withGroqRateLimitRetry(async () => {
    calls++;
    throw Object.assign(new Error("limited"), { status: 429, headers: new Headers() });
  }, { model: "test" }, { sleep: async (ms) => waits.push(ms), random: () => 0.5 }), { status: 429 });
  assert.equal(calls, 4);
  assert.deepEqual(waits, [1500, 3000, 6000]);
});

test("Groq cooldown is respected and cancellation prevents another attempt", async (t) => {
  configure(t);
  const waits = [];
  let calls = 0;
  assert.equal(await withGroqRateLimitRetry(async () => {
    if (++calls === 1) throw Object.assign(new Error("limited"), { status: 429, headers: new Headers({ "retry-after": "10" }) });
    return "recovered";
  }, { model: "test" }, { sleep: async (ms) => waits.push(ms), random: () => 0 }), "recovered");
  assert.deepEqual(waits, [10000]);
  const controller = new AbortController();
  calls = 0;
  await assert.rejects(withGroqRateLimitRetry(async () => {
    calls++;
    throw Object.assign(new Error("limited"), { status: 429 });
  }, { model: "test", signal: controller.signal }, { sleep: async () => controller.abort() }), { name: "AbortError" });
  assert.equal(calls, 1);
});

test("rate-limited Critic resumes without rerunning successful agents", async (t) => {
  configure(t);
  const requests = [];
  const replies = [() => completion(researchOutput), () => completion(strategyOutput), () => completion(creativeOutput), () => Response.json({ error: { message: "temporary token limit", code: "rate_limit_exceeded" } }, { status: 429, headers: { "Retry-After": "0.1" } }), () => completion(criticOutput), () => completion(reportOutput)];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return replies[requests.length - 1]();
  });
  const response = await analyze(analysisRequest());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.outputs, { research: researchOutput, strategy: strategyOutput, creative: creativeOutput, critic: criticOutput });
  assert.deepEqual(body.report, reportOutput);
  assert.equal(requests.length, 6);
  assert.deepEqual(requests[3], requests[4]);
});

test("long cooldown returns failure with completed outputs rather than retrying early", async (t) => {
  configure(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return calls === 1 ? completion(researchOutput) : calls === 2 ? completion(strategyOutput) : calls === 3 ? completion(creativeOutput) : Response.json({ error: { message: "daily limit", code: "rate_limit_exceeded" } }, { status: 429, headers: { "Retry-After": "120" } });
  });
  const response = await analyze(analysisRequest());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "120");
  const body = await response.json();
  assert.deepEqual(body.outputs, { research: researchOutput, strategy: strategyOutput, creative: creativeOutput });
  assert.equal(body.error.stage, "critic");
  assert.equal(calls, 4);
});

