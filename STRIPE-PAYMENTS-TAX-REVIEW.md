# Payments and Tax review — 29 September 2026

## Outcome

Ran Stripe's implementation planner against the owner-selected **CV Hapi sandbox**, account `acct_1UL7vADKFhVF7K6u`, test mode. Completed its decision tree and accepted hosted web Checkout for the existing one-time EUR 2 digital service. Guide: `iguide_61VUW0LIVvT5QPaCe41DKFhVF7K6u`. No Stripe configuration was changed and no payment was created. Live-account state and deployed environment secrets were not inspected.

The local implementation is a test-only Payments integration. Stripe Tax is not yet integrated, and neither account configuration nor recovery behavior is ready for paid launch.

## Verified sandbox state

| Check | Result |
| --- | --- |
| Tax settings | `pending`; missing `head_office` |
| Default tax behavior | null |
| Default tax code | null |
| Tax registrations | Empty; `has_more=false` |
| Webhook endpoints | Empty; `has_more=false` |

These are current API observations, superseding older notes that the Stripe connection was unavailable. They do not establish anything about the live account's onboarding, charges or payouts.

## Findings

1. **Tax is absent from Checkout.** `worker/payments.js:77` sends neither `automatic_tax[enabled]`, explicit `tax_behavior`, nor a product `tax_code`. The sandbox also lacks tax defaults and a head-office address. Configure actual seller details and confirmed registrations, select the appropriate digital-service tax code, then enable automatic tax. A zero tax result without registration does not establish that tax is not owed.

2. **Preserve the EUR 2 final price explicitly.** `worker/payments.js:41` only grants access for `amount_total=200` and EUR. Adding exclusive tax could charge more than advertised and then fail entitlement validation. For the documented final consumer price, set inline `price_data.tax_behavior=inclusive`, keep `unit_amount=200`, and verify successful automatic-tax calculation before granting access. Store the order's expected price/tax configuration so future price changes do not invalidate already-open sessions.

3. **No sandbox webhook endpoint exists.** The application has a signed webhook handler, but this account has no registered destination. Status polling can confirm a checkout but cannot substitute for unattended refund/event delivery. Register a verified, isolated staging URL for `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `charge.refunded`; configure its signing secret through the environment. Do not enable test payments on the public pilot just to test delivery.

4. **Out-of-order refund events can leave a refunded purchase usable.** At `worker/payments.js:55`, refunds match only the stored payment-intent ID, which is assigned by checkout confirmation at lines 40–42. If `charge.refunded` arrives before confirmation, the pending row has no intent, the update matches nothing, and the handler still returns success. Later checkout confirmation can mark that order paid. Persist unmatched refund facts or reconcile the authoritative charge/refund state before fulfillment. Add a refund-before-completion regression case.

5. **Concurrent checkout and cookie loss can strand paid orders.** At `worker/payments.js:72–80`, each new request creates a fresh owner token and order. Two overlapping initial requests can create two sessions; only one final cookie survives. The unique owner constraint does not prevent this because each token differs. Establish stable ownership before creating Checkout, serialize/reuse an active order, and provide recovery without storing CV contents.

6. **Processing and refund recovery require unattended work.** `claimPayment` moves an order to `processing` without a lease or timestamp. Worker termination can leave it there indefinitely. A successful review is marked used before delivery, so a lost response also loses the purchased result. Refund retries run only during status requests. Add durable attempt state, a bounded recovery policy and scheduled reconciliation; persist refund IDs and handle failed refunds explicitly instead of indefinitely replaying one idempotency key.

7. **Capacity is checked but not reserved.** Checkout checks the ten-attempt lifetime budget before payment; it consumes capacity only when the review starts. Multiple buyers can pay for the last slot. Reserve capacity atomically before checkout, release unused reservations after expiry, and preserve the original lifetime cap, including failed AI attempts.

## North Macedonia tax gate

Stripe's current North Macedonia guidance says remote sellers supplying digital products/electronically supplied services to individuals must register from their first sale and appoint a local tax representative. Its North Macedonia calculation support is for digital products sold by remote sellers without a physical presence there. Confirm the actual seller location and classification of this automated review service before applying that guidance. Do not infer the seller country from the audience or workspace timezone.

Source: https://docs.stripe.com/tax/supported-countries/europe/collect-tax?tax-jurisdiction-europe=north-macedonia

Enabling Stripe Tax calculation does not itself complete legal registration, filing or remittance. Managed Payments was not selected by the planner: eligibility is unverified, and Stripe's current Managed Payments tax-coverage list does not list North Macedonia among covered cross-border destinations. Do not assume changing products removes this launch gate.

Source: https://docs.stripe.com/payments/managed-payments/tax-compliance

## Concrete next implementation

Retain server-created hosted Checkout and the existing single-use entitlement design. After actual seller/tax facts are supplied, configure sandbox Tax and an isolated staging webhook. Add automatic tax, explicit inclusive pricing, and a confirmed digital-service tax code to the server-created session. Keep address collection in Stripe-hosted Checkout, with the minimum fields required for tax; do not send CVs or job advertisements to Stripe. Review disclosures for payment and tax data separately from CV processing.

Resolve findings 4–7 before real charges. Verify paid, declined, cancelled and expired sessions; duplicate and out-of-order webhooks; concurrent checkout; full and failed/pending refunds; tax-inclusive EUR 2 outcomes in applicable locations; missing customer location; recovery after interruption. Use a mocked AI provider for payment QA so these checks do not consume the ten lifetime real AI attempts.

Owner facts still needed: actual seller country/legal identity and head-office address, relevant tax registrations/service classification, and public support contact. Enter sensitive identity/bank details directly in Stripe. The existing AI processing/privacy gate also remains unresolved. Neither the planner's accepted guide nor a sandbox configuration authorizes live payment enablement.

Checkout guide: https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=stripe-hosted

Tax integration: https://docs.stripe.com/tax/checkout/page

Price/tax behavior: https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior

## Validation and limits

`node --test tests/payments.test.js`: **8 passed, 0 failed**. Tests use mocked Stripe transport and real in-memory SQLite; no real Stripe checkout or AI request was made. The findings above include static control-flow review and account API observations. No source implementation edits, deployment, secret changes, tax registrations or live charges were made in this review. Existing local changes were preserved.
