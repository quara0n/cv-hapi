# Stripe integration: test-only, not a paid launch

Implemented server-created Stripe Checkout, NOK 10 once for one AI review, a signed webhook, durable D1 payment state, and atomic one-use entitlement. The free builder and ordinary PDF remain free. This product choice is the assistant's implementation interpretation of the user's NOK 10 ambition, not validation of willingness to pay.

**Production payments are disabled.** No Stripe credentials have been configured, no Stripe checkout has been completed, and no customer has been charged through this work. The dashboard requires login. A Stripe connection was suggested but was not confirmed. `paymentsEnabled` deliberately rejects live keys. Do not describe this as a completed commercial payment launch.

## Files and endpoints

- `worker/payments.js`: fixed price/currency, Checkout creation, HMAC SHA-256 signature validation over raw bytes with five-minute tolerance, paid session validation, refund requests/reconciliation, no CV data sent to Stripe.
- `worker/index.js`: when payment mode is configured, valid server entitlement is required before consuming the AI quota. Duplicate calls cannot spend a purchase twice. AI failure/quota exhaustion requests a refund. Existing ten-call lifetime cap is unchanged.
- `src/payment-ui.js`: EN/MK test-only purchase UI; separate checkout tab preserves unsaved CV text. A return URL never grants access. “Check payment” reconciles against Stripe. Required cookie is Secure, HttpOnly, SameSite=Lax; only its hash is stored.
- `db/schema.js`, `drizzle/0001_nappy_midnight.sql`: additive `payments` table, no changes to original quota migration. Stores opaque order, owner hash, session/payment-intent IDs and status; no CV, email, card or provider response.
- `public/payment-return.html`: no analytics, no session ID in URL, no success claim.
- `tests/payments.test.js`: mocked Stripe, real SQLite. No external payment/provider calls.

## Test setup remaining

Owner must log in/connect Stripe. Configure secrets `STRIPE_SECRET_KEY` (test key), `STRIPE_WEBHOOK_SECRET`, and `PAYMENTS_ENABLED=test` through Sites environment settings, never source or chat. Webhook URL: `https://cv-hapi.quara0n.chatgpt.site/api/payments/webhook`; events: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded. Use a private staging copy or owner-gated staging before exposing a test checkout to visitors. Changing the public site's payment mode would gate its AI reviews for everyone.

Complete real Stripe test Checkout, signed webhook delivery/retries, concurrent claims, cancellation, expired session, refunds and return-tab flow. Any real DeepSeek request, even during Stripe testing, consumes the original ten-call allowance. Use a local mocked AI provider for routine payment QA.

## Commercial launch blockers

1. Stripe seller identity, bank account, tax treatment, support contact, refund policy and consumer terms. The owner must provide/verify these; none are invented.
2. Paid capacity reservation before Checkout. Current test flow checks remaining quota at checkout and refunds if another request exhausts it before redemption. This is safe against exceeding the lifetime cap, but poor commercial UX.
3. Recovery for lost cookies/tabs, overlapping checkout requests, worker termination while `processing`, and a lost successful AI response. Current test state has no durable CV/result storage and no customer recovery channel. A paid launch needs a privacy-preserving recovery/refund design and an unattended reconciliation job. Refund retries currently happen on status checks, not on a scheduled worker.
4. Stripe test purchase and production-runtime verification. Automated tests are not evidence of a functioning Stripe account.
5. Only after these are resolved should live mode be deliberately implemented/enabled. A live key alone cannot enable it. Payment completion is not currently reported as GA4 revenue; test checkouts must never count as real purchases.

Official references consulted: https://docs.stripe.com/checkout/quickstart , https://docs.stripe.com/webhooks/signature , https://developers.cloudflare.com/workers/best-practices/workers-best-practices/ .
