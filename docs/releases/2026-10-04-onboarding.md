# Import-first onboarding

The owner requested a playful, professional entry flow inspired by the authenticated MakeMyCV starter, import and editor screens. The implementation uses CV Hapi's own colours, original SVG illustrations and existing document reader.

- Start your CV Hapi opens a recommended Import my CV option and Start from scratch, or Continue my CV when a draft exists.
- File selection and drag-and-drop stage a PDF, DOCX or TXT. An explicit Import action reads it locally; a scanning animation reflects actual reading work.
- Imported text enters the existing review workflow. It is not automatically converted into structured builder sections or sent to AI. Replacement confirmation, unchecked consent and existing review safeguards remain.
- Paste text and builder-source alternatives remain available. Switching sources clears a pending file, and replacement-file selection exposes its Import button.
- Desktop editor steps use a navy sidebar and completion marks based on entered section data. The existing mobile layout, eight templates and live preview remain.
- The offer remains 150 MKD once for three AI reviews, with unlimited free editing and downloads.

## Verification

The final full suite passed 140/140, including all 40 UI tests and the staged-source-switch regression. Production Vite, bilingual SEO and Worker builds passed. No lint or typecheck command is configured. Publication receipts are recorded in LAUNCH-STATUS.md after delivery.

Browser checks covered the start dialog, scratch editor, real Cyrillic horizon.pdf extraction, actual reading state, consent, and English/Macedonian mobile layouts at 390px. Mobile document width was 375px with no horizontal overflow. Evidence stays in ignored test-output/onboarding-start.png and onboarding-editor.png. The preview was frontend-only; this check made no paid AI call or real-money purchase.

Simplification reviewers identified repeated completion calculation and unnecessary DOM updates; both were reduced without changing completion rules. The existing icon helper remains shared by the two small UI modules; a separate module would add no useful behavior. Code review receipt is stored under docs/reviews/.

## CV language picker

A separate editor control opens a desktop dialog or mobile bottom sheet. Cancel leaves the document unchanged; Save changes section headings while preserving written text, interface language and the existing save preference. The first supported browser language (Macedonian/English) supplies the initial default; saved interface preference overrides it, and explicit /en/ or /mk/ routes override both. Unsupported browser languages fall back to Macedonian. No geolocation or IP lookup is used. An existing CV keeps its document language. The language sheet was visually checked at 375px content width, anchored to the bottom with no overflow; screenshot: test-output/cv-language-mobile.png.

Completed reviews: docs/reviews/2026-10-04-onboarding-code-review.json (focused correctness and local adversarial fallback) and docs/reviews/2026-10-04-cv-language-code-review.json (supplemental lite review). Both returned no actionable findings; prior payment/backend changes were outside scope.
