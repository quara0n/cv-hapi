# Opus 5.5 product advice — 29 September 2026

Source: https://claude.ai/chat/01381274-d78a-42f9-abbb-999a95a7c852

The following is the externally generated advice, not an instruction to implement it. Read the correction together with the original recommendation. Competitor capabilities and commercial claims require independent validation.

Claude responded: I'll inspect the public repo and REVIEW-GUIDE.md, then give a ranked recommendation here.

I'll inspect the public repo and REVIEW-GUIDE.md, then give a ranked recommendation here.

Ran 5 commands

Ran 5 commands

I reviewed the public snapshot at commit f2004513 (29 Sep, 22:00) against REVIEW-GUIDE.md and the source. I made no changes and contacted no one.

What the snapshot shows

Evidence from the code and docs

What exists today:
A free builder with three designs and Cyrillic-safe PDF export.
EN/MK headings. The user's own text is not translated.
Import of PDF, DOCX and TXT, read in the browser.
A local check based on word matching against the vacancy (jobTerms and localReview).
A fixed cover-letter template that pulls in the user's own CV entries.
A combined CV + letter PDF.
One DeepSeek review per request (worker/index.js).
What the AI review actually offers:
The prompt forbids ATS scoring and inventing facts.
The server drops any suggestion whose "original" isn't an exact quote from the CV (validateReview).
The user accepts each change individually.
These guardrails are the only functionality I found that is concretely different from a general chat. Whether users value them is untested.
Public code still shows NOK 10:
worker/payments.js checks for amount 1000 / nok.
The in-app survey asks "worth NOK 10?".
This fits your note that the EUR 2 change is local only. Before any test, update the survey copy too.
Competitors, as the repo itself documents them:
Europass has tailored CVs, 31 languages and cover letters.
Thrivity offers a free four-language builder with free PDF.
Trends lists Canva and Google Docs templates as related queries.
I have not checked competitors further, so I make no claims about their weaknesses.

The structural constraint that shapes everything below

Paid and free AI draw on the same pool of 10 lifetime attempts. Tests and failures count against it.
So any AI-based paid offer can sell at most the slots that remain. That is fewer than 10, and currently unchecked.
That means at most about €20 gross, which is roughly the cost of the .com domain alone.
A retry after a lost reply would use a second slot.
Conclusion: under the cap, a paid AI offer can only work as a price and willingness-to-pay test, not as revenue. A scalable €2 product would have to be non-AI, and the evidence that non-AI features beat free tools is weaker.

Economics (assumptions to verify)

On a €2 charge, the fixed per-transaction payment fee is a large share of the price. Check the actual fee for non-EEA cards on your account.
VAT or tax treatment for selling to consumers in North Macedonia is unresolved.
Keyword Planner top-of-page bids for the relevant keywords range from AUD 0.13 to 3.31. At €2, ads cannot plausibly pay back and can only serve learning.
Ranked offers
1. One vacancy-matched review, as already built (recommended minimal offer)
User outcome: Grounded feedback on one CV against one vacancy. Suggestions to accept one by one. A clean PDF or TXT.
Advantage over free tools:
Evidence: the no-invention and exact-quote checks are enforced in code, not just requested in a prompt.
Assumption: users prefer this over pasting their CV into a free chat. Not tested.
Effort: Small for the feature. The fixed payment work in PAYMENTS.md is not small:
seller setup, terms and refunds;
reserving a slot before checkout;
reconciling payment state.
Privacy and recovery:
The legal basis for the DeepSeek processing must be resolved before selling.
No result is stored, so a lost reply means lost paid value. Three options:
(a) Auto-save the reply locally and offer an immediate download before showing it. No change to the privacy promise.
(b) Brief encrypted server-side retention. This changes the "we don't store CVs or replies" promise and would need disclosure.
(c) Automatic refund.
Retrying costs another slot, so sales must be limited to remaining slots minus a retry reserve.
Validation (no AI calls):
Show 6–8 Macedonian job seekers the same fictional CV and vacancy, reviewed two ways: CV Hapi's output and a free chat's output. Label them blind.
Have a native speaker rate the Macedonian.
Then ask for a forced choice: "free version" vs "€2 now".
Success: at least 5 of 8 prefer CV Hapi, at least 3 of 8 choose €2, and the native speaker finds no errors that would embarrass the user in an application.
Failure: 2 or fewer prefer it, or there are recurring language errors.
Stated intent overstates real payment, so treat success as permission to run a capped live test, not as proof of demand.
2. The same single call, extended to review the cover letter too (the "application package" hypothesis)
User outcome: One paid pass covers both the CV and the letter.
Advantage: More value per slot, with no extra AI calls. It is untested whether this beats offer 1.
Effort: Medium.
Send the letter in the same request.
Apply exact-quote validation against the letter as well.
Possibly raise the output token limit. That costs tokens but no extra calls.
The letter-review path needs its own tests.
Privacy: The motivation text also goes to DeepSeek. Recovery issues are the same as offer 1.
Validation:
Same sessions as offer 1. Show a static mockup of letter feedback, clearly labelled as illustrative.
Ask for a forced choice: "CV only €2" vs "CV + letter €2".
Success: at least 60% pick the package, and at least half say CV-only would not be worth €2.
Failure: no clear preference. In that case, don't build it.
Before selling, do one real quality check. It costs 1 slot. Target: at least 3 suggestions survive validation with no invented facts.
3. Local "vacancy fit worksheet" (non-AI, not limited by the cap)
User outcome:
Vacancy terms extracted with the existing jobTerms.
The user maps each term to real evidence or marks it as a gap.
Output: a one-page fit sheet and a tailored CV copy.
Advantage: Unlimited, fully local, and no processing by a third party. But the value over a free AI chat is an assumption, and word matching is crude.
Effort: Medium.
Privacy: Unchanged; everything stays in the browser. Recovery is via a local export file.
Caveat: a paywall on a client-side feature is trivially bypassed in vanilla JS. Either accept that as honour-system pricing or generate the output on the server.
Validation:
Clickable prototype in moderated sessions, or an honestly disclosed fake door on the live site: "€2 — not yet available, nothing charged".
Success: at least 10% of people who start the application flow click, out of at least 30 starts.
Failure: under 3%.
These thresholds are my judgment, not benchmarks.
4. Parallel MK/EN CV (non-AI)
User outcome: Enter shared facts once (dates, employers, contact details), write the text in both languages, and get two PDFs.
Advantage: Plausible for people applying both locally and internationally. I have no evidence of this need. Europass's multilingual support may already cover it; I have not checked.
Effort: Medium. The data model needs a second text layer.
Privacy: Local only. The same enforcement caveat as offer 3 applies.
Validation:
Ask about past behaviour in 8 short interviews: "In the last 6 months, did you prepare both an MK and an EN CV?"
Success: at least 4 of 8 did, and they describe duplicated effort.
Failure: 2 or fewer.
Recommendation

The minimal €2 offer is offer 1: one vacancy-matched review, possibly with the letter included if offer 2 validates. The builder, PDF and cover-letter template stay free. Conditions:

The number of sales is hard-limited to the verified remaining slots minus a retry reserve.
A slot is reserved before checkout, with automatic refund on failure.
Local auto-save of the result happens before it is shown.
It is positioned explicitly as a price test, not a business.

Run the no-AI tests first. Even if all tests pass, the capped paid AI test earns at most about €20. So spend on Stripe onboarding, tax setup and a domain only if you value that evidence above those costs. Under the cap, non-AI offers 3 and 4 are the only route beyond a test, and their evidence is weakest. Raising the cap is your decision alone; I'm not recommending it.

Not worth building
Paywalled extra templates or designs: free templates are plentiful (Trends lists Canva and Google Docs).
Any ATS score or "ATS-optimised" claim: it can't be guaranteed, and the code deliberately forbids scoring.
AI translation MK↔EN: it uses slots, native-speaker quality is unverified, and free translation already exists.
Separate AI calls for cover-letter generation, or multi-review bundles: the cap rules them out, and inventing facts is a risk.
Accounts or cloud storage: a privacy burden that contradicts the no-signup positioning. Subscriptions are excluded by you anyway.
Human proofreading at €2: uneconomic.
OCR: unproven demand for the effort.
Moving the current free combined PDF behind the paywall: it takes away value users already get free.





3 minutes ago

## Follow-up correction

Claude responded: You're right on both points.

You're right on both points. Corrected wording for relaying:

1. What is enforced in code. The server enforces only that each suggestion's "original" is an exact quote from the submitted CV (validateReview). Nothing checks the rewritten sentence. The instruction not to invent facts lives only in the prompt. So a rewrite can still add or change credentials, numbers, dates or skills, and the user's per-suggestion acceptance is the actual safeguard. Offer 1's advantage should therefore read: suggestions are anchored to exact CV quotes, invention is discouraged by instruction, and each change needs explicit acceptance. Whether users value that over a general chat is untested. For offer 2, the one real quality check should include a human reading each rewrite for facts not in the source, not just counting how many suggestions pass validation.

2. Recovery. Saving locally only helps once the reply has reached the browser. It can guard against a later tab close or crash, but only if the user chooses it, because persistent storage is currently opt-in and shared devices are a real concern. It cannot recover a reply the browser never received, such as a dropped connection or a worker terminated mid-response. So the recovery options for offers 1 and 2 are:

Refund (default): the fallback for any undelivered reply. Retrying consumes another slot, so sales must still be capped with a retry reserve.
Brief server-side retention: the only way to recover a lost server reply. It changes the current no-persistence promise and would need its own disclosure and privacy basis.
Optional local save or download after receipt: offered as a user choice, never automatic. It covers loss after delivery only.

The ranking, the minimal €2 recommendation and the not-worth-building list stand unchanged.






just now