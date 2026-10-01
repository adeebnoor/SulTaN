# Contributing

Keep code identifiers, comments, documentation, commit messages, and issue templates in English. Put translated Arabic interface messages in localization files. Do not machine-translate user project values or replace them when switching languages.

Do not commit original client documents, government correspondence, personal records, secrets, or user project exports. Use fictional fixtures and explicitly label them.

Before proposing a change, run model tests, translation parity checks, the build, and full browser acceptance checks. Include what changed, why it improves a user task, and what remains unsupported. Do not describe added arithmetic or UI validation as scientific validation.

Preserve schema compatibility or provide an explicit migration. Preserve unknown-vs-zero distinctions, evidence limitations, mandatory constraints, and moonshot treatment. Do not add tracking, remote project processing, hidden paid services, or a backend without an explicit product and privacy decision.

No redistribution license is supplied at this stage. Contact the author before distributing a derivative product or branding.

## Field lifecycle and surfacing

Before adding a field, check whether an existing field already represents the concept.
A new field needs all six of the following, not just an input control:
1. A factory default in engine.js or final-core.js.
2. Import validation/allowlisting and an explicit migration when needed.
3. Arabic and English locale entries.
4. Objective consistency rules where the field is required.
5. A corresponding decision-maker report output.
6. A meaningful fictional example and positive/negative tests.

Heuristic semantic hints stay outside check(), do not affect navigation badges, and
never become approval conditions. Public surfacing must not add project fields,
remote processing, analytics, or undeclared network requests. Numeric chart
coordinates must come from the engine, with missing values kept distinct from zero.

Keep the approved visual identity. Replacing the low-resolution logo requires an
original approved vector/high-resolution asset, not an invented replacement.

## Context dossier, sector library and AI

`project.context` (sector, brief, sources, documents, reviews, AI log) is owned by
`src/context-core.js`: extend its allow-list, normaliser, `check()` rules, demo and
report fragment together, and keep `validateImport` rejecting anything that looks
like a credential. Every field added to the workspace also needs a `fgw_`/`fge_`
guidance pair in `src/locales/field-guide.js`; `tests/field-guide.test.js` fails
otherwise.

Sector-library entries (`src/sector-library.js`) need a bilingual name, issuer,
year and public URL, and must build a valid project with no blocking issue through
`SultanDraft.build` (`tests/draft-engine.test.js`). Update `verifiedOn` when you
re-check the references. Library content is a starting point for the team's own
verification, never legal advice.

Model calls go only through `src/ai.js`, only after consent, and never carry the
API key inside project data. Generated records must keep the `lib-`/`ai-` id
prefixes, and AI review findings stay warnings outside approval badges. The relay
in `server/` must remain dependency-free and must not persist request bodies.
