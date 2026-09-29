# Public review snapshot

Start with [REVIEW-GUIDE.md](REVIEW-GUIDE.md) for current features, architecture, launch plan and review questions. Prepared 29 September 2026. Original private history and session handoffs are excluded.

# CV Hapi

English/Macedonian CV pilot for North Macedonia. Live: https://cv-hapi.quara0n.chatgpt.site/en/ (also /mk/).

## Current product

- Free CV builder with three designs, live preview and Unicode PDF export.
- Editable fixed-template cover letter and combined application PDF.
- PDF, DOCX and TXT import, read in the browser (5 MB; PDFs up to 12 pages; CV text up to 20,000 characters). Scans need OCR elsewhere.
- Optional DeepSeek feedback against a job advertisement, exact source quotes and individually accepted wording suggestions.
- Revised text can be edited and downloaded as a clean text-layout PDF or TXT. Uploaded layout is not preserved.
- No signup, subscription, OCR or automatic translation. Everything remains free during this pilot. Stripe test-mode code is implemented but disabled; see PAYMENTS.md for account and launch blockers.

## Run and verify

Node 22+ required. Run `npm ci`, `npm run dev`, `npm test`, `npm run build`.
The Vite preview intentionally reports AI unavailable; the real API runs in the deployed Worker.
On this Windows host esbuild may need execution outside the sandbox due to parent-directory access restrictions.

Build output: `dist/client` for browser assets, `dist/server/index.js` for Worker, and `dist/.openai` for Sites manifest and migrations.

## AI and privacy

See [AI-REVIEW.md](AI-REVIEW.md) for integration and limits. Runtime environment has a secret `DEEPSEEK_API_KEY`, `AI_ENABLED=true` and `AI_MAX_REVIEWS=10`.
The user authorized **10 analyses total including tests**, not per user/day. D1 atomically reserves a slot before each provider call; failures consume a slot. Never reset the counter during deployment or migration.

Files are extracted locally. Only after explicit consent are displayed CV text and vacancy sent through the server to DeepSeek. Our database stores the quota counter and, when payments are enabled, opaque payment IDs/state, not CVs or replies. DeepSeek processes submitted text under its own privacy policy. AI can still make mistakes; user review is essential.

GA4 G-JYTW6J3BRZ uses consent-gated allowlisted events. Enhanced measurement and arbitrary CV properties are disabled. Microsoft Clarity project ypjcjxa0o9 uses separate 18+ recording consent, strict masking and consentv2; a masked synthetic recording was verified live. [GROWTH-AND-ANALYTICS.md](GROWTH-AND-ANALYTICS.md) describes measurement.

## Deployment and continuity

Read the Sites building/hosting skills before publishing. Reuse the project ID in `.openai/hosting.json`; preserve public access. Build and archive the exact pushed source, save a Sites version, deploy and check terminal status. Never create another Site to update this one. Secrets do not belong in browser bundles, source, logs or handoffs.

[LAUNCH-STATUS.md](LAUNCH-STATUS.md) tracks launch integrations. [SEARCH-DEMAND-MK.md](SEARCH-DEMAND-MK.md) contains actual Keyword Planner ranges and caveats. [PILOT.md](PILOT.md) contains the acquisition plan and economics; older documents can retain the former Čekor name. Current brand is CV Hapi.

## Remaining launch gates

cvhapi.mk and cvhapi.com were available at the September 28 check. The .com cart quoted EUR 19.50 for one year before final tax/login. No domain was purchased. Ads have not launched; the user authorized a maximum NOK 300 total pilot. The existing Ads account uses AUD and GMT+10; Macedonian is not a supported targeting language. Do not confuse daily budget with the total spending limit.

Before charging NOK 10, validate value with real users, review Macedonian wording, finish seller/payment onboarding and all commercial launch gates in PAYMENTS.md. Free tools including Europass remain credible competitors; demand and willingness to pay are not proven by a functioning prototype.

## Verification boundary

27 automated tests pass: editing, restore/reset, escaping, analytics consent/allowlisting, review consent and explicit apply, API validation and durable quota. Browser PDF/DOCX import and an actual DeepSeek review were verified with fictional data. Revised PDF download was verified as a readable one-page document. More real-device/mobile and native Macedonian quality checks remain.


