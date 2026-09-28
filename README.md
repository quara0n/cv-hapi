# Чекор / Čekor CV builder

Macedonian-first CV builder with English interface/headings, 3 styles, live preview, optional device-local draft storage and Unicode PDF export. The current release is a private, free test; planned price is NOK 10 once. No Stripe checkout or payment enforcement is enabled.

## Run

Requires Node 22+. `npm ci`, then `npm run dev`. Build with `npm run build`; verify with `npm test`. PDF QA fixtures: `node scripts/pdf-check.mjs`.

## Privacy and analytics

CV content stays in the browser. Saving is opt-in and labelled device-local. No signup, CV uploads or cloud CV storage. `.env.example` documents optional consent-gated PostHog EU analytics. No events are sent while its key is empty. See [GROWTH-AND-ANALYTICS.md](GROWTH-AND-ANALYTICS.md) for metrics and activation. No screen recording or autocapture.

## Launch

The Sites identity is in `.openai/hosting.json`. Source is built to `dist`. The current canonical origin is configured in `scripts/seo.mjs`. Private builds are noindex. Set `PUBLIC_LAUNCH=true` only for an intentionally public launch after confirming the final origin and legal/contact details.

Before charging: finish owner Stripe onboarding, verify fees and currencies, implement server-side Checkout plus signed webhook and paid entitlement, set seller/contact/refund information, and remove the free-demo messaging only when real payments are tested. Client-side PDF generation in this test is intentionally not a secure paywall. A real paid download needs server-side enforcement or a different explicitly chosen business model.

Before acquisition: connect analytics, verify events in the real project, complete local language review, get actual keyword volumes, and validate paid demand. See [MARKET-RESEARCH.md](MARKET-RESEARCH.md). The market is a pilot choice, not a proven low-competition opportunity.

## Verification boundaries

Automated tests cover the form, reordering/deletion, draft restore/reset, escaping, PDF document definitions and analytics consent/allowlisting. Generated PDFs are rendered and checked separately. Desktop browser policy blocked local automated visual/mobile UI verification; do not treat DOM tests as a browser layout audit.
