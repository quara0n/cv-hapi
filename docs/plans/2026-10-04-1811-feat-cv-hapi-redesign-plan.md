---
title: CV Hapi Product and Experience Redesign - Plan
type: feat
date: 2026-10-04
topic: cv-hapi-redesign
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-brainstorm
execution: code
---

# CV Hapi Product and Experience Redesign - Plan

## Goal Capsule

- **Objective:** Help visitors finish a usable CV and understand when a paid review is useful, with a clear path from first visit to downloaded document.
- **Product authority:** The user requested a written redesign plan inspired by MakeMyCV and permits a substantial remake. The direction below is a recommendation, not an implemented or customer-validated redesign.
- **Audience assumption:** Macedonian and English-speaking applicants in North Macedonia, including first-time applicants and people improving an existing CV.
- **Open blockers:** None for reviewing this proposal. Publishing its purchase flow depends on completing and verifying the already-requested denar price change.

---

## Product Contract

### Summary

Give CV Hapi a distinct landing page, a focused CV editor, and a guided document-review workspace. Keep free PDF downloads and sell an optional one-time AI review at a clearly disclosed local price. Retain the existing document and payment capabilities while redesigning the customer experience around them.

### Evidence and problem frame

MakeMyCV's Norwegian landing page presents two entry paths, an attractive document example, a four-step explanation, template previews, and repeated calls to action. Its onboarding opens a separate editor with a section navigator, one active form, a document preview, and fixed Back/Next actions. Its published pricing is €2.90 for seven days, automatically renewing at €27.95 every four weeks; its annual offer renews at €94.80 per year. These are observed website claims, not a verified purchase or product-quality assessment.

CV Hapi already has five editor steps, live preview, design options, browser saving, free PDF generation, imported-document review, editable suggestions, and payment recovery. The public homepage currently contains the editor immediately below the hero. Its first step combines contact details and a personal profile. Multiple capabilities appear on the same page, so a visitor must understand the interface while deciding whether to trust the product.

The most useful competitor lesson is focused presentation. Its subscription model, customer claims, employer logos, and claims of recruiter approval should not be carried into CV Hapi without evidence. Neither site has been tested here with a complete real customer purchase. The observed GA4 sample is too small and includes possible owner testing; it cannot establish conversion rates or demand.

### Options considered

| Direction | Benefit | Cost or limitation |
| --- | --- | --- |
| Polish the existing page | Fastest route to better spacing and clearer copy | Leaves marketing, editing, and reviewing crowded together |
| Rebuild the customer interface around the existing engine | Gives visitors focused paths while preserving established capabilities | Requires careful state preservation and navigation testing |
| Rebuild as an account-based subscription suite | Could support repeat use and more services | Adds account, billing, support, and retention work before repeat demand is established |

**Recommendation:** Rebuild the customer interface around the existing engine. A larger subscription suite is an optional future business decision, not a prerequisite for improving this product.

### Requirements

**Offer and landing page**

- R1. Keep creating, editing, and downloading a standard CV PDF free, without requiring signup.
- R2. Sell one AI review as an optional one-time purchase with the complete price disclosed before checkout.
- R3. Use the verified rounded denar price consistently across checkout, website copy, video narration, subtitles, and transcript while honoring previous purchases at their original terms.
- R4. Present two clear homepage actions: create a new CV and improve an existing CV.
- R5. Keep the introduction video paused and ready to play at the upper right beside the hero copy, stacking it below the copy on small screens.
- R6. Explain the result with a fictional CV example, real template previews, a short three-step explanation, and an example of original versus suggested wording.
- R7. Show the full editor only after the visitor chooses to create or resume a CV.
- R8. Use support details, clear pricing, accurate privacy information, and real product examples as trust evidence.

**Builder**

- R9. Guide the applicant through contact details, experience, education, skills and languages, profile, and final design/export.
- R10. Allow users to revisit completed sections and skip optional sections without losing their draft.
- R11. Keep the first step short by asking for contact details before asking the applicant to write their profile.
- R12. Provide relevant writing examples and prompts within the active section, clearly distinguished from the applicant's own facts.
- R13. Show a live CV preview beside the active section on desktop and provide an explicit Edit/Preview switch on mobile.
- R14. Provide persistent Back/Continue actions and a clear section-progress indicator without covering inputs or mobile keyboard controls.
- R15. Offer a small initial set of polished templates through visual thumbnails and preserve entered content when switching designs.
- R16. Explain whether the draft is saved in the browser and offer a reliable way to resume the existing draft.
- R17. Finish with a prominent free PDF action and a subordinate optional review action.

**Existing-document review**

- R18. Guide the review through document import, confirmation of extracted text, optional job advertisement, purchase, review results, and export.
- R19. Explain before purchase that the revised PDF uses CV Hapi's clean layout rather than preserving the uploaded document's original design.
- R20. Make document transfer to the AI provider an explicit informed choice with accurate provider privacy information.
- R21. Present each actionable suggestion with original wording, proposed wording, a reason, and controls to accept, edit, or retain the original.
- R22. Preserve the original document and keep user-approved wording visible in the revised version.
- R23. Distinguish free document checks from paid AI review without presenting keyword matches as an ATS or hiring-success score.
- R24. Show understandable payment, processing, delivery, and refund states without prompting customers to pay again for an unresolved purchase.

**Design, accessibility, and continuity**

- R25. Use a consistent visual system across the landing page, builder, review results, and purchase modal.
- R26. Keep Macedonian and English interface copy complete and separate interface language from CV document language.
- R27. Support narrow screens, keyboard navigation, visible focus, labelled controls, and accessible validation.
- R28. Preserve existing drafts, valid purchased reviews, and recovery behavior through the redesign.
- R29. Retain consent-based measurement and keep CV text and personal document data out of analytics.

### Proposed UI direction

Keep the recognizable blue accent, dark readable type, and light neutral backgrounds. Use a pale blue hero area, white editor surfaces, consistent field heights, and restrained shadows on document previews. Replace competing visual treatments with one button hierarchy: primary for the current task, secondary for the alternative path, and text buttons for help or navigation.

The desktop editor should read as section navigation, active form, and A4 preview. The mobile editor should read as one form with accessible section navigation and a separate preview mode. Profile writing moves later because the applicant can draw on the experience and skills they have already entered.

Keep the homepage concise: headline and video; a few template examples; how it works; a before/after review example; free versus paid explanation; practical FAQ and support. Resume-draft messaging should appear for returning users. Do not load a full interactive editor as the first impression for a new visitor.

Suggested English positioning: **Create a clear CV. Download it free.** Supporting copy: **Start from scratch or improve the CV you already have. Optional AI feedback, one payment, no subscription.** Macedonian wording needs a fluent-language check before publication.

### Key flows

- F1. **New applicant:** Chooses Create a CV, starts with a default clean template, completes the sections in R9, previews the result, and downloads under R1 and R17.
- F2. **Returning applicant:** Sees Resume my CV, opens the saved draft under R16, edits a section, and exports without restarting onboarding.
- F3. **Existing CV:** Chooses Improve my CV, confirms extracted text under R18, optionally adds a vacancy, reviews scope and price under R2 and R19, and explicitly authorizes AI transfer under R20.
- F4. **Review result:** Compares suggestions under R21, keeps or edits each change, checks the revised document, and exports under R22.
- F5. **Interrupted purchase or review:** Returns to the existing purchase state under R24 and R28, with a clear next action for continuation or recovery.

### Business model and economics

The free document is the first useful result. Offer paid feedback when the applicant has a document worth reviewing, while retaining the direct review path for visitors who already have a CV. Explain exactly what one purchase includes; do not sell a vague promise of improved hiring outcomes.

Track contribution per completed review before scaling paid acquisition. Let P be collected revenue, T applicable tax, F payment fees, A AI cost, and R expected refund/support cost. Contribution before advertising is P − T − F − A − R. Break-even cost per click is contribution multiplied by the proportion of ad clicks that become delivered paid reviews. For illustration only, contribution of 100 MKD and a 5% delivered-purchase rate permit 5 MKD per click before profit. These numbers are not observed economics.

At a small one-time price, broad paid traffic may be uneconomic even with a good-looking page. Use separate landing paths for free-builder intent and paid-review intent, and judge each by its actual outcome. Bundles or subscriptions should remain optional experiments until repeat purchasing is demonstrated.

### Delivery sequence

1. **Commercial consistency:** Complete the denar checkout and media change under R3. Verify current and historical purchases, delivery acknowledgement, and refund handling.
2. **Landing page and visual system:** Implement R4–R8 and R25 with the existing product underneath. Preserve the video position requested by the user.
3. **Focused builder:** Implement R9–R17, with desktop and mobile review of the full draft-to-PDF flow.
4. **Focused review workspace:** Implement R18–R24 and verify interrupted and successful purchases alongside accepted-edit export.
5. **Acquisition measurement:** Compare consented landing visits, starts, completed PDFs, checkout starts, delivered reviews, and refunds under R29 before increasing spend.

Each release must remain useful independently. A complete visual remake does not require replacing the payment ledger or document engine.

### Success criteria and acceptance examples

- AE1. **Covers R1, R7, R9, R17:** A new visitor can finish and download a CV without encountering a payment or account requirement.
- AE2. **Covers R3, R28:** New checkout uses the disclosed denar amount; a previously paid GBP/EUR order retains its entitlement and can complete recovery.
- AE3. **Covers R10, R15, R16, R28:** Switching a section, template, or language does not discard entered content; a saved draft survives the redesign.
- AE4. **Covers R13, R14, R27:** At a 360 px viewport, form fields and primary actions remain usable without horizontal page scrolling or a fixed bar covering input controls.
- AE5. **Covers R19–R22:** An applicant knows what export format they are buying and can keep the original wording when reviewing a suggestion.
- AE6. **Covers R24:** A returning paid customer with an interrupted review sees continuation or recovery instructions rather than a second payment request.
- AE7. **Covers R5:** The homepage video starts only when requested and its narration and captions agree with the purchase offer.
- AE8. **Covers R8, R23, R29:** Public claims match demonstrated behavior and analytics events contain no document text or personal CV fields.

Measure builder-start rate, completed-PDF rate, delivered-review rate, refund rate, and contribution per acquired customer against a recorded baseline. Treat suggested uplift as a hypothesis, not a promise. Establish external-user traffic separately from owner testing; do not draw A/B conclusions from the current tiny sample.

### Scope boundaries

The active proposal covers the applicant journey from landing to a usable exported document, including its optional paid review. Account creation, subscriptions, job tracking, AI headshots, recruitment services, and a large template marketplace are deferred. Importing an existing document into a fully structured builder is also deferred; the review path must accurately describe its current text-extraction and revised-export capabilities.

Retain the existing advertising spending limit. This proposal does not activate campaigns, change privacy permissions, or treat a page view as a purchase. The Google Ads/GA4 linking issue remains a separate launch dependency.

### Decisions and assumptions

- **Recommended:** Redesign the interface while preserving reliable document and payment capabilities.
- **Carried from the user:** Written plan first; a broad redesign is permitted; the introduction video stays beside the homepage hero; all customer-facing price references must move together to the new denar amount.
- **Assumption:** Keep North Macedonia as the first market and Macedonian/English as the initial languages.
- **Deferred to Planning:** Exact template designs, typography scale, breakpoints, component boundaries, draft migration approach, and final microcopy.
- **Deferred to Planning:** Verify the chosen rounded MKD amount, supported checkout currency, and narration export before shipping R3; the price has not yet changed on the public site.

### Sources and research

- MakeMyCV Norwegian landing page: https://makemycv.com/no/lp/online-cv — observed 2026-10-04.
- MakeMyCV pricing: https://makemycv.com/no/pricing — observed 2026-10-04.
- MakeMyCV create flow: reached its contact-details editor from the landing-page CTA; later steps, import quality, payment, and export were not verified.
- CV Hapi public homepage: https://cvhapi.com/en/ — observed 2026-10-04.
- Current product sources: `src/homepage.js`, `src/main.js`, `src/review-ui.js`, `src/review-studio.js`, `src/payment-ui.js`, `worker/payments.js`.
- Existing commercial and acquisition context: `marketing/CAMPAIGN-SETUP.md`, `marketing/READINESS.md`, `LAUNCH-STATUS.md`, `GROWTH-PLAN-2026-10-04.md`.
