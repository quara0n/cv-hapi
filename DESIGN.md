# CV Hapi design principles

Help people improve their own CV, one section at a time. Give the document and the next action more prominence than explanatory copy.

## Visual language

- Warm neutral page background, white editing surfaces, dark ink text, blue primary actions. Green indicates an applied change; it is never a hiring score.
- Use the existing system sans font. Body text is 15–16px with generous line height; headings have a clear hierarchy without excessive size.
- Space on a 4px scale. Prefer whitespace and thin separators to multiple nested bordered cards.
- Use a single filled primary action in each task area. Secondary actions are outlined or text buttons.
- Use restrained motion, and respect reduced-motion preferences. Keep decorative effects outside the editing task.

## Review workflow

- Upload and consent come before an AI request. Payment and provider details remain available before submission.
- After a review, show a section navigator, one focused editor, and a revised-document preview.
- Keep section drafts separate from the revised document. Show changes for approval before applying them; retain undo and the unchanged source.
- Distinguish provider rewrites from adaptable example phrases. Never insert qualifications, dates, results or other facts automatically.
- Desktop can display editing and preview together. Smaller screens use explicit Edit and Preview controls, with comfortably sized touch targets.
- Full-text editing and detailed advice remain available on demand. Do not hide essential consent, errors or confirmation behind tooltips.

## Accessibility and maintenance

- Help works with click, tap, focus and keyboard as well as hover. Focus states remain visible.
- Navigation conveys the selected section and applied state in text/ARIA, not colour alone.
- Preview text is escaped. Treat document text and provider output as untrusted content.
- Follow these patterns in the existing JavaScript/CSS stack. Do not introduce a UI framework for visual polish alone.

Design references: Component Gallery for interaction patterns; Refero Styles and DesignMD for consistent visual rules; Minimal Gallery for restrained composition. This implementation uses original project code, not copied third-party components or branded assets.

## Guided next actions

After a review, start with a short three-step guide and one recommended section. Keep wording ideas and full feedback collapsed until requested. Show editing, change confirmation, and the saved document as separate tasks at every viewport size. After saving, offer the next section; skipping is always optional. Never auto-apply an AI rewrite or treat reviewing every section as a requirement for downloading.
