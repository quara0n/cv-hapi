# CV Hapi growth plan — 4 October 2026

## Decision

Use a small Google Search pilot to test willingness to pay for the £2 AI review, and prepare a real product-demo video for a later Meta test. Build Macedonian organic search content alongside it. Keep the existing NOK 300 **total** learning budget in one paid channel; dividing it between Google, Instagram, Facebook and YouTube would produce very little evidence per channel.

The £2 modal is published on www.cvhapi.com, with matching live GBP Checkout. The 126-test suite passed. A new live unpaid Checkout session was created, verified as £2 GBP and expired successfully without charging a card. The real paid delivery flow was exercised in Stripe test mode with DeepSeek; a new real-money customer payment was not made. These receipts establish specific product checks, not proven acquisition performance.

This document is research and a campaign specification. No advertising was launched and no additional advertising budget was authorized. Sites version 20 now publishes consented delivery-receipt purchase/refund tracking and dedicated review routes; the current suite passes 129 tests. www ownership is verified and `/mk/` passed Google's live indexability test, with indexing requested. Google Ads purchase linking/import remains incomplete and no real-money purchase has been demonstrated. Macedonian ElevenLabs speech is generated, with local export pending for the final video. The owner purchased its subscription separately; the agent made no purchase. Current receipts are in [marketing/READINESS.md](marketing/READINESS.md).

## What the evidence supports

The existing owner-account Keyword Planner research was recorded on 28 September, for North Macedonia, Google only, all languages, September 2025–August 2026. It provides ranges, not exact counts:

| Search | Average monthly searches | Historical top-of-page bid range, AUD | Implication |
|---|---:|---:|---|
| cv | 1,000–10,000 | 0.24–1.32 | Broad and ambiguous; weak first paid-review keyword |
| europass cv | 1,000–10,000 | 0.36–1.17 | Strong competitor/free expectation; defer |
| cv maker | 100–1,000 | 0.52–2.53 | Builder intent, not necessarily paid feedback intent |
| cv template | 100–1,000 | 0.33–1.41 | Useful organic topic; template seekers may expect free |
| cv builder | 10–100 | 0.69–3.20 | Small demand and potentially expensive acquisition |
| cv на македонски | 10–100 | 0.35–0.89 | Relevant local SEO opportunity |
| cv primer | 10–100 | 0.23–0.91 | Example-led organic content |
| napravi cv | 10–100 | 0.13–1.31 | Relevant local builder intent |

The historical builder evidence is in SEARCH-DEMAND-MK.md. A fresh paid-review Planner check is now saved in [marketing/REVIEW-SEARCH-DEMAND-2026-10-04.md](marketing/REVIEW-SEARCH-DEMAND-2026-10-04.md): four English review/checker terms each show 10–100 monthly searches, while Macedonian terms lack reported data. Do not sum overlapping variants, interpret advertiser competition as SEO difficulty, or treat historical bid estimates as guaranteed CPC. The older NOK 10 economics are historical and do not describe the current £2 product.

DataReportal's Digital 2026 report, published 8 November 2025 using mostly October 2025 data, reports [1]:

| Measure | Estimate | Use in this plan |
|---|---:|---|
| Internet users | 1.67 million; 92.0% penetration | A substantial connected market |
| Facebook potential advertising audience | 1.03 million | Include Facebook when eventually testing Meta |
| Instagram potential advertising audience | 910,000 | A credible channel for a short visual demo |
| TikTok advertising audience aged 18+ | 733,000 | Organic reuse first; another paid channel is premature |
| LinkedIn registered members | 450,000 | Potential partnerships/content; not comparable active-user reach |

These figures are neither unique customers nor a CV-buying audience. Facebook/Instagram audiences overlap, estimates change, and the report is not a live October 2026 Ads Manager forecast. Instagram's reported adult audience is approximately balanced by gender; there is no evidence for excluding either gender. Population median age is 41, so a student-only strategy would miss a large part of the market.

Prioritize **needs** in messaging: first application, an existing CV that needs clearer wording, and an English application for work abroad. These are hypotheses, not inferred personal traits. Use fictional examples representing several kinds of work. Do not assume that only graduates, office workers or unemployed people need the service. Albanian localization is a potential expansion requiring actual demand and language-quality validation; it is not currently a supported site language.

## Economics before bidding

Optimize contribution after advertising, not clicks or gross revenue. Define:

`contribution per retained delivered review = collected revenue − payment/FX fees − AI cost − expected refund/dispute loss − applicable tax − variable support cost`

`break-even CPA = contribution per retained delivered review`

`break-even CPC = contribution × click-to-retained-delivered-review rate`

Stripe's public Norway standard pricing is 2.4% + NOK 2 for Norwegian/EEA cards and 3.25% + NOK 2 for international cards, with an additional 2% when currency conversion is required [2]. North Macedonia is outside the EEA; a locally issued card would generally fall in the international group. Actual account pricing, settlement currency and card origin must be checked. Charging GBP does not make a Macedonian card a UK card. The customer's bank can also apply its own conversion charges.

If revenue is settled in NOK with required conversion, the illustrative processing formula for a £2 international-card charge is `£2 × (3.25% + 2%) + NOK 2 converted to GBP`. This excludes AI, tax, refunds and account-specific differences. Use actual Stripe balance transactions for the final margin. Do not invent an exchange rate.

| Illustrative net contribution | 2% paid-delivered conversion | 5% conversion | 10% conversion |
|---:|---:|---:|---:|
| £1.40 | £0.028 maximum break-even CPC | £0.070 | £0.140 |
| £1.60 | £0.032 | £0.080 | £0.160 |

These are scenarios, not observed margins or conversion rates. They show why a £2 one-time product can struggle with paid acquisition. There is no demonstrated repeat-purchase lifetime value to justify spending beyond first-order contribution. Free builders can attract users economically through useful search content and referrals, then offer paid review when relevant. If acquisition cannot fit the margin, test a higher-value optional package later; keep the existing £2 offer consistent until a separate pricing decision.

## Measurement specification

Source inspection confirms src/telemetry-core.js currently allows free-tool and AI events, but no purchase event. GA4's existing PDF key event is a free export, not a sale. Current analytics consent does not grant advertising personalization/storage. Changing that needs an explicit, understandable advertising consent choice rather than silently repurposing analytics permission.

| Event | Authoritative trigger | Role |
|---|---|---|
| checkout opened | Successful creation of a Checkout session | Secondary funnel diagnostic |
| payment confirmed | Server verification of paid Stripe session | Revenue accounting and secondary diagnostic |
| paid review delivered | Server accepts delivery acknowledgement for the paid order | Primary commercial outcome |
| refund confirmed | Persisted Stripe refund confirmation | Revenue reversal and failure diagnostic |
| PDF generated | Existing successful export initiation | Secondary product-use outcome |

Maintain a durable order ledger independently of analytics consent. For consented advertising attribution, use one deduplicated commercial conversion per order, an opaque transaction identifier, correct amount/currency and no CV, vacancy text, name, email, file name or review content. Do not transmit entitlement tokens or Stripe session IDs as analytics transaction IDs. Verify whether the chosen Google Ads/GA4 integration supports the intended refund adjustments; sending a GA4 refund does not automatically prove Google Ads bidding was corrected. Google distinguishes primary/secondary goals and supports conversion retractions/restatements [3]. Avoid custom goals that inadvertently make free exports biddable.

Choose one purchase import path to avoid double-counting browser tags plus GA4 imports. Compare the consented attribution population with all paid orders; a difference is expected and must be reported. Exclude owner/synthetic tests from customer analysis. Use delivered retained orders and total ad spend for the business calculation even when some orders cannot be attributed to individual ads.

Before spend: prove payment/delivery deduplication across refreshes, no event after decline, no document content in requests, and refund reconciliation. This is proposed measurement, not a claim that it has been installed.

## Google Search pilot

Google's current supported-language list excludes Macedonian and explicitly says unsupported-language ads will be disapproved [4]. Use English ads and an English destination for the initial Google test. This tests an English-capable slice of North Macedonia, not the whole local market. Do not replace Macedonian with Bulgarian merely to get an ad approved.

Create one new Search campaign, `MK | AI review | EN | £2 pilot`, with one initial ad group for review intent. Start with a few exact/phrase terms such as `cv review`, `check my cv`, `resume review` and `cv feedback` **only after** verifying local volume and their search results. Exact/phrase are not literal-only matching; inspect the actual search-term report. Do not invent a large review-demand market from the builder figures above.

Target North Macedonia with **Presence: people in or regularly in the location**, rather than the default Presence or Interest [5]. Google calls geographic inference a best effort, not 100% accurate. Use all genders and avoid small demographic subdivisions. Keep Search partners and Display expansion off for the first interpretable test. Defer Performance Max, Demand Gen and remarketing until purchase measurement and demand evidence exist.

Use Manual CPC, or Maximize Clicks with a CPC ceiling, for a tightly controlled initial learning test. This is a budget-control choice, not a claim that Smart Bidding requires a universal minimum number of conversions. Set the ceiling from actual margin and a stated conversion hypothesis; if auctions cannot deliver within it, report that rather than automatically raising it. Do not optimize for free PDF events to create an appearance of successful paid conversions.

Draft responsive-search-ad assets:

| Headlines, up to 30 characters | Descriptions, up to 90 characters |
|---|---|
| AI CV Review — £2 Once | Get AI feedback on your CV and optional cover letter. £2 once. No subscription. |
| Clearer CV Wording | Review suggestions, edit your wording and keep control of the final document. |
| No Subscription | CV builder and standard PDF are free. AI review costs £2 once. |

Keep a price/no-subscription statement reliably visible using suitable asset pinning if needed, accepting reduced combination freedom. Initially exclude clearly unrelated searches such as jobs/vacancies, CV meaning, vehicle components and academic curriculum. Defer competitor-brand searches. Do not blanket-negative `free` in a campaign advertising the genuinely free builder; a paid-review campaign can handle that intent separately.

The current /en/ homepage leads with the free builder, and Review my CV is a button. Before paid-review ads, add a stable review destination with the same £2 offer, an actual fictional report example, the documents needed, AI consent and one main review CTA. Do not advertise an invented /en/review/ URL before it exists. Keep the purchase modal user-triggered; do not interrupt all organic visitors with it.

Budget: NOK 300 is the total ceiling including expected taxes and conversion margin. The account is AUD and GMT+10. Convert the ceiling using a verified current rate when configuring it and reserve a buffer; never enter 300 AUD. Google now documents campaign total budgets for new **Search** campaigns, with a 3–90-day period and all Search bidding strategies [3]. Prefer that hard campaign total budget plus a fixed end date, verifying its availability in this account. An average daily budget can spend up to twice that amount on a day and generally 30.4 times it in a month; it is not a seven-day total cap. If a hard cap cannot be verified, keep the campaign paused.

Use a 7–14-day learning window within the hard total ceiling. Stop promptly for broken delivery, incorrect charge/currency, unexpected refund failures, unusable attribution or out-of-scope spend. Review search relevance and funnel progression without daily cosmetic changes. At the end, calculate spend/retained-delivered orders and net contribution after spend. A few sales are encouraging but not statistical proof of a winner. With zero conversions in 30 relevant clicks, the rough 95% upper bound is still about 10%; low counts cannot distinguish many plausible conversion rates. Do not spend indefinitely to complete an arbitrary sample.

## Instagram, Facebook and third-party signals

Use the 15-second demo in VIDEO-AD-BRIEF.md organically first. A later separately bounded Meta experiment should use one country-wide adult audience, one language per coherent creative/destination, and no gender exclusions. Start with broad delivery rather than a long intersection of students, employment interests and narrow ages. Offer Facebook as well as Instagram; the audience evidence does not justify Instagram-only. Choose Sales/purchase optimization once reliable purchase signals exist; a traffic test is explicitly a visit test and cannot prove buyers.

Meta says employment ads promote or directly link to an employment opportunity, while general career-development advice unrelated to specific listings is excluded [6]. A CV-tool demo appears closer to that exclusion, but campaign content and linked destination determine classification. If job listings, placement or guaranteed interviews are added, reassess and use the required special category and available restrictions. Do not bypass classification by changing wording while retaining an employment offer.

Meta recommends vertical 9:16 video with audio and key messages within placement safe zones [7]. Its quoted 34.5% lower cost per result came from a global meta-analysis of 15 split tests in ecommerce, retail and consumer goods. It is a reason to test a suitable format, **not** an expected CV Hapi improvement. Preview Reels/Stories/Feed crops; a small screen-recorded desktop page must be enlarged into readable individual actions. Test purchase outcomes, not just video views.

The useful third-party targeting options are:

| Signal | What it actually provides | Recommendation |
|---|---|---|
| Current Google search query | Immediate expressed CV/review intent | Best first paid hypothesis |
| Google custom segments using search terms | Platform-defined audiences based on Google-property searches; interests elsewhere | Possible later video/Demand Gen test, not the NOK 300 pilot |
| URLs entered in custom segments | People browsing sites similar to those URLs | Not access to a job board's visitors and not guaranteed placement on it |
| Consented own-site audience | Eligible prior visitors with appropriate consent and minimum audience size | Later; not currently enabled advertising consent |
| Job-board/career-centre partnership | Contextual exposure to people choosing relevant content | Seek voluntary referrals, not personal applicant lists |
| Bought/scraped applicant lists | Unverified personal data and potentially sensitive employment profiles | Do not use |

Google explicitly distinguishes searched terms on Google properties from interest interpretation elsewhere, and says URL inputs do not place ads on those URLs [8]. We cannot retrieve individual search histories from these tools. Google restricts personalized targeting involving negative financial status, including unemployment resources [9]. Target CV-improvement intent rather than inferred unemployment, financial distress, health, ethnicity or other document-derived attributes. Never build audiences from CV content. Avoid copy like “We know you lost your job”; say what the product does.

## SEO work in priority order

The current build already prerenders Macedonian/English HTML, sets canonical/hreflang/x-default links, generates robots.txt and a two-language sitemap, and includes WebApplication structured data. Keep those foundations. They do not establish current indexing, rankings or excellent field performance.

1. **Check live indexing evidence:** inspect /mk/ and /en/ in Search Console, submitted sitemap, selected canonical and rendered content. Record the actual result, rather than treating a submitted sitemap as an indexed page. Track queries by country/page over 28 days, separating branded and nonbranded impressions/clicks.
2. **Clarify the commercial offer:** the paid review needs its own useful, crawlable explanation and example, distinct from the free builder. Unique titles, headings and descriptions should match each page's purpose. Retain immediate access to the free tool.
3. **Publish three substantial local guides:** a CV example in Macedonian; a CV with no formal work experience; a cover letter tailored to a vacancy. Each needs a complete fictional worked example, editable/downloadable material, concrete instructions, an appropriate next action and native-language quality review. Link between guides and the relevant tool. Proposed titles are hypotheses based on the existing Planner evidence, not ranking guarantees.
4. **Add evidence and trust:** identify the operator, pricing, refund process, limitations, support and authors/reviewers. Cite useful authoritative career sources. Do not manufacture testimonials, hiring outcomes, ratings, certifications or “ATS approved” claims.
5. **Measure mobile performance:** use PageSpeed lab results and real field data when available. Targets at the 75th percentile are LCP ≤2.5 seconds, INP ≤200 ms and CLS ≤0.1 [10]. Lighthouse does not establish field INP. Keep PDF/extraction libraries lazy-loaded and optional analytics consent-gated; avoid adding autoplay ad video to the main builder.
6. **Improve sharing/discovery:** add a consistent social-preview image, readable image alt text and links from relevant career resources. Partnerships and genuinely useful examples fit this small market better than purchased links or mass-generated location/occupation pages.
7. **Validate language pairs:** every translated page should link reciprocally to itself and its corresponding alternate using fully qualified URLs. Use language `mk`, not a country code as a language. Keep distinct canonical URLs for real translations [11].

Google's SEO Starter Guide prioritizes useful original content, clear titles, crawlable links and accessible resources, and says changes can take weeks or months [12]. Do not claim a special AI-content trick or guaranteed ranking. Measure organic visits that actually reach review/delivery, not rankings in a personalized Norwegian search session.

## Execution order and decisions

| Stage | Work | Evidence that permits the next stage |
|---|---|---|
| Product | Published £2 modal and paid recovery repairs | Completed checks above; monitor real delivery/refunds |
| Measurement | Deduplicated consented purchase/delivery attribution and reversals | Synthetic events reconcile to the order ledger without document data |
| Destination | Review landing content and real example | Mobile visitor understands £2 before Checkout; route works |
| Demand | Focused local review-keyword Planner check | Relevant searches within plausible CPC/margin constraints |
| First paid test | One Search campaign, hard total ≤NOK 300 equivalent | Retained delivered orders, net margin and interpretable funnel |
| Organic | Three useful Macedonian guides and demo reuse | Indexed pages and actual nonbranded traffic/use |
| Next paid test | Separate Meta demo/static comparison | New bounded budget and trustworthy commercial measurement |

Do not call the acquisition system optimized yet: no observed paid acquisition conversion rate, CPA, retention value or randomized creative result exists. The next optimization is a measured experiment with a financial ceiling, not more platforms or narrower personal profiling.

## Sources and verification boundaries

Read directly on 4 October 2026 unless otherwise stated. Official policy pages are primary evidence; platform performance claims are qualified. Search discovery used the owner's existing Norwegian session and is not a Macedonian rank audit.

1. DataReportal, [Digital 2026: North Macedonia](https://datareportal.com/reports/digital-2026-north-macedonia), published 8 November 2025; mostly late-2025 data, audience-methodology caveats read.
2. Stripe, [Norway pricing](https://stripe.com/en-no/pricing), public standard card, FX and Checkout fees; account-specific fees not inspected.
3. Google Ads, [Bidding, budgets and conversion reference](https://support.google.com/google-ads/faq/10286469?hl=en), sections on campaign total budgets, spending limits, primary/secondary conversions and adjustments read directly.
4. Google Ads, [Available languages](https://support.google.com/google-ads/answer/6333734?hl=en), table and unsupported-language warning read.
5. Google Ads, [Advanced location options](https://support.google.com/google-ads/answer/1722038?hl=en), Presence/Interest distinction and accuracy limitations.
6. Meta, [About ads for employment](https://www.facebook.com/business/help/1537759006681893), general career-advice exclusion and employment-opportunity examples read in the Norwegian rendering.
7. Meta, [Facebook and Instagram Reels ads](https://www.facebook.com/business/ads/facebook-instagram-reels-ads), 9:16/audio/safe-zone guidance and 15-test methodology read in the Norwegian rendering.
8. Google Ads, [Custom segments](https://support.google.com/google-ads/answer/9805516?hl=en), search/interest/URL distinctions read.
9. Google, [Personalized advertising restrictions](https://support.google.com/adspolicy/answer/143465?hl=en) and [negative financial status](https://support.google.com/adspolicy/answer/16700443), sensitive categories and unemployment-resource example read.
10. Chrome/web.dev, [Web Vitals](https://web.dev/articles/vitals), field thresholds and lab/field limits.
11. Google Search Central, [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), reciprocal links and language codes.
12. Google Search Central, [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), content, discoverability, titles and time-to-impact.

First-party sources: SEARCH-DEMAND-MK.md (28 September Planner/Trends receipt), GROWTH-AND-ANALYTICS.md (historical consent/dashboard setup), current scripts/seo.mjs, src/telemetry-core.js, src/telemetry.js and the 4 October production/test receipts. Historical free-pilot/€2/NOK 10 statements are not current product pricing.
