# CV Hapi: project and launch review

Prepared 29 September 2026 for external review. Start here; some research and pilot documents describe earlier stages. This guide distinguishes implemented behavior from planned commercial work.

## Product and intended audience

CV Hapi helps job seekers in North Macedonia create an English or Macedonian CV without signing up, or improve an existing CV against a vacancy. The live free pilot is at https://cv-hapi.quara0n.chatgpt.site/en/ (Macedonian: `/mk/`). Earlier files use the former name Čekor.

The commercial hypothesis is a NOK 10 one-time purchase. The current test implementation sells one AI review; the free builder and ordinary PDF stay free. Willingness to pay and the choice of paid benefit are not validated. Free alternatives such as Europass and local builders are strong competitors.

## Feature inventory

| Feature | Current behavior | Important limit |
| --- | --- | --- |
| CV builder | Three designs, live preview, editable sections, Unicode PDF export | No signup; optional browser persistence is device-local |
| Languages | English and Macedonian interface and document headings | Does not translate the candidate's own text |
| Cover letter | Editable fixed template using supplied evidence and motivation | Not an automatically invented work history |
| Application export | CV and cover letter combined in one PDF | User must check final content |
| Existing CV import | Browser extraction of PDF, DOCX and TXT | 5 MB; PDF up to 12 pages; no OCR or original-layout preservation |
| Local document checks | Rules and word matching | Not an ATS score |
| AI review | DeepSeek feedback against optional vacancy, source-quoted suggestions, explicit individual acceptance | Consent required; factual and language errors remain possible |
| Revised export | Editable revised text, simple PDF and TXT | Creates a new text layout |
| Payments | Server-created Stripe test Checkout, signed webhook, payment state, single-use entitlement and refund requests | Disabled; rejects live keys; no real checkout verified |
| Analytics | Consent-gated GA4 events and separately consented, masked Clarity recording | Synthetic ingestion checks are not real customer evidence |

## Architecture and reading order

The client is vanilla JavaScript with Vite. A Cloudflare-compatible Worker handles AI and payments; D1/SQLite holds the lifetime AI quota and opaque payment state. Drizzle migrations are additive. Hosting uses Sites.

1. `README.md`: setup and product summary.
2. `src/main.js`, `src/model.js`, `src/i18n.js`: builder, data model and language copy.
3. `src/application*.js`, `src/pdf.js`, `src/document-import.js`: application and document flows.
4. `src/review-core.js`, `src/review-ui.js`, `worker/index.js`, `AI-REVIEW.md`: review UX, server validation and quota.
5. `worker/payments.js`, `src/payment-ui.js`, `db/schema.js`, `drizzle/`, `PAYMENTS.md`: test payment implementation and launch blockers.
6. `src/telemetry*.js`, `src/google-measurement.js`, `src/clarity-measurement.js`, `GROWTH-AND-ANALYTICS.md`: consent and measurement.
7. `tests/`: automated regression coverage; provider calls are mocked.
8. `SEARCH-DEMAND-MK.md`, `MARKET-RESEARCH.md`, `PILOT.md`: demand evidence, assumptions and earlier plans.

Run with Node 22+: `npm ci`, `npm run dev`, `npm test`, `npm run build`. Local Vite deliberately reports AI unavailable. Real credentials belong only in server environment settings. Do not point test payment traffic at the public pilot.

## Data and spending boundaries

Imports are read locally. With explicit per-review consent, displayed CV text, vacancy and requested language go through the server to DeepSeek. The app does not persist CVs or AI replies in D1. This also creates recovery limitations for paid reviews. Review the third-party processing disclosures separately from local storage behavior.

The owner authorized ten lifetime AI attempts, including tests and failures. The server atomically reserves attempts and hard-caps the allowance at ten. Remaining production allowance has not been checked today; public use can consume it. Do not reset it for testing.

The Google Ads pilot has a maximum of NOK 300 total, including currency/fee margin, with no automatic increase or recurring continuation. The existing Ads account uses AUD. A daily budget is not a hard total cap. No campaign launch is established by this repository.

## Verification on 29 September 2026

All 27 automated tests passed, and the production build succeeded on the source used for this snapshot. The first sandboxed run failed because esbuild could not read parent directories; rerunning outside that sandbox resolved it. The build still warns about a large PDF-library chunk. No real AI or Stripe calls were made for this verification.

## Evidence and uncertainty

The prior session recorded a successful v9 public deployment, fictional-data import/PDF checks, one real AI review in an earlier session, masked synthetic Clarity ingestion and GA realtime ingestion. These live service claims have not been independently repeated on 29 September. They do not establish customers, sales, native-language quality or willingness to pay.

Keyword Planner research contains actual ranges, not unique people or guaranteed clicks. English advertising in North Macedonia tests a subset of the audience; Macedonian was absent from Google's supported advertising-language list at the prior check. Historical Macedonian ad drafts are not approved launch copy.

## Proposed sequence after review

1. Review the product's useful paid benefit and economics. Test the complete flow with local users and a native Macedonian speaker. Resolve serious usability, accessibility, factual-preservation and privacy findings.
2. Secure `cvhapi.com` if still available and connect it to the existing Site. The earlier one-year cart quote was EUR 19.50 before final login/tax checks; current availability, total and renewal are unverified. Update canonical URLs, consent/analytics hostname configuration, sitemap and Search Console after connection.
3. Complete owner Stripe onboarding and merchant information. Test Checkout, webhook retries, cancellation, concurrent redemption and refunds in an isolated environment. Bank/identity details must come from the owner.
4. Before charging customers, reserve capacity before checkout; handle lost cookies, overlapping purchases, interrupted reviews and lost successful replies; add unattended refund reconciliation. Resolve support, tax, consumer terms and refund policy. Only then implement and verify live payment mode deliberately.
5. Prepare a small Google Search pilot for North Macedonia with truthful English copy and landing page, narrow matching and conversion measurement. Verify a hard NOK-equivalent total bound before activation. Do not use synthetic sessions or PDF events as purchase revenue.
6. Evaluate actual funnel completion, payment conversion, refunds and acquisition cost before expanding. Do not raise the AI cap, ad spend or price without an owner decision.

## Requested reviewer output

Please assess the source and plan and return:

- The most important bugs or launch blockers, with file references and reproducible examples.
- Whether one AI review is a credible paid benefit at NOK 10, compared with free alternatives.
- Privacy, payment correctness, capacity and recovery risks, especially where the current test design needs to change.
- UX and Macedonian-language issues, clearly separating verified findings from matters requiring a native speaker or real device.
- A prioritized recommendation: what to fix before domain/paid launch/Ads, what can follow later, and whether to run the acquisition test at all.

This repository is a review snapshot. It excludes private session handoffs, credentials, local browser evidence, generated output and original Git history. Public availability does not grant a separate software license; no license has been selected by the owner.


