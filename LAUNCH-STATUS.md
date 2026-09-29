> Historical planning/status document. See [REVIEW-GUIDE.md](REVIEW-GUIDE.md) for the current consolidated plan; older implementation and launch statements may be superseded.

# Launch configuration — 28 September 2026

- User authorized a public pilot and a maximum total Google Ads spend of NOK 300. No recurring budget or increase is authorized.
- GA4 property: Čekor CV — North Macedonia, `(property ID omitted)`, in the owner's existing Analytics account `(owner account ID omitted)`. Stream `(stream ID omitted)`, measurement ID `G-JYTW6J3BRZ`.
- Dashboard: (owner analytics dashboard omitted)
- Enhanced measurement was switched off in the new web stream. Only explicit allowlisted events are sent by the application. Never mark PDF downloads or interest responses as purchases.
- GA script loads only after consent on the production hostname. Advertising consent and Google signals remain off. No arbitrary query parameters, referrer URLs, vacancy or CV text are forwarded. Analytics cookies use host-only scope and a one-day lifetime. Revoking consent disables future events and clears these cookies.
- The separate GTM account wizard reached Terms of Service and Data Processing Terms; acceptance is pending explicit user approval. No separate container was created through that wizard. GA itself provisioned its Google tag, which is sufficient for the current implementation.
- Google Ads account discovered: `(owner account ID omitted)`, AUD currency, eastern Australian time. New-campaign wizard reached bidding (Clicks); the maximum-CPC checkbox is selected but no limit has been entered. A persistent ad-blocker warning did not prevent subsequent browser interactions. No campaign was published and no ad budget was activated. Do not treat the campaign name in the wizard as a saved campaign or a NOK budget.
- Before enabling delivery, verify account currency and a hard total spending bound. Do not enter 300 in an AUD budget field. Advertising is on hold while the user clarifies branding and whether to replace the temporary chatgpt.site domain. Domain purchase has not been authorized or performed.
- Google's supported advertising-language list excludes Macedonian: https://support.google.com/google-ads/answer/6333734?hl=en . Prepare English ads and an English landing page for North Macedonia if proceeding; this tests an English-speaking subset, not all Macedonian search demand. Earlier Macedonian ad copy must not be launched as-is.
- CV Hapi now includes local PDF/DOCX/TXT import, document checks, and a DeepSeek review endpoint. A dedicated DeepSeek key is stored only as a Sites secret. User explicitly authorized creation and a maximum of 10 lifetime AI attempts, including validation calls. D1 stores only the atomic attempt counter; no CVs, responses or IPs. Payments remain unconnected; this does not test real purchases.

Public launch succeeded. GA4 realtime confirmed one synthetic test visitor, page_view and cekor_application_started. This is a technical verification, not a real customer or sale. Search Console ownership verification succeeded; sitemap.xml reports Success with two discovered pages. Discovery does not establish indexing or ranking.


