# CV Hapi measurement — 2026-09-28

## Current status — 4 October 2026

The £2 GBP paid AI review and compact purchase modal are published; the free-pilot/paused-service statements below are historical. Sites version 20 also includes consented server-receipt-based purchase/refund measurement and distinct review routes. All 129 tests passed. A live delivered purchase has not yet been observed in GA4 or imported into Google Ads. The misleading page-view primary goal was changed to secondary; Ads linking/import remains incomplete. See [marketing/READINESS.md](marketing/READINESS.md) for exact evidence and limits, [GROWTH-PLAN-2026-10-04.md](GROWTH-PLAN-2026-10-04.md) for research, and [VIDEO-AD-BRIEF.md](VIDEO-AD-BRIEF.md) for the Macedonian video. No ad campaign or advertising personalization was activated. NOK 300 remains a total pilot ceiling.

## Connected services

GA4 property 556316817, stream 15861416022, measurement G-JYTW6J3BRZ.
Dashboard: https://analytics.google.com/analytics/web/#/a283629177p556316817/reports/intelligenthome

Microsoft Clarity project ypjcjxa0o9 (CV Hapi), created with owner-approved terms and Google sign-in.
Dashboard: https://clarity.microsoft.com/projects/view/ypjcjxa0o9/dashboard
Settings verified: Strict masking, Cookies OFF (require consent signal), bot detection ON.
Dashboard/recordings remain pending until actual traffic has been processed. Do not fabricate usage.

## Consent and content protection

GA4 loads only after analytics consent. Clarity requires a separate unchecked recording opt-in including an 18+ confirmation. Existing GA4 consent does not authorize Clarity. Both respect GPC and DNT. No advertising storage/personalization is granted.

Clarity receives consentv2 with analytics_Storage granted and ad_Storage denied only after opt-in. The HTML root is masked before loading the script, protecting dynamically rendered CV previews, application evidence and model output. The form, preview and review roots also carry explicit masking. No identify API, names, email addresses, file names, CV text or vacancy content is sent in custom events. Arbitrary URL query values and fragments are removed before loading Clarity; GA4 retains only allowlisted attribution captured earlier.

Withdrawal sends denied consent and stops Clarity, deletes its first-party cookies and prevents further app events. To avoid restarting a stopped recorder around unsaved data, re-enabling recordings takes effect on the next visit; the UI explains this and does not reload or discard the CV. GA4 is disabled immediately on withdrawal. Preference storage is independent of optional CV storage.

Google analytics cookies last up to one day; Clarity cookies can last up to one year. Provider privacy statements and technical-data processing are disclosed in EN/MK privacy copy. Clarity tracking is not configured for a custom domain until that domain is owned and connected.

## Events and interpretation

GA4 page_view uses its standard name; other events keep the existing cekor_ prefix for continuity. Clarity uses cvhapi_visit for a visit and the same cekor_ action names. src/telemetry-core.js is the full event allowlist.

Builder funnel: page_view → cekor_builder_started → cekor_export_clicked → cekor_pdf_started → cekor_pdf_generated.
Review funnel: cekor_review_imported → cekor_ai_review_started → cekor_ai_review_completed → cekor_review_suggestion_applied → cekor_review_pdf_started → cekor_review_pdf_generated.
Application funnel: cekor_application_started → cekor_application_drafted → cekor_application_pdf_generated.

These flows can branch: local review works without AI; users can omit suggestions; a builder can export without visiting all steps. Use open funnels for diagnosis. PDF generation means the browser download was initiated, not that a file was successfully saved or a purchase occurred. Interest answers are not purchases. Filter example_loaded sessions when assessing real use. Browser exits cannot be measured perfectly; use last observed event and funnel drop-off.

Source/medium/campaign values are allowlisted. Explicit allowed utm_medium overrides inference; Bing organic and social referrals are distinguished. Internal navigation is not counted as a new referral. ui_language is only en/mk. GA4 native device/session dimensions describe consented visits, not personally identified visitors. No claim of observing everyone.

## Acquisition and launch gates

Search Console property and sitemap were verified previously; indexing/ranking is not guaranteed.
Ads account uses AUD. Existing maximum is NOK 300 TOTAL, not a daily allowance. No campaign has launched. A hard total budget, currency/tax margin, end date and payment setup must be verified before launch.

The product is still a free pilot. Stripe test-mode checkout and server-side entitlement are implemented but disabled; see PAYMENTS.md. Clarity/GA4 integration, saved dashboard funnels, real synthetic recording QA and commercial-launch decisions must be verified separately; code tests alone do not prove provider ingestion.

## Domain check

MKhost direct lookup on 2026-09-28 returned cvhapi.mk and cvhapi.com available.
.mk quoted EUR 19.49 first year / EUR 14.62 renewal, with residency or legal-entity documentation requirements.
.com search quoted EUR 19.79; its actual one-year cart quoted EUR 19.50, tax 0% before login. Final tax and renewal require confirmation. DNS management included, paid privacy and hosting not selected. No purchase made. User asked for .com price; do not treat that question as purchase approval.


## Live verification, September 28

A synthetic live Clarity recording was received and visually checked: all text was masked, including CV preview. Evidence: test-output/clarity-masked-live.png. GA4 realtime received a synthetic visit; do not count it as a customer. Saved open funnel CV Hapi — CV to PDF has the five builder steps above and device breakdown. Its current last-28-days range excludes today; normal reporting latency applies. Exploration: https://analytics.google.com/analytics/web/#/analysis/a283629177p556316817/edit/Z0O2ccM_S_WiY0Femv9LDw .


## 4 October release configuration

Primary public address: https://www.cvhapi.com/; apex remains connected. Both domains are allowlisted for GA4/Clarity. Root analytics locations now follow the selected interface language, keeping query values, fragments and arbitrary referrers out of custom events. Consent and separate adult recording consent are preserved; recordings mask all document content. GA4 and Clarity dashboards are accessible under the existing owner account. Historical visits include synthetic QA; they do not establish customer activity.

Free-tool version 15 is deployed with environment revision 8: AI_ENABLED, PAYMENTS_ENABLED and CHECKOUT_ENABLED false. Ads remain on hold. Current saved builder funnel is available at the existing exploration URL above.

Live synthetic verification on www: GA4 realtime received `cekor_export_clicked`, `cekor_pdf_started`, `cekor_pdf_generated`, and a PDF key event. `cekor_pdf_generated` was marked as a key event in GA4. Clarity website URL is now https://www.cvhapi.com, Strict masking was visibly selected, and an online session appeared. Fresh recording content inspection is still pending. This synthetic launch test is not a customer or sale. Dashboard reports may lag and require authentication.

## Morning reporting and next steps

Active Codex app automation: `cv-hapi-morning-analytics-report`, daily at 07:00 local Oslo time. Report previous complete day and seven-day comparison, with each dashboard's time zone. Include users, new users, sessions, source/medium/campaign, country/device, engagement/pages, CV-to-PDF funnel and completion/drop-off, application/review activity when enabled and errors. Clarity adds rage/dead clicks, excessive scroll, quick backs, heatmaps and masked recording evidence. Show missing metrics honestly and account for different consent populations. Known owner/synthetic tests must be distinguished from customer activity.

Every report ends with up to three supported recommendations and a decision: fix now, run a small experiment, or wait. State the evidence, expected benefit, next measurement and reassessment condition. Small samples favor waiting rather than speculative redesign. Reporting is read-only; it authorizes no deployment, advertising or spend. The automation belongs to the local Codex app/thread and depends on host availability and authenticated dashboards; cloning the repo does not install it and no email delivery is configured.

Initial plan: keep free tools live, verify fresh recording masking, collect real user journeys and inspect the largest repeatable funnel friction. Fix reproducible broken flows promptly; test one focused UX change at a time when there is enough evidence. Complete the paid recovery/provider/commercial gates in LAUNCH-STATUS.md before opening checkout.
