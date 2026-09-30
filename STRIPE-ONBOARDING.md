# Stripe onboarding for CV Hapi

Updated 30 September 2026. Account activation is separate from enabling checkout on the website.

## Verified account status

The owner submitted onboarding for the live CV Hapi account `acct_1UL7uzRgoJVi3JIJ`. Stripe's Account status page shows Payments and Payouts Active and “No active tasks to complete.” This is distinct from the previously connected CV Hapi sandbox account.

The website saved in onboarding is https://cvhapi.com, the statement descriptor is CV HAPI, two-factor authentication is on, and the owner supplied a Revolut EUR payout account directly in Stripe. Radar Lite was selected; Stripe Tax and Climate contributions were skipped. Skipping Stripe Tax does not determine the seller's tax obligations.

The domain has been purchased. The owner supplied a screenshot confirming support@cvhapi.com forwards to an existing Gmail account. Public launch is being prepared. Live checkout remains disabled: no Stripe secret or webhook secret is configured in Sites. The local implementation now accepts explicitly matched test/live modes and filters cross-mode events. Account activation does not resolve the payment recovery, AI privacy, factual-quality or tax requirements below.

## Owner: complete in Stripe

Open https://dashboard.stripe.com/account/onboarding (or sign in at https://dashboard.stripe.com/login).

Have these ready; the exact fields and documents depend on your actual country and business type:

- Business country and legal structure. Use Norway only if that is where the seller is actually established; the customers being in North Macedonia does not determine this. Stripe says the business origin country cannot be changed after service activation.
- Legal seller name, business address and registration/organisation number if applicable. Choose the truthful sole-trader/company category presented by Stripe.
- Representative's legal name, date of birth, home address and identity verification if requested. Stripe may also require owners/directors and ownership information.
- Payout bank account and account holder, with account number/IBAN as requested. Confirm supported settlement currency in your account.
- Public support email, telephone/address as requested, website and recognizable statement descriptor. These may appear on receipts or card statements.
- Enable two-factor authentication. Upload ID and enter bank details directly in Stripe, not in chat or GitHub.

## Product details you can copy

Trading/product name: CV Hapi

Website: https://cvhapi.com

Description: Online CV builder and application-writing tools. The builder and ordinary PDF exports are free. Planned paid service: a one-time EUR 2 AI-assisted review of one CV and an optional cover letter against a supplied job advertisement, with individually accepted suggestions and PDF/text download. Limited pilot; paid checkout is not yet live. No subscription or hiring guarantees.

Planned product name: CV Hapi application review

Price: EUR 2 once (200 euro cents), no recurring charge. Confirm consumer tax treatment before launch; the intended displayed final price is EUR 2.

Proposed statement descriptor: CV HAPI (subject to Stripe validation and matching your trading name).

Do not invent a registered seller name or support address. Those must match the actual operator. Use the purchased cvhapi.com domain; verify public accessibility before launch.

## Before real customer charges

- Publish the legal operator and public support/privacy contact; finalise customer terms, refund policy and tax treatment.
- Resolve the AI provider's API processing, retention and international-transfer arrangements. AI_PRIVACY_APPROVED remains false until substantiated.
- Implement durable capacity reservation before checkout and reconciliation/refunds for interrupted or undelivered reviews. The existing test integration does not yet solve these cases.
- Verify remaining lifetime allowance. The hard limit is 10 total attempts, including failures and tests; no reset or increase is authorised.
- Complete Stripe sandbox end-to-end checkout, webhook and refund checks, then separately prepare and verify live-mode integration. Current code deliberately rejects live keys.
- Deploy the reviewed website changes with explicit publication approval. Account activation alone does not deploy or enable payments.

You can complete Stripe onboarding now. Report only whether payments and payouts are enabled, plus the public legal seller name and support/privacy email needed for the site. Never paste passwords, secret API keys, bank details or ID documents into this file or the conversation.

## Official references

Verified current setup guidance: https://docs.stripe.com/get-started/account/set-up

Stripe account checklist: https://docs.stripe.com/get-started/account/checklist

Verification-document guidance: https://docs.stripe.com/acceptable-verification-documents

Exact account-specific requirements and approval come from the Stripe Dashboard, not this checklist.
