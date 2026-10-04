# CV Hapi: prepared campaign setup

Prepared 4 October 2026. Nothing in this folder launches advertising. Total advertising spend remains NOK 0 for this preparation. The authorized pilot ceiling is NOK 300 total, including any applicable tax and currency costs; the existing Google Ads account uses AUD and GMT+10.

## Google Search pilot

Use one Search campaign, `MK | Search | Paid CV Review`, initially **Paused**. North Macedonia, presence in the country (not interest in it), English creative and English destination. Macedonian is absent from Google's current supported ad-language list; do not substitute Bulgarian. Google Search only; disable Display expansion and Search Partners for the first controlled test. Do not exclude genders or infer unemployment from browsing history. Start with all adult groups, unknown included; demographic exclusions are not necessary for this small intent test.

Destination: `https://www.cvhapi.com/en/review/?utm_source=google&utm_medium=cpc&utm_campaign=mk-search-cv`. Use the actual final landing route after deployment. Never include email, CV text, payment tokens or personal identifiers in URLs.

The supplied CSV contains copy candidates and keyword hypotheses, **not an immediately importable or launched campaign**. The fresh owner-account check in REVIEW-SEARCH-DEMAND-2026-10-04.md reports 10–100 monthly searches for each of four English review/checker terms, with overlapping variants and no willingness-to-pay proof. Existing builder-keyword estimates do not establish paid-review demand. Use exact and phrase matching initially; broad match and automated expansion would undermine the first small demand test. Review search terms after initial clicks.

Select a Search **campaign total budget**, a supported 3–90-day flight, rather than relying on a daily budget to enforce the total. Convert the NOK ceiling into AUD using the verified rate and account billing/tax treatment at setup, allowing a buffer. Do not invent a current exchange rate. If the account's creation screen does not offer a total budget, keep the campaign paused until an enforceable spending control is ready. Account timezone determines the start/end boundaries.

Start with Manual CPC if available, otherwise Maximize Clicks with a CPC ceiling derived from the documented contribution model. Historical top-of-page estimates are not a suitable bid ceiling by themselves. A small learning pilot can lose money; its NOK 300 ceiling is the loss limit, not evidence of likely profitability. Do not switch to purchase-value bidding from a handful of conversions.

Primary goal: a **delivered, paid AI review**, counted once per hashed transaction. Free PDF generation is secondary. The site emits consented GA4 `purchase` only after the server confirms delivery, with GBP 2 (or EUR 2 for an older order). Test-mode reviews never emit sales. Import this GA4 event to Google Ads and select it as the sole primary commercial goal after checking the linked property and receipt in DebugView. Do not mark checkout opening or generic page views as purchases. No enhanced conversions, uploaded CV data, remarketing audiences or third-party applicant lists.

Refunds observed in the customer's browser emit a matching GA4 `refund`. A refund processed unattended is recorded in the payment ledger but does not automatically retract a Google Ads conversion. Reconcile retained deliveries against Stripe/payment records before evaluating profitability; complete offline conversion adjustments before scaling or automated value bidding. GA4 event acceptance and Google Ads import configuration still require account verification; a passing code test is not that verification.

## Meta / Instagram preparation

Keep paid Meta spending at zero during the Search pilot. Publish the Macedonian product demo organically first once the voiceover's commercial rights are verified. Paid creative must use licensed audio. Use vertical 9:16 for Reels/Stories and a separately composed 4:5 feed version. Check each placement preview for overlay/safe-zone conflicts; do not crop away the offer.

Later paid-test hypothesis: North Macedonia, adults, all genders, country-wide, broad audience and native Macedonian product copy. A £2 CV-writing/review tool with no job listings appears within general career advice, which Meta's employment guidance excludes from the employment category; check the actual creative and account classification. Adding job offers or guaranteed interviews changes that assessment. Avoid assertions about the viewer's employment status, financial hardship, or private search history.

Macedonian primary text:

> Направи јасно CV и преземи PDF бесплатно. Веќе имаш CV? Добиј AI-предлози за £2 еднократно, спореди ги верзиите и избери ги измените. Без претплата. Почни на cvhapi.com.

Headline: `Твоето CV. Појасно.`

Description: `Бесплатен PDF · AI-проверка £2`

CTA: Learn More. Destination: `https://www.cvhapi.com/mk/review/?utm_source=instagram&utm_medium=cpc&utm_campaign=mk-jobs` for the paid-review version; use `/mk/` for free-builder-led organic copy. A platform's reported video views or view-through conversions are not retained paid sales. Compare creative under the same attribution window and use ledger-confirmed retained delivery as the business outcome.

## SEO and measurement work

The builder has prerendered Macedonian/English pages; the new review routes have distinct canonical URLs, matching language alternates, price descriptions and sitemap entries. Existing pages explain no-experience CVs and distinguish the builder from official Europass. Next content work should be three original Macedonian guides: a complete fictional CV example, a no-experience example, and a factual cover-letter example. Each must answer the search query with a useful example rather than a thin repeated template. They are future work, not published pages.

Check Search Console URL Inspection and sitemap status for the four destination URLs, then monitor impressions/search terms. An indexable sitemap does not establish indexing or rankings. Measure field Core Web Vitals at the 75th percentile when enough traffic exists; low-traffic pages may have no CrUX data. See the linked primary sources, audience estimates and unit economics in `GROWTH-PLAN-2026-10-04.md`.
