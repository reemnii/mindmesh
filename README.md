MindMesh uses the official `@google/genai` and `groq-sdk` packages on the server. Research, Strategy, Creative, and Critic run sequentially with distinct instructions and validated JSON schemas. A fifth call to the same provider creates the consolidated report. No generated results are mocked. Set `AI_PROVIDER=gemini` or `AI_PROVIDER=groq`; omitting it keeps Gemini as the default. There is no automatic provider fallback, and responses and the dashboard identify the selected provider and model.

## Groq setup and testing

Set these values in the root `.env.local`, keeping any existing Gemini settings:

```dotenv
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
```

Restart `npm run dev`, then make an isolated connectivity test:

```powershell
curl.exe -i -X POST http://localhost:3000/api/test-groq
```

This endpoint makes exactly one real Groq completion request with SDK retries disabled. It uses strict JSON Schema output and validates the parsed result. A successful response includes `ok: true`, `provider: "groq"`, the actual model, and `output.message`. Errors include a safe message, provider HTTP status/message when available, and a `Retry-After` cooldown when supplied. No API keys or raw response headers are returned. The endpoint always tests Groq regardless of `AI_PROVIDER`; remove `src/app/api/test-groq/route.js` afterward if it is no longer needed.

The model ID `openai/gpt-oss-20b` was verified against Groq's [supported models](https://console.groq.com/docs/models), [free-plan limits](https://console.groq.com/docs/rate-limits), and [strict structured-output support](https://console.groq.com/docs/structured-outputs), as well as the configured account's live model list. The standalone endpoint succeeded before the full analysis pipeline was connected. Free-tier quotas and model permissions still apply to your account.

After the connectivity test succeeds, use the existing Analyze button or POST `{ "problem": "your challenge" }` to `/api/analyze`. Each completed agent output is returned separately; a failure stops later stages and retains only validated completed outputs. Set `AI_PROVIDER=gemini` and restart to use Gemini again. Existing agent prompt text and the Gemini utility are unchanged by provider selection.

Groq receives the full JSON Schema as an explicit output instruction as well as native strict structured output. Live requests have intermittently returned HTTP 400 `json_validate_failed` with required properties missing, despite strict mode. Only schema/JSON validation failures allow one fresh generation with the same model, full input, agent responsibilities, and unchanged schema. SDK retries remain disabled, and `/api/test-groq` still makes one request. Rate limits, token-limit errors, and authentication failures are not treated as schema failures. API errors include sanitized `providerHttpStatus`, `providerCode`, and `providerMessage`, which the frontend displays. Nested SDK error envelopes are parsed without exposing `failed_generation`, credentials, raw headers, or stacks; organization IDs are redacted.

For Groq HTTP 429 responses, analysis waits for `Retry-After` (seconds or HTTP date), using exponential backoff with jitter as a minimum, then retries only the current stage up to three times. The retry budget is shared across that stage's schema regeneration. Completed stages are not rerun. Cooldowns over 60 seconds return immediately with the retry hint rather than retrying early; cancellations stop pending waits. The standalone diagnostic disables rate-limit retries as well as schema regeneration.

## Gemini setup and testing

1. Run `npm install`.
2. Create `.env.local` in the repository root with `GEMINI_API_KEY=your_key`. Optionally set `GEMINI_MODEL` (default: `gemini-3.8-flash`). `.env.example` lists these settings. Never use a `NEXT_PUBLIC_` prefix for the key.
3. Run `npm run dev`, open http://localhost:3000, enter a problem, and click Analyze with MindMesh. Requests send the problem and prior agent outputs to Google. Analysis can take several minutes.
4. Inspect the separate agent sections and consolidated report. A failed call stops later stages, returns only validated completed outputs, and displays the failed stage with an error. No partial report is presented as complete.

To call the API from PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/analyze -Method Post -ContentType 'application/json' -Body '{"problem":"How can a small community library increase attendance with a limited budget?"}'
```

The JSON response contains `outputs.research`, `outputs.strategy`, `outputs.creative`, `outputs.critic`, and `report`. Errors contain `error.message`, `error.code`, and `error.stage` when applicable, plus completed outputs. Blank or oversized problems return 400; invalid JSON returns 400; unsupported content types return 415. Removing the server key and restarting produces 503, with no agent marked completed. Exhausted Gemini quota returns 429 after bounded retries; transient 503 responses are also retried. Provider details and credentials are never returned to the browser.

Server modules are in `lib/ai/`, with one module per agent in `lib/ai/agents/`. The route is `src/app/api/analyze/route.js`; the original app directory was moved into `src/app` because Next.js ignores `src/app` when a root `app` exists. The frontend retains its existing design. Research is model analysis, without live web retrieval.

Gemini 429 and 503 responses get at most three retries after the initial call, with exponential backoff and randomized jitter. SDK retries are explicitly disabled to prevent duplicate attempts. `Retry-After` seconds and HTTP dates are respected as minimum delays. Hints requiring more than 60 seconds return immediately with the cooldown rather than retrying early. The API forwards the cooldown in `Retry-After` and `error.retryAfterSeconds`. Completed agent outputs remain visible when a later stage fails. Server logs include model, HTTP status, sanitized error message, attempt, and retry delay; API keys are redacted. The temporary `/api/test-gemini` diagnostic intentionally keeps its single-call behavior.

Run `npm run lint`, `node --test tests/schemas.test.mjs tests/gemini-retry.test.mjs tests/groq.test.mjs`, and `npm run build` to check the implementation. Provider tests use controlled transports with the real SDKs and make no external API calls. Hosting must allow long requests (the route requests a 300-second duration; platform limits still apply). Before exposing the endpoint publicly, apply access controls and usage limits appropriate to your deployment, since each analysis makes five model calls and provider retries can add calls.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
