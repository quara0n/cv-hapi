## Purchase modal — 4 October update

New purchases now use a compact purchase modal and cost £2 GBP, as explicitly requested by the owner. Existing EUR purchases retain their recorded currency and entitlement. Migration 0006 records currency; payment validation matches the order currency. The main review button opens the modal, and successful payment still starts the review automatically. All 126 tests passed, including modal open/close without an unpaid AI call and GBP/EUR payment validation. Earlier EUR pricing below is historical.

## 4 October paid-service repair

The user explicitly authorized fixing and reopening the EUR 2 AI review on www.cvhapi.com, superseding the earlier agent-selected pause. See [PAID-REPAIR.md](PAID-REPAIR.md) for checkout reservations, delivery acknowledgement, unattended refunds, sales acceptance and verification boundaries. Sites version 16 successfully deployed runtime revision 9 on 4 October: AI, live payments and checkout enabled, preserved lifetime allowance 100. Both public domains report availability. Live EUR 2 checkout creation, unpaid cancellation/capacity release, invalid webhook rejection and reconciliation were verified without a charge. Historical pause statements below describe version 15. See PAID-REPAIR.md for the sandbox delivery evidence and remaining verification limits.

# CV Hapi

4 October release: shorter copy, guided section editing, Macedonian default, 111 passing tests and successful production build. Free tools are live in Sites version 15. Paid AI remains paused pending delivery/processing recovery and provider/commercial disclosures. Start with [CLAUDE.md](CLAUDE.md), [current handoff](HANDOFF-2026-10-04-launch.md) and [LAUNCH-STATUS.md](LAUNCH-STATUS.md).

English/Macedonian CV product for North Macedonia. Live: https://www.cvhapi.com/ (also /mk/ and /en/). GitHub: https://github.com/quara0n/cv-hapi.

## Current product

- Free CV builder with three designs, live preview and Unicode PDF export.
- Editable fixed-template cover letter and combined application PDF.
- PDF, DOCX and TXT import, read in the browser (5 MB; PDFs up to 12 pages; CV text up to 20,000 characters). Scans need OCR elsewhere.
- Optional DeepSeek feedback against a job advertisement, exact source quotes and individually accepted wording suggestions.
- Section editors for profile, experience, education, skills, languages, contact details and cover letter. Starting drafts use existing text, verified rewrites and user-entered facts. Preview and factual confirmation precede application; ambiguous sections require manual placement. Drafts remain in tab memory until downloaded.
- Compact section cards show one next step, with full assessments/actions behind an info button. Priorities, vacancy comparison, questions and wording comparisons expand on demand. Field info buttons open on hover, keyboard focus or tap and offer optional writing examples; known chiropractor roles get relevant patient-focus and method examples. Choosing an example fills a field only, never applies it directly to the CV. Examples are local templates, not inferred facts or another AI call.
- Each supported section also shows a visible wording idea before opening its editor. Inside, two adaptable phrases can be appended to the draft; bracketed facts must be supplied before applying. Verified AI rewrites have their own Suggested wording heading, with the first two comparisons expanded by default.
- Revised text can be edited and downloaded as a clean text-layout PDF or TXT. Uploaded layout is not preserved.
- No signup, subscription, OCR or automatic translation. Builder/PDF are free; intended AI price is EUR 2 once. Stripe live payment was verified, then paused because AI capacity was nearly exhausted. See the October handoff for current state and PAYMENTS.md for architecture.

## Run and verify

Node 22+ required. Run `npm ci`, `npm run dev`, `npm test`, `npm run build`.
The ordinary Vite server reports AI unavailable. Use `npm run dev:test` for the local site with its real AI backend, or the deployed Worker for hosted operation.
On this Windows host esbuild may need execution outside the sandbox due to parent-directory access restrictions.
The local AI server must also run with outbound network access. A server launched inside the restricted Codex sandbox can serve localhost while DeepSeek connections fail with `EACCES`. Before handing over an AI retry, verify provider connectivity in the same execution context as the server; a localhost availability response only checks configuration and quota.

Build output: `dist/client` for browser assets, `dist/server/index.js` for Worker, and `dist/.openai` for Sites manifest and migrations.

### Local Stripe sandbox and real AI test

Put a Stripe sandbox secret key (`sk_test_` or `rk_test_`) and `DEEPSEEK_API_KEY` in the ignored `.env.local-test` file. Run `node scripts/local-stripe-test.mjs` and open http://localhost:5174/. This separate server uses the existing payment/AI implementation, rejects live Stripe keys, and verifies the test payment through Stripe status polling. No webhook forwarding is needed for this manual test; webhook delivery is not tested by this setup. Keys reload on each API request.

The owner authorized unlimited local reviews. `LOCAL_TEST_UNLIMITED_REVIEWS=true` requires owner-credit/repair flags, loopback requests and Stripe sandbox credentials; hosted/live requests retain their configured limit. Attempts remain recorded in ignored `test-output/local-stripe-test.sqlite`. Do not delete the database or reset the hosted counter for more attempts. Public AI/purchases remain paused. Test card: `4242 4242 4242 4242`, future expiry, three-digit CVC; never a real card. Consent only after checking the exact submitted text.

Completed-review commentary follows the selected interface language through DeepSeek translation cached in the current tab. Original CV text, evidence quotations, proposed rewrites and user drafts remain unchanged. Translation requires consent and a used paid entitlement or guarded local owner access; it counts toward provider attempt limits without another Stripe purchase.

Reviews use generation, editorial audit for extensive feedback and factual/language checks within a shared deadline. Owner-credit tests do not verify checkout/webhooks.

## AI and privacy

See [AI-REVIEW.md](AI-REVIEW.md) for integration and limits. Version 15 uses environment revision 8 with `AI_ENABLED=false`, `PAYMENTS_ENABLED=false`, `CHECKOUT_ENABLED=false` and the existing hosted allowance. The earlier unsafe pending revision was superseded. Secrets are in ignored local/runtime configuration, never browser bundles.
The hosted pilot remains capped at ten reserved reviews; later unlimited authorization applies only to guarded local owner testing. D1 atomically reserves a slot before each provider call; failures consume a slot. Never reset the counter during deployment or migration.

Files are extracted locally. Only after explicit consent are displayed CV text and vacancy sent through the server to DeepSeek. Our database stores the quota counter and, when payments are enabled, opaque payment IDs/state, not CVs or replies. DeepSeek processes submitted text under its own privacy policy. AI can still make mistakes; user review is essential.

GA4 G-JYTW6J3BRZ uses consent-gated allowlisted events and `cekor_pdf_generated` is a key event. Microsoft Clarity project ypjcjxa0o9 uses separate 18+ recording consent, strict masking and consentv2. Custom-domain tracking is deployed; both dashboards showed the synthetic launch session. Fresh replay masking still needs inspection; a masked synthetic recording was verified on the earlier host. A daily 07:00 Oslo Codex report includes metrics and fix/experiment/wait recommendations. [GROWTH-AND-ANALYTICS.md](GROWTH-AND-ANALYTICS.md) describes coverage and limitations.

## Deployment and continuity

Read the Sites building/hosting skills before publishing. Reuse the project ID in `.openai/hosting.json`; preserve public access. Build and archive the exact pushed source, save a Sites version, deploy and check terminal status. Never create another Site to update this one. Secrets do not belong in browser bundles, source, logs or handoffs.

[LAUNCH-STATUS.md](LAUNCH-STATUS.md) tracks launch integrations. [SEARCH-DEMAND-MK.md](SEARCH-DEMAND-MK.md) contains actual Keyword Planner ranges and caveats. [PILOT.md](PILOT.md) contains the acquisition plan and economics; older documents can retain the former Čekor name. Current brand is CV Hapi.

## Remaining launch gates

cvhapi.com has been purchased and connected. Support is support@cvhapi.com via forwarding, rather than a new Gmail account. Ads have not launched; the user authorized a maximum NOK 300 total pilot. The existing Ads account uses AUD and GMT+10; Macedonian is not a supported targeting language. Do not confuse daily budget with the total spending limit.

Before reopening EUR 2 checkout, resolve capacity/result recovery and commercial disclosures. [TERMS-OF-SALE-DRAFT.md](TERMS-OF-SALE-DRAFT.md) is unpublished and needs owner review, seller address, cancellation disclosures and VAT assessment. Provider processing terms remain unresolved. Free tools including Europass remain credible competitors; demand and willingness to pay are not proven by a functioning prototype.

## Verification boundary

4 October: all 111 tests and production build pass. TXT/DOCX fixtures, real PDF upload/downloads, Cyrillic/multi-page PDFs, section apply/undo, consent and checkout/reset races checked. Desktop and 390-pixel browser layouts inspected; physical-device and native Macedonian editorial quality remain unverified. Version 15 is deployed. Real hosted Stripe/webhooks and paid interrupted-delivery recovery remain open. [LAUNCH-STATUS.md](LAUNCH-STATUS.md) records boundaries.
