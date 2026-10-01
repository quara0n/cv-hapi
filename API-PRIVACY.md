# API privacy decision — 29 September 2026

Status: API contractual evidence remains unresolved. On 1 October 2026 the operator explicitly selected DeepSeek and directed continuation with a retention disclosure and affirmative user consent. The flag `AI_PRIVACY_APPROVED` records that operational decision; it does not certify that processing terms, a DPA or transfer safeguards have been verified. The disclosure must not claim that DeepSeek has no policy, promise deletion, or shift all responsibility to customers.

## What was verified

- [DeepSeek Open Platform Terms of Service](https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html), released 22 April 2026, effective 29 April 2026, expressly govern API integration into downstream applications.
- Section 3.3 requires the application operator to disclose processing rules, obtain consent or another applicable legal basis, and handle data-subject requests.
- Section 5.5 expressly excludes downstream end-user processing from the linked consumer privacy policy. Linking that policy cannot substantiate CV Hapi's API arrangements.
- [Consumer privacy policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html), updated 10 February 2026, describes China storage for its covered services. Because it excludes downstream end users, it does not by itself establish our API's retention, training use, processing location or transfer mechanism.
- The examined API terms do not establish a verified API-specific retention schedule, complete applicable data-processing agreement, subprocessor list or EEA transfer mechanism for this application. This is an evidence gap, not a claim that no such agreement exists.

## Required before enabling real CV submission

1. Identify the legal operator/controller and public privacy contact. Requested from the owner; do not publish private account details by inference.
2. Obtain applicable API processing terms covering roles, instructions, security, subprocessors, retention/deletion, training use and assistance with rights requests.
3. Establish processing locations and the applicable international-transfer mechanism, with an assessment of safeguards where required. General consent wording does not replace this work.
4. Document the operator's lawful basis, relevant rights/complaint route and hosting arrangements; review the complete EN/MK notice against the actual contracts and data flow. Obtain qualified legal review where needed.
5. If DeepSeek cannot support those requirements, select a provider and API plan with documented processing terms and suitable regional controls. EU processing is a useful criterion, not a blanket compliance guarantee. Do not switch provider, accept contracts or spend additional API budget without the owner's decision.
6. Complete these outstanding evidence checks and update the notice when verified information is obtained. The operator has directed continuation despite the gaps; that decision does not resolve them. The existing ten-attempt lifetime limit remains in force independently.

Local imports, local document checks, the builder and PDF/TXT exports do not require the AI privacy flag. Existing payment webhooks/status/refunds continue to work if payment integration was configured; only new checkout and AI requests are blocked by the privacy flag.

## Provider inquiry draft (not sent)

To: api-service@deepseek.com (contact published in API terms section 11)

We are assessing your API for a CV-editing application operated from Norway, serving users in North Macedonia. Before submitting end-user personal data, please provide the applicable API data-processing agreement; controller/processor roles; processing and storage countries; EEA transfer mechanism and supplementary measures; subprocessors; retention and deletion periods for inputs, outputs and logs; training-use policy and controls; and procedures supporting end-user access and erasure requests. Please distinguish API arrangements from the consumer privacy policy, which excludes downstream applications. No CVs or user data are attached.

This draft has not been sent and no new contract has been accepted.
