# CV Hapi release status — 4 October 2026

The existing site is online at https://cvhapi.com/. This audited update is local and has not been deployed. The production build is prepared in `dist/`. Public AI reviews and purchases were confirmed paused through their public configuration endpoints on 4 October.

## Verified in this audit

- Regression suite: 110 passing tests. Production build succeeds; English/Macedonian pages, Worker and migrations are present. Browser assets pass a credential-pattern scan. Exact build hashes: `test-output/launch-build-manifest.json`.
- Browser: builder steps, required-name validation, design selection, cover-letter drafting/factual confirmation, real PDF upload, AI consent, section editing/application/undo, revised PDF download, privacy dialog and analytics decline. English/Macedonian desktop and 390-pixel mobile layouts inspected without document-wide overflow in checked views.
- Real DeepSeek review of a fictional PDF: six sections, five priorities, 15 section recommendations and two verified wording changes. Original preserved. Local owner test without a Stripe charge; not evidence of production reliability or editorial quality for every CV.
- PDFs: three templates, Cyrillic characters, six-page long CV and two-page combined application rendered and inspected. Browser builder/revised downloads found and fictional names extracted successfully.
- TXT/DOCX fixtures cover Unicode, malformed input, unsupported type and size/text limits. Real PDF extraction exercised in browser. Scanned and over-12-page PDF rejection not exercised here.
- Paid failures tested with SQLite/mocked transports: empty/overview-only output, provider/audit failure and timeout persist confirmed refunds, including pending POST followed by refund GET. Not evidence of new real Stripe checkout or deployed webhook delivery.

## Repairs

Builder-to-review text retains section headings in both document languages. Checkout rejects overlapping requests during focus/status refresh. Clearing/resetting are blocked during active reviews. Reopened editors discard stale preview approvals while retaining drafts. Paid output must include its section report before consuming the purchase. File-reading progress no longer claims AI is reviewing before consent. Unsupported section advice directs users to the full-document editor. Headlines, prompts and cover-letter instructions are shorter; privacy disclosures remain intact.

Eight code-review lenses and independent validation confirmed five repaired defects and two remaining paid-release defects. Receipt: `test-output/ce-code-review-launch/review.json`. Subsequent import/PDF/refund tests supersede some receipt testing gaps.

## Release decision

Free builder, cover-letter template, local checks and exports have a passing local release candidate. A free-tools-only update can be published after reviewing this build and applying safe environment settings. Keep `AI_ENABLED=false`, `PAYMENTS_ENABLED=false`, `CHECKOUT_ENABLED=false`; preserve the database/quota. Do not implicitly apply the pending environment revision: it contains enabled AI/live payment values. Reuse Sites project `appgprj_6abaa69cdd2481918fe51468917d695c`.

Paid AI launch is **not ready**. Requirements:

1. Fence paid processing with a lease and reconcile interrupted attempts with idempotent refunds, including unattended recovery. Current processing orders can remain stuck.
2. Recover lost successful responses without another charge/provider call, or implement acknowledged delivery with bounded refund recovery. Current purchases are consumed before delivery. Do not silently store CV/results: the product promises no server storage of document text or responses.
3. Resolve DeepSeek retention/deletion, training use, processing and international transfers; see `API-PRIVACY.md`. An operator flag does not verify contracts.
4. Finalize seller address, VAT treatment and consumer terms in `TERMS-OF-SALE-DRAFT.md` before checkout.
5. Verify hosted Stripe signatures/retries, refunds and return flow in sandbox, then deliberately enable a bounded commercial release. Reserve paid capacity before checkout; local unlimited tests do not change hosted limits.

## Publish verification

Save the exact source/build through Sites. Preserve public access/domain/D1. Exclude env files, test databases and test documents. Verify language routes, PDF import/export, safe AI/payment status, assets, migrations and analytics consent after deployment. Roll back if checks fail. This audit did not publish, commit, push, change hosted secrets or launch ads.

## Existing integrations

Support: support@cvhapi.com. GA4: `G-JYTW6J3BRZ`, consent-gated allowlisted events. Clarity: `ypjcjxa0o9`, separate adult recording consent/masking. Prior analytics/Search Console verification is historical; this audit does not prove current ingestion or ranking. Advertising remains on hold. Prior authorization: NOK 300 total; discovered Ads account uses AUD and Macedonian is not a supported targeting language. No spend initiated here.


## 4 October Macedonian user walkthrough

Computer-use walkthrough completed a fictional administrative assistant CV through all builder steps and a free one-page classic green PDF. A second fictional warehouse applicant TXT and job advert were uploaded through the UI and reviewed by real DeepSeek: six sections, six priorities, 15 recommendations and eight vacancy comparisons. Profile compose/check/apply, source preservation, next-section navigation and revised one-page PDF download worked. Original proposed rewrites (7) were all rejected by factual/language verification (0 delivered); the UI now directs users to section advice/examples when there are no direct replacements. Verification remains strict.

Fixed first-visit UI default to Macedonian (saved English choice and /en/ route retained), Macedonian root prerender/canonical/x-default, field-help accessibility labels and neutral saved-change wording. Added a deterministic guard replacing unsupported numeric quantity examples (including the observed 50 pallets/month) with a real-number placeholder while preserving quotes, document rewrites and known source numbers. This catches covered quantity patterns, not every possible unsupported statement. All 110 tests/build pass; both PDFs rendered and their Cyrillic text extracted and checked. Evidence: test-output/mk-persona-tests.log, mk-persona-build.log, mk-free-cv.pdf, mk-ai-reviewed.pdf and corresponding screenshots/renders. Local-only changes; paid launch gates remain.

Fresh real review after fixes: six sections, five priorities, 17 recommendations, eight vacancy comparisons and two delivered rewrites (9 proposed). Only the contact-label rewrite was applied. A stock-record rewrite introduced an unsupported including-clause; final factual verification now rejects newly introduced including/such-as/вклучувајќи/како-на-пример expansions and its prompt explicitly covers this observed stock-record inference. This is a narrow conservative guard, not a guarantee of factual accuracy. Regression proves the observed expansion is rejected even when the model approves it. Final suite: 110 passing; build and credential scan pass. Final PDF has contact labels and a manually edited grounded profile; unsupported expansion was not applied.
