# The sector library

`src/sector-library.js` ships, inside the application and without any network request, the regulatory and indicator context a strategy team usually has to assemble by hand. It is the answer to the expert note that SULTAN had "no ready library for the education sector covering regulations, national and international goals and indicators".

## What it contains

Every sector has a bilingual name and short description, its regulators, the institution **types** it covers, text **templates** (mission, beneficiaries, context, what we will not do, culture), national **programmes**, **regulations** (id, kind, status, applicable types, name, issuer, URL, year, summary, relevance), **indicators** (id, scope, direction, name, unit, frequency, data source, domain, references) and **goal templates**. A goal template is a complete strategic choice in the SULTAN vocabulary: group, type (requirement, differentiation, moonshot, divest), indicator, references, programmes, title, outcome with `{kpi}`, `{baseline}`, `{target}`, `{unit}` and `{endYear}` placeholders, why us, trade-off, foothold for moonshots, stop evidence and divestment fields where relevant, enablers, initiatives (kind, years, output, acceptance evidence, dependencies), assumptions and a risk.

| Sector | Types | Goal templates | Regulations | Indicators |
|---|---|---|---|---|
| Education (`edu`) | general/public, private, international, kindergarten, training | 12 | 15 | 21 |
| Higher education (`highered`) | university and college types | 5 | 5 | 6 |
| Health (`health`) | hospital and clinic types | 5 | 6 | 6 |
| Government (`gov`) | agency types | 3 | 4 | 4 |
| Non-profit (`nonprofit`) | association and foundation types | 3 | 4 | 5 |

Education is the deepest: quality (NAFS-type results), teachers (licensing and professional development), operational efficiency, revenue for private and international schools, parent satisfaction, digital learning, expansion as a moonshot, regulatory compliance as a requirement, cash flow, stopping low-impact activities as a divestment, early childhood and inclusion.

`SultanLibrary.verifiedOn` records the date the references were last checked. Library content is a starting point for the team's own verification; it is not legal advice and not an accreditation checklist.

## How it is used

- **Guided path.** Step 1 picks the sector and type; step 4 lists the goal templates grouped by theme with the indicator, unit and direction, and asks only for the baseline and target the user knows. `SultanDraft.build` turns the ticked goals into a validated project: options, mandates from programmes, references, indicators with straight-line annual targets, enablers (status `unknown`), initiatives (budgets `null`) and accepted context sources. All generated records carry `lib-` ids and show a *library* provenance pill.
- **Inside the workspace.** *Add goals from the library* (Choices) adds templates to an existing project; *Fill annual targets* (each indicator) interpolates the annual rows between baseline and target without overwriting values a person entered unless asked.
- **AI grounding.** `SultanLibrary.grounding(sectorId, typeId, lang)` produces the regulations, programmes and indicators block that travels with every AI prompt, so the model starts from verified public references rather than its own recollection, and the extraction step is told never to add sources that are not in the memo.
- **Context dossier.** Library references used by a draft are recorded as *accepted* sources with origin `library`; sources proposed by the assistant or added by the user are kept apart by origin.

## Adding or changing content

1. Add the entry under the sector with bilingual text through `t(ar, en)`, a public `https` URL, an issuer and a year.
2. Point goal templates at indicator ids and reference ids that exist in the same sector; `tests/sector-library.test.js` checks the links and the bilingual completeness.
3. Run `tests/draft-engine.test.js`: every goal template of every sector must build a project with zero blocking issues, round-trip through `validateImport`, keep unknown numbers unknown and keep budgets unestimated.
4. Update `verifiedOn` when you re-check the references, and mention the change in `CHANGELOG.md`.

Goal and indicator ids are stable identifiers used in saved projects (`lib-<sector>-<goal>-…`), so rename them only with a migration.
