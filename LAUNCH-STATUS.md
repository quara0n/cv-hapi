# Launch configuration — 28 September 2026

- User authorized a public pilot and a maximum total Google Ads spend of NOK 300. No recurring budget or increase is authorized.
- GA4 property: Čekor CV — North Macedonia, `556316817`, in the owner's existing Analytics account `283629177`. Stream `15861416022`, measurement ID `G-JYTW6J3BRZ`.
- Dashboard: https://analytics.google.com/analytics/web/#/a283629177p556316817/reports/intelligenthome
- Enhanced measurement was switched off in the new web stream. Only explicit allowlisted events are sent by the application. Never mark PDF downloads or interest responses as purchases.
- GA script loads only after consent on the production hostname. Advertising consent and Google signals remain off. No arbitrary query parameters, referrer URLs, vacancy or CV text are forwarded. Analytics cookies use host-only scope and a one-day lifetime. Revoking consent disables future events and clears these cookies.
- The separate GTM account wizard reached Terms of Service and Data Processing Terms; acceptance is pending explicit user approval. No separate container was created through that wizard. GA itself provisioned its Google tag, which is sufficient for the current implementation.
- Google Ads account discovered: `143-420-6814`, AUD currency, eastern Australian time. New-campaign setup was started but blocked by the message “Turn off ad blockers”. No campaign was published and no ad budget was activated. Do not treat the campaign name in the wizard as a saved campaign or a NOK budget.
- Advertising setup must resume in a working Google Ads browser, with account currency and a hard total spending bound verified before enabling delivery. Do not enter 300 in an AUD budget field.
- AI and payments remain unconnected. The publicly available product is honestly described as a free guided CV/cover-letter pilot; it does not test real purchases yet.

Public launch succeeded. GA4 realtime confirmed one synthetic test visitor, page_view and cekor_application_started. This is a technical verification, not a real customer or sale. Search Console meta verification is included for the same owner.
