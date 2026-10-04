## Purchase modal — 4 October update

New purchases now use a compact purchase modal and cost £2 GBP, as explicitly requested by the owner. Existing EUR purchases retain their recorded currency and entitlement. Migration 0006 records currency; payment validation matches the order currency. The main review button opens the modal, and successful payment still starts the review automatically. All 126 tests passed, including modal open/close without an unpaid AI call and GBP/EUR payment validation. Earlier EUR pricing below is historical.

## 4 October paid-service repair

The user explicitly authorized fixing and reopening the EUR 2 AI review on www.cvhapi.com, superseding the earlier agent-selected pause. See [PAID-REPAIR.md](PAID-REPAIR.md) for checkout reservations, delivery acknowledgement, unattended refunds, sales acceptance and verification boundaries. Sites version 16 successfully deployed runtime revision 9 on 4 October: AI, live payments and checkout enabled, preserved lifetime allowance 100. Both public domains report availability. Live EUR 2 checkout creation, unpaid cancellation/capacity release, invalid webhook rejection and reconciliation were verified without a charge. Historical pause statements below describe version 15. See PAID-REPAIR.md for the sandbox delivery evidence and remaining verification limits.

# CV Hapi release status — 4 October 2026

The audited free-tools update is live at https://www.cvhapi.com/. Sites version 15 deployed successfully on 4 October, source `f1cd8afce436274fe1227b40b49c23a799211a91`, deployment `appgdep_6ac23c5cec8c81918f5351c59bde6e6e`, environment revision 8. Public AI, purchases and checkout remain paused. The sections below retain the audit trail; this release notice supersedes earlier local-only statements.

## Verified in this audit

- Regression suite: 111 passing tests. Production build succeeds; English/Macedonian pages, Worker and migrations are present. Browser assets pass a credential-pattern scan. Exact build hashes: `test-output/launch-build-manifest.json`.
- Browser: builder steps, required-name validation, design selection, cover-letter drafting/factual confirmation, real PDF upload, AI consent, section editing/application/undo, revised PDF download, privacy dialog and analytics decline. English/Macedonian desktop and 390-pixel mobile layouts inspected without document-wide overflow in checked views.
- Real DeepSeek review of a fictional PDF: six sections, five priorities, 15 section recommendations and two verified wording changes. Original preserved. Local owner test without a Stripe charge; not evidence of production reliability or editorial quality for every CV.
- PDFs: three templates, Cyrillic characters, six-page long CV and two-page combined application rendered and inspected. Browser builder/revised downloads found and fictional names extracted successfully.
- TXT/DOCX fixtures cover Unicode, malformed input, unsupported type and size/text limits. Real PDF extraction exercised in browser. Scanned and over-12-page PDF rejection not exercised here.
- Paid failures tested with SQLite/mocked transports: empty/overview-only output, provider/audit failure and timeout persist confirmed refunds, including pending POST followed by refund GET. Not evidence of new real Stripe checkout or deployed webhook delivery.

## Repairs

Builder-to-review text retains section headings in both document languages. Checkout rejects overlapping requests during focus/status refresh. Clearing/resetting are blocked during active reviews. Reopened editors discard stale preview approvals while retaining drafts. Paid output must include its section report before consuming the purchase. File-reading progress no longer claims AI is reviewing before consent. Unsupported section advice directs users to the full-document editor. Headlines, prompts and cover-letter instructions are shorter; privacy disclosures remain intact.

Eight code-review lenses and independent validation confirmed five repaired defects and two remaining paid-release defects. Receipt: `test-output/ce-code-review-launch/review.json`. Subsequent import/PDF/refund tests supersede some receipt testing gaps.

## Release decision

Free builder, cover-letter template, local checks and exports are published. Safe environment revision 8 explicitly sets `AI_ENABLED=false`, `PAYMENTS_ENABLED=false`, `CHECKOUT_ENABLED=false` and preserves database/quota/secrets; the earlier unsafe pending revision was superseded. Reuse Sites project `appgprj_6abaa69cdd2481918fe51468917d695c`.

Paid AI launch is **not ready**. Requirements:

1. Fence paid processing with a lease and reconcile interrupted attempts with idempotent refunds, including unattended recovery. Current processing orders can remain stuck.
2. Recover lost successful responses without another charge/provider call, or implement acknowledged delivery with bounded refund recovery. Current purchases are consumed before delivery. Do not silently store CV/results: the product promises no server storage of document text or responses.
3. Resolve DeepSeek retention/deletion, training use, processing and international transfers; see `API-PRIVACY.md`. An operator flag does not verify contracts.
4. Finalize seller address, VAT treatment and consumer terms in `TERMS-OF-SALE-DRAFT.md` before checkout.
5. Verify hosted Stripe signatures/retries, refunds and return flow in sandbox, then deliberately enable a bounded commercial release. Reserve paid capacity before checkout; local unlimited tests do not change hosted limits.

## Publish verification

Exact source was pushed to Sites and packaged as 25 build files; public audience/domains/D1 preserved. Secret files, databases and test documents were excluded. Native deployment returned succeeded. Live www root defaults to Macedonian; synthetic consented builder/export showed PDF-ready status without console errors. The browser download-event API timed out, so that particular live file's receipt was not independently verified; earlier local PDFs were downloaded/rendered. GA4 sees the synthetic active visit, PDF generation is a key event, and Clarity shows an active session with Strict masking selected. Fresh replay inspection is still pending. No ads or real charges initiated.

## Existing integrations

Support: support@cvhapi.com. GA4: `G-JYTW6J3BRZ`, consent-gated allowlisted events. Clarity: `ypjcjxa0o9`, separate adult recording consent/masking. Prior analytics/Search Console verification is historical; this audit does not prove current ingestion or ranking. Advertising remains on hold. Prior authorization: NOK 300 total; discovered Ads account uses AUD and Macedonian is not a supported targeting language. No spend initiated here.


## 4 October Macedonian user walkthrough

Computer-use walkthrough completed a fictional administrative assistant CV through all builder steps and a free one-page classic green PDF. A second fictional warehouse applicant TXT and job advert were uploaded through the UI and reviewed by real DeepSeek: six sections, six priorities, 15 recommendations and eight vacancy comparisons. Profile compose/check/apply, source preservation, next-section navigation and revised one-page PDF download worked. Original proposed rewrites (7) were all rejected by factual/language verification (0 delivered); the UI now directs users to section advice/examples when there are no direct replacements. Verification remains strict.

Fixed first-visit UI default to Macedonian (saved English choice and /en/ route retained), Macedonian root prerender/canonical/x-default, field-help accessibility labels and neutral saved-change wording. Added a deterministic guard replacing unsupported numeric quantity examples (including the observed 50 pallets/month) with a real-number placeholder while preserving quotes, document rewrites and known source numbers. This catches covered quantity patterns, not every possible unsupported statement. All 110 tests/build pass; both PDFs rendered and their Cyrillic text extracted and checked. Evidence: test-output/mk-persona-tests.log, mk-persona-build.log, mk-free-cv.pdf, mk-ai-reviewed.pdf and corresponding screenshots/renders. Local-only changes; paid launch gates remain.

Fresh real review after fixes: six sections, five priorities, 17 recommendations, eight vacancy comparisons and two delivered rewrites (9 proposed). Only the contact-label rewrite was applied. A stock-record rewrite introduced an unsupported including-clause; final factual verification now rejects newly introduced including/such-as/вклучувајќи/како-на-пример expansions and its prompt explicitly covers this observed stock-record inference. This is a narrow conservative guard, not a guarantee of factual accuracy. Regression proves the observed expansion is rejected even when the model approves it. Final suite: 110 passing; build and credential scan pass. Final PDF has contact labels and a manually edited grounded profile; unsupported expansion was not applied.
