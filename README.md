MindMesh uses the official `@google/genai` SDK on the server. Research, Strategy, Creative, and Critic run sequentially with distinct instructions and validated JSON schemas. A fifth Gemini call creates the consolidated report. No generated results are mocked.

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

Run `npm run lint`, `node --test tests/schemas.test.mjs`, and `npm run build` to check the implementation. Hosting must allow long requests (the route requests a 300-second duration; platform limits still apply). Before exposing the endpoint publicly, apply access controls and usage limits appropriate to your deployment, since each analysis makes five billable model calls and provider retries can add calls.

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
