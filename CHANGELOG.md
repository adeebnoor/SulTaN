# Changelog

## 0.7.0 — Execution upgrade

- Redesign Authority Space to separate ownership clarity, status clarity, and decision clearance; show counts for small samples and preserve unknowns explicitly.
- Surface authority unknown/pending/blocked states in the global consistency notes instead of allowing an apparently clean section.
- Add time-aware authority summaries and an exportable escalation pack using decision owner, route, fallback, and due year.
- Add internal and leadership strategy exports that include Authority Space and escalation material, plus Gregorian and Hijri report dates.
- Add section-level JSON export/import for lightweight collaboration without a server.
- Add decision switch-point (break-even weight) analysis and a live sensitivity preview that does not mutate the project.
- Add visual execution timeline, per-section issue badges, empty-export guardrails, and automatic backup before replacing a populated project.
- Keep strategic value separate from readiness/authority and keep mandatory requirements outside discretionary ranking.

## 0.6.1 — Hardening release

- Reject unexpected fields during project import while preserving the 0.5-compatible project schema.
- Commit a field edit once instead of incrementing the project revision on every keystroke.
- Add short-lived local recovery for uncommitted edits and safer synchronization between open tabs.
- Preserve user-controlled disclosure state across workspace re-renders.
- Improve field error accessibility and add regression coverage for import hardening and browser editing behavior.
- Keep the strategic model, scoring logic, example content, and bilingual product flow unchanged.

## 0.6.0 — Free bilingual public beta

- Separate public product entrance with a fictional interactive preview, guided first-use journey, and clear free/no-account positioning.
- Full Arabic/English interface catalogs, locale-aware layout and reports, with project text preserved across language changes.
- English maintainer documentation and public issue templates.
- Optional feedback dialog with email/copy and explicit public GitHub drafting; project data is never appended.
- Responsive workspace refinements, keyboard-operable preview tabs, accessible feedback dialog, and local-draft deletion.
- Model schema remains compatible with 0.5 exports. Underlying strategic scoring is not replaced or represented as field-validated.
- Expanded translation and browser acceptance tests; full-origin tests distinguish genuine persistence from isolated rendering checks.

## 0.5.1

- Arabic strategy workspace with linked identity, choices, references, annual transitions, enablers, initiatives, and reports.
- Reveal and focus newly added records.
