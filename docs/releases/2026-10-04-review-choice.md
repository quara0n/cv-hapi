# Review choice redesign — 4 October 2026

The imported-CV preparation screen now offers Review with AI and Continue without AI. A compact CV text preview remains visible. File replacement, optional vacancy/cover letter and privacy details use expandable controls. The availability success message and duplicate pricing paragraph are omitted; unavailable/paused/test notices remain.

Continue without AI opens the existing free editor and exports without an AI request or credit use. Back preserves CV and cover-letter edits and returns to the choice with consent unchecked. Completed AI results retain their existing studio and uploaded-document controls. The purchase modal, 150 MKD three-review offer, provider consent and PDF fact-check requirement are preserved.

Verification: 141 tests passed, including direct free continuation, Back retaining edits, no AI request, fact-check export gating, vacancy invalidation leaving free mode, and studio source wrapper collection. Local browser checks covered desktop and 375px English/Macedonian layouts with fictional text, and preserved edits on Back. No horizontal overflow on mobile. Earlier in this change a real fictional Cyrillic PDF was imported locally. The frontend-only local preview has no AI API; its unavailable notice is expected and is not production availability evidence. No paid AI call or real-money purchase was made for this UI change.

Code review caught a PDF export race when Back cleared editable state during the asynchronous module load. Back is now disabled during export and its handler guards busy state. The independent reproduction confirms populated PDF content with Back locked. See docs/reviews/review-choice-20261004 for the completed receipt; publication details are in LAUNCH-STATUS.md.
