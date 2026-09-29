# CV Hapi review pilot

Update 29 September: AI submission is blocked in the revised source pending a documented API privacy basis. See [API-PRIVACY.md](API-PRIVACY.md). Deployment is pending, so this is not a claim that the current live site has been paused. `AI_PRIVACY_APPROVED=true` is required in addition to the existing configuration; do not enable it before completing that review.

The review adds a practical companion to existing CV builders: import an existing CV (including Europass), compare with a vacancy, get a DeepSeek critique, and accept individual wording changes. It is not a claim to outperform every free builder. Europass already supports multiple tailored CVs, 31 languages and cover letters (official page checked 28 September 2026).

## User flow and data

PDF (text-based, at most 12 pages), DOCX or TXT up to 5 MB are read in the browser. Scanned PDFs need OCR elsewhere. Extracted text is editable before any transmission. Import itself makes no AI request. The basic document check is explicit rules and word matching, not AI or an ATS score.

AI requires per-review consent. Editing source or vacancy clears consent and stale feedback. Only displayed CV text, optional vacancy and output language are sent through the server to DeepSeek. No raw file, analytics identifier, name from the builder, IP address or browsing metadata is added to the provider request. Users must remove unnecessary sensitive details themselves. DeepSeek's own processing/privacy terms apply. The application does not store or log document text, model prompts or responses on the server. Hosting/provider infrastructure may process technical access data.

Rewrites reference exact source quotes; ungrounded quotes are dropped. Each rewrite is opt-in. The original document is never overwritten. The reviewed PDF is a simple new text layout, not a faithful recreation of an uploaded design. Users can also download editable TXT. AI can still make factual or linguistic errors; every accepted result requires human review.

## Production configuration

- `DEEPSEEK_API_KEY`: Sites secret, dedicated `CV Hapi pilot` key. Never use a VITE_ prefix.
- `AI_ENABLED=true`
- `AI_MAX_REVIEWS=10`; additionally hard-capped at 10 in code.
- D1 logical binding `DB`; generated schema in drizzle/.
- Model `deepseek-flash`, non-thinking JSON output, maximum 2,200 output tokens.
- 20,000 CV characters, 10,000 vacancy characters, bounded request and response bodies, 45-second upstream timeout. Same-origin POST and explicit consent required.

A single atomic SQLite UPSERT reserves one of ten lifetime attempts before provider access. Concurrent calls cannot exceed the cap. Failed provider calls still consume a slot. The cap does not reset daily or on deployment. No automatic top-up. A larger allowance requires a new user decision and a code change. This small public allowance can be used up by visitors; it is a cost ceiling, not complete bot protection. Payments, individual purchased quotas and abuse-resistant production access remain future work.

DeepSeek API format verified at https://api-docs.deepseek.com/api/create-chat-completion . Provider secrets are never sent to client JS. Production secrets are applied via Sites followed by deployment. Local preview intentionally reports AI unavailable and cannot spend API credit.

## Validation

Tests cover exact-quote acceptance, untrusted HTML escaping, consent and origin requirements, bounds, model schema validation, stale-result invalidation, and atomic concurrent quota reservations. Test fixtures contain fictional information only. Live smoke tests consume the authorized lifetime allowance.

## Limits

No automatic translation, no reliable reproduction of uploaded layouts, no OCR, no payment collection, and no guarantee of interviews or ATS acceptance. Do not advertise these. Test the Macedonian output with native speakers before a paid launch. The NOK 300 ad campaign remains unlaunched.
