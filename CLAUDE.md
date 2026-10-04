## 4 October paid-service repair

The user explicitly authorized fixing and reopening the EUR 2 AI review on www.cvhapi.com, superseding the earlier agent-selected pause. See [PAID-REPAIR.md](PAID-REPAIR.md) for checkout reservations, delivery acknowledgement, unattended refunds, sales acceptance and verification boundaries. Runtime revision 9 enables AI, live payments and checkout with a preserved lifetime allowance of 100; it takes effect when the repaired source is deployed. Historical pause statements below describe version 15. Verify terminal deployment success and public endpoints before reporting restoration complete.

# CV Hapi project context

## Start here

Read `HANDOFF-2026-10-04-launch.md`, `LAUNCH-STATUS.md`, `README.md` and `GROWTH-AND-ANALYTICS.md` before proposing changes. Older handoffs and REVIEW-GUIDE.md are historical; current status takes precedence. Inspect the actual repo and current user request before acting.

CV Hapi serves job seekers in North Macedonia. Primary public URL: https://www.cvhapi.com/. Root defaults to Macedonian; `/en/` and `/mk/` are supported and a saved language choice is respected. GitHub: https://github.com/quara0n/cv-hapi.

## Current release

Sites version 15 deployed successfully on 4 October 2026 from source `f1cd8afce436274fe1227b40b49c23a799211a91`, environment revision 8. Free builder, three PDF designs, cover-letter template, local checks and exports are online. Public AI and checkout are paused: `AI_ENABLED=false`, `PAYMENTS_ENABLED=false`, `CHECKOUT_ENABLED=false`. Local owner AI tests are separate. Do not interpret a free-tools launch as permission to enable live payments.

111 automated tests and production build passed. Two fictional Macedonian user flows exercised free PDF creation and real local DeepSeek review. Native Macedonian editorial QA and physical-device testing remain open.

## Architecture and useful files

- Vanilla JavaScript/Vite client: `src/main.js`, `src/homepage.js`, `src/i18n.js`, `src/model.js`.
- PDF/import/application: `src/pdf.js`, `src/document-import.js`, `src/application*.js`.
- Review workflow: `src/review-ui.js`, `src/review-feedback.js`, `src/review-guide.js`, `src/review-studio.js`, `src/section-workshop*.js`, `src/field-guidance.js`.
- Worker AI: `worker/index.js`, `worker/review-prompt.js`, `worker/feedback-review.js`, `worker/factual-review.js`, `worker/review-language.js`.
- Payments and quota: `worker/payments.js`, `worker/ai-config.js`, `db/schema.js`, additive `drizzle/` migrations. D1 holds opaque payment state/quota, not CV text or replies.
- Analytics: `src/telemetry*.js`, `src/google-measurement.js`, `src/clarity-measurement.js`.

## Run and verify

Node 22+: `npm ci`, `npm test`, `npm run build`. `npm run dev` is frontend-only; `npm run dev:test` runs the guarded local sandbox/DeepSeek backend at http://localhost:5174. `.env.local-test` is ignored; it rejects live Stripe keys. Owner authorized unlimited guarded local tests; preserve the test database and hosted counters. Windows esbuild/network access may require an execution context outside the restricted sandbox.

Do not reload/restart a server serving an unsaved CV/review without preserving the user's work: documents/results live in tab memory. Current machine-local server was session 4978/PID 15180; verify it rather than assuming it still exists.

## Safety and release boundaries

Never output or commit `.env` values, secrets, test databases or user CVs. `.env` can contain live Stripe credentials. Reviews require explicit document consent; adaptable wording examples are templates, not inferred facts. User chooses edits, previews them and confirms facts before applying. Preserve original text and undo.

Paid launch gates: processing leases/unattended refunds; lost-response delivery recovery without violating no-server-document-storage promises; provider processing/retention/transfers; seller/VAT/consumer terms; hosted Stripe sandbox/webhook verification. See `LAUNCH-STATUS.md`, `API-PRIVACY.md`, `PAYMENTS.md`, `TERMS-OF-SALE-DRAFT.md`.

## Hosting

Use Sites hosting skills and the existing `.openai/hosting.json` project `appgprj_6abaa69cdd2481918fe51468917d695c`. Preserve public access, both domains and D1. Push exact source, package its build, save version, deploy and verify terminal success. GitHub push does not itself deploy Sites. Windows workflow packaging needs Git Bash ahead of WSL Bash in PATH and `TAR_OPTIONS=--force-local` for C:/ archive paths. Credentials go through memory/stdin only.

## Analytics and daily report

GA4 `G-JYTW6J3BRZ`, property `556316817`, account `283629177`; Clarity `ypjcjxa0o9`. GA4 is consent-gated, event allowlist only, no CV fields. Clarity requires a separate adult recording opt-in and strict text masking. Respect GPC/DNT and withdrawal. `cekor_pdf_generated` is a GA4 key event. Existing funnel: CV Hapi — CV to PDF. Names retain the historic cekor_ prefix for continuity.

Codex app automation `cv-hapi-morning-analytics-report` is active daily at 07:00 local Oslo time. It reports previous-day/seven-day metrics and gives a fix/experiment/wait recommendation; it does not authorize code changes or spend. It depends on this host and authenticated dashboards; it is not a repository cron or an email service. Synthetic tests are not customer evidence. Early traffic is too small for strong conversion conclusions. No ads launched; any future spend requires a bounded execution decision.
