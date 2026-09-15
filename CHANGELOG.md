### 0.8.0-rc — surfacing completion
- Fictional example now demonstrates all four choice types, including a selected stop/merge decision with released-resource redeployment, plus delta, maturity and KRI tracks.
- Client documents now surface evidence-gated funding, dated risk sources and maturity families.
- Public landing preview leads with Authority Space and makes the fictional example the primary CTA, with explicit local/offline/browser-verification evidence.
- `riskDate` imports accept `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `null` and empty values, normalized to ISO dates where applicable.
- Deterministic semantic hints S1–S5 are advisory only and remain outside `check()` and approval badges.
- Brand uses one consistent embedded mark, a single watermark, and bidi-safe RC version display.
- Browser regression script is independently executable; CI seals the `v0.8.0-rc` tag only after the full browser gate passes.

# Changelog

## 0.8.0-rc — Client export and execution-view stabilization

- Replace the canvas/`foreignObject` PDF generator with the browser print-to-PDF path; remove the tainted-canvas failure mode and raw DOM exception alerts.
- Allocate document numbers only after a download or print route is successfully initiated, so failed PDF pop-up attempts do not burn document numbers.
- Move the final locale extension into `src/locales/final.js`, bringing final bilingual keys under the standard parity test.
- Localize client-deliverable and decision-extension headings and escalation route/fallback labels.
- Render full-horizon KPI/KRI trajectories with visible target and actual markers and preserve qualitative observations as recorded evidence.
- Show the four-state status legend once per progress panel instead of repeating it under every indicator.
- Apply the official SULTAN navy/gold identity layer and logomark assets.
- Consolidate final report/dashboard/version patches into the final integration layer, reducing loaded scripts from 27 to 21 and reducing report wrapping to one final wrapper.
- Expand release-candidate browser regressions around exports, document numbering, trajectories, qualitative status, localization and responsive rendering.

## 0.7.4 — Exact Decision Sensitivity

- Replace the normal 0.5%-step decision switch-point scan with an exact analytical solver for complete, non-degenerate comparisons under proportional redistribution of the remaining criterion weights.
- Preserve the previous scan as an explicit fallback for boundary criterion weights and tied current leaders.
- Verify the analytical solver against representative benefit/cost cases, 250 randomized complete projects, 150 randomized incomplete projects, upper-envelope checks, and dense 0.1% numerical searches around reported thresholds.
- Retain the 0.7.3 switch-point cache, so unrelated project edits reuse the prior result while score/weight/polarity/label changes invalidate it.
- Keep exact decision sensitivity separate from strategic value, capability/readiness, and Authority Space; no new combined score is introduced.
- Include analytical-solver evidence in CI and in the published release package.

## 0.7.3 — Performance and standalone-build hardening

- Cache decision switch-point analysis until criteria weights/direction, option scores, or output labels change; unrelated project edits reuse the prior result.
- Keep the existing 0.5%-step break-even solver unchanged in this release while eliminating repeated recomputation on unrelated re-renders.
- Fail the standalone build if any `src/` JavaScript or stylesheet reference survives in the generated HTML.
- Add cache-invalidation tests and a CI assertion that the standalone artifact contains no external `src/` asset references.
- Preserve the existing Arabic/English, authority, report, mobile and review-regression gates.

## 0.7.2 — Review semantics and behavioral verification

- Distinguish no initiatives, missing estimates, explicit zero cost, and reported budget confirmation. Missing annual rows are counted as unestimated.
- Enrich the fictional example with cost-direction anchors, four populated assumptions/risk entries, blocked and ready enablers, and a conditionally selected unmapped/uncosted choice. Original option values are preserved.
- Use Latin digits for Gregorian/Hijri report dates and translate the escalation revision label.
- Replace competing report/project/print buttons with one export menu. The primary strategy export and print now use the same complete internal report; leadership output remains separate.
- Label 0/100 axis endpoints, all four quadrants, and axis directions in both languages; clarify that the midpoint is not an approval threshold.
- Replace source-string assertions with behavioral model cases and rendered browser regressions invoked by hardening_browser.py at 1280, 390 and 320 pixels in Arabic and English.
- Fix the live sensitivity listener to call the model rankingAt function. No project input is uploaded or synchronized.

## 0.7.1 — Hardening

- Fix bilingual report dates, leadership numbering, Authority Space localization, RTL matrix geometry, unknown-authority visibility, meaningful switch-point reporting, unknown budget visibility, escalation-pack identity/scope, criterion-polarity warnings, and destructive-backup timing.
- Move polarity, switch points, and authority issue semantics into the deterministic engine and expand locale/regression coverage.
- Consolidate overlapping review exports behind one export menu.

## 0.7.0 — Execution upgrade

- Redesign Authority Space to separate ownership clarity, status clarity, and decision clearance; show counts for small samples and preserve unknowns explicitly.
- Surface authority unknown/pending/blocked states in the global consistency-note system instead of allowing an apparently clean section.
- Add time-aware authority summaries and an exportable **Escalation Pack** with decision owner, due year, activation/escalation route, and fallback if delayed or refused.
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
