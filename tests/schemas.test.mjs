import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/ai/schemas.js", import.meta.url), "utf8");
const schemas = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

function validValue(schema) {
  if (schema.type === "string") return "A test value";
  if (schema.type === "array") return Array.from({ length: schema.minItems }, () => validValue(schema.items));
  return Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, validValue(value)]));
}

test("all agent and report schemas reject missing fields, wrong types, and unexpected keys", () => {
  for (const schema of [schemas.researchSchema, schemas.strategySchema, schemas.creativeSchema, schemas.criticSchema, schemas.reportSchema]) {
    const valid = validValue(schema);
    assert.equal(schemas.validate(valid, schema), true);
    const first = schema.required[0];
    const missing = { ...valid };
    delete missing[first];
    for (const invalid of [null, [], {}, missing, { ...valid, [first]: 123 }, { ...valid, unexpected: "value" }]) assert.equal(schemas.validate(invalid, schema), false);
  }
});

test("creative output requires exactly three nonblank approaches", () => {
  const valid = validValue(schemas.creativeSchema);
  for (const approaches of [[], ["one", "two"], ["one", "two", "three", "four"], ["one", "two", "  "], ["one", "two", {}]]) assert.equal(schemas.validate({ ...valid, innovativeApproaches: approaches }, schemas.creativeSchema), false);
});
