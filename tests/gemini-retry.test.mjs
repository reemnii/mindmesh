import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { retryAfterMs, withGeminiRetry } from "../lib/ai/retry.js";

function providerError(status, message = "Temporarily unavailable") {
  return Object.assign(new Error(JSON.stringify({ error: { code: status, message } })), { status });
}

function dependencies() {
  const waits = [];
  const logs = [];
  return { waits, logs, sleep: async (ms) => { waits.push(ms); }, random: () => 0.5, log: (entry) => logs.push(entry) };
}

for (const status of [429, 503]) {
  test(`${status}: exactly three retries with exponential backoff and jitter`, async () => {
    const deps = dependencies();
    let calls = 0;
    await assert.rejects(withGeminiRetry(async () => { calls++; throw providerError(status); }, { model: "test-model" }, deps), { status, retryAfterSeconds: 30 });
    assert.equal(calls, 4);
    assert.deepEqual(deps.waits, [1500, 3000, 6000]);
    assert.equal(deps.logs.length, 4);
    assert.equal(deps.logs[0].httpStatus, status);
  });
}

test("a successful retry returns the actual operation result", async () => {
  const deps = dependencies();
  let calls = 0;
  const result = await withGeminiRetry(async () => { if (++calls < 3) throw providerError(503); return { text: "recovered" }; }, { model: "test-model" }, deps);
  assert.deepEqual(result, { text: "recovered" });
  assert.equal(calls, 3);
});

test("Retry-After supports seconds, dates, invalid values, and expired dates", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");
  assert.equal(retryAfterMs("12", now), 12000);
  assert.equal(retryAfterMs("Thu, 01 Jan 2026 00:00:20 GMT", now), 20000);
  assert.equal(retryAfterMs("Wed, 31 Dec 2025 23:59:00 GMT", now), 0);
  for (const invalid of [null, "", " ", "invalid", "-1"]) assert.equal(retryAfterMs(invalid, now), null);
});

test("Retry-After is a minimum delay and is reset between attempts", async () => {
  const deps = dependencies();
  let calls = 0;
  await withGeminiRetry(async (capture) => {
    calls++;
    if (calls === 1) { capture(new Response(null, { headers: { "Retry-After": "10" } })); throw providerError(429); }
    if (calls === 2) throw providerError(503);
    return "ok";
  }, { model: "test-model" }, deps);
  assert.deepEqual(deps.waits, [10000, 3000]);
});

test("long Retry-After hints return immediately without retrying early", async () => {
  const deps = dependencies();
  let calls = 0;
  await assert.rejects(withGeminiRetry(async (capture) => {
    calls++;
    capture(new Response(null, { headers: { "Retry-After": "120" } }));
    throw providerError(503);
  }, { model: "test-model" }, deps), { status: 503, retryAfterSeconds: 120 });
  assert.equal(calls, 1);
  assert.deepEqual(deps.waits, []);
});

test("permanent errors are logged but never retried, with keys redacted", async () => {
  const deps = dependencies();
  const apiKey = "test-secret/key";
  const message = `bad key ${apiKey} ${encodeURIComponent(apiKey)} https://example.test?key=other-secret AIzaFakeSecret`;
  await assert.rejects(withGeminiRetry(async () => { throw providerError(403, message); }, { model: "test-model", apiKey }, deps), { status: 403 });
  const serialized = JSON.stringify(deps.logs);
  for (const secret of [apiKey, encodeURIComponent(apiKey), "other-secret", "AIzaFakeSecret"]) assert.equal(serialized.includes(secret), false);
  assert.equal(deps.logs[0].model, "test-model");
  assert.deepEqual(deps.waits, []);
});

test("cancellation during backoff prevents another provider call", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(withGeminiRetry(async () => { calls++; throw providerError(503); }, { model: "test-model", signal: controller.signal }, {
    ...dependencies(), sleep: async () => { controller.abort(); },
  }), { name: "AbortError" });
  assert.equal(calls, 1);
});

// Load the unchanged server modules in Node without Next's bundler. Only the
// server-only marker is removed; the real installed Google SDK is used below.
const modules = new Map();
async function loadServerModule(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  let source = (await readFile(url, "utf8")).replace('import "server-only";', "");
  for (const match of [...source.matchAll(/from "([^"]+)"/g)]) {
    const specifier = match[1];
    let replacement;
    if (specifier.startsWith("@/")) {
      replacement = await loadServerModule(new URL(`../${specifier.slice(2)}.js`, import.meta.url));
    } else if (specifier.startsWith(".")) {
      replacement = await loadServerModule(new URL(`${specifier.endsWith(".js") ? specifier : `${specifier}.js`}`, url));
    } else {
      replacement = import.meta.resolve(specifier);
    }
    source = source.replace(`from "${specifier}"`, `from "${replacement}"`);
  }
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  modules.set(url.href, moduleUrl);
  return moduleUrl;
}

test("real SDK + pipeline preserve research when strategy fails, with no SDK retry duplication", async (t) => {
  const { analyze } = await import(await loadServerModule(new URL("../lib/ai/analyze.js", import.meta.url)));
  const keyBefore = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key-never-sent-to-google";
  t.after(() => { if (keyBefore === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = keyBefore; });
  const research = { coreProblem: "test problem", rootCauses: ["cause"], context: ["context"], opportunities: ["opportunity"], assumptions: ["assumption"], risks: ["risk"], missingInformation: ["question"] };
  const requests = [];
  const logs = [];
  t.mock.method(console, "warn", (...args) => logs.push(args));
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(research) }] }, finishReason: "STOP" }] });
    return Response.json({ error: { code: 503, status: "UNAVAILABLE", message: "high demand" } }, { status: 503, headers: { "Retry-After": "120" } });
  });
  await assert.rejects(analyze("test problem"), (error) => {
    assert.equal(error.stage, "strategy");
    assert.equal(error.status, 503);
    assert.equal(error.code, "PROVIDER_UNAVAILABLE");
    assert.equal(error.retryAfterSeconds, 120);
    assert.deepEqual(error.outputs, { research });
    return true;
  });
  assert.equal(requests.length, 2);
  const strategyInput = JSON.parse(requests[1].contents[0].parts[0].text);
  assert.deepEqual(strategyInput.research, research);
  assert.equal(logs.length, 1);
  assert.equal(JSON.stringify(logs).includes(process.env.GEMINI_API_KEY), false);
});

test("API forwards 429 cooldown while preserving completed outputs and omitting a report", async (t) => {
  const { POST } = await import(await loadServerModule(new URL("../src/app/api/analyze/route.js", import.meta.url)));
  const keyBefore = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key-never-sent-to-google";
  t.after(() => { if (keyBefore === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = keyBefore; });
  const research = { coreProblem: "test", rootCauses: ["cause"], context: ["context"], opportunities: ["opportunity"], assumptions: ["assumption"], risks: ["risk"], missingInformation: ["question"] };
  let calls = 0;
  t.mock.method(console, "warn", () => {});
  t.mock.method(globalThis, "fetch", async () => {
    if (++calls === 1) return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(research) }] }, finishReason: "STOP" }] });
    return Response.json({ error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "quota reached" } }, { status: 429, headers: { "Retry-After": "120" } });
  });
  const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: "test" }) }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "120");
  const body = await response.json();
  assert.deepEqual(body.outputs, { research });
  assert.equal(body.report, null);
  assert.equal(body.error.stage, "strategy");
  assert.equal(body.error.code, "RATE_LIMITED");
  assert.equal(body.error.retryAfterSeconds, 120);
  assert.match(body.error.message, /Please wait/);
  assert.equal(calls, 2);
});
