# Response to the expert review — version 0.9.0-beta

An external strategy consultant with more than forty years of practice reviewed the 0.8 beta and wrote a one-page note. The verdict was that SULTAN is **"أداة خبير وليست أداة مستخدم"** — an expert's tool, not a user's tool: worth it for a consultant with five to ten hours, not for a busy manager who needs a quick result. The reviewer also supplied a thirteen-page sample internal strategy report for a private school complex as the kind of output a manager expects.

This document maps every note, and the two follow-up requests from the product owner, to what changed, where, and how it is verified.

## Note 1 — كثرة الحقول (too many fields)

> More than eighty fields for a medium-sized project is exhausting.

**Change.** The workspace now has two display modes. A user's own project opens in **simple mode**: only the fields a decision-maker must see are visible, and the rest (owner names, data sources, evidence routes, maturity families, history tables, assumption registers, budget release evidence, …) fold under a *More* disclosure per record. Nothing is deleted or hidden from the model: folded fields keep their values, keep saving and keep participating in validation. **Expert mode** shows everything with one click, and the fictional example opens in expert mode so it still teaches the whole method.

More importantly, most users no longer type into those fields at all: the **guided path** asks for a sector, a brief, identity, a handful of goals and the few numbers the user knows, and the **draft engine** produces every record from the library (see Note 4). The user edits a draft instead of filling a form.

**Where.** `src/field-guide.js` (`ADVANCED` set, `disclose()`, mode switch), `src/guided.js`, `src/draft-engine.js`, `src/guided.css`.

**Verified by.** `tests/field-guide.test.js` (which fields are essential vs advanced, moonshot foothold stays essential, demo opens in expert mode); `tests/guided_browser.py` ("simple mode hides most fields without deleting them", "hidden field still saves", "advanced field edit commits", "expert mode shows everything").

## Note 2 — غياب الإرشاد (no guidance)

> Fields explain *what* to enter, never *why* it matters.

**Change.** Every workspace field now carries a **why this field** toggle that opens a short explanation of why a strategist needs it and a concrete example, in Arabic and English. The guidance is written per field pattern (107 patterns), so a field keeps its explanation wherever it appears. A heading-level switch opens or closes all explanations at once. Text fields additionally offer an **AI suggestion** button (when the assistant is enabled) that drafts the field from the project context and the guidance itself, with *use*, *append* and *dismiss*.

**Where.** `src/locales/field-guide.js` (bilingual rows), `src/field-guide.js` (`decorate()`, `suggest()`), `src/locales/guided.js`.

**Verified by.** `tests/field-guide.test.js` cross-checks every field rendered by `app.js` and `final-ui.js` against the guidance catalogue and fails on any field without a why/example pair in both languages; `tests/i18n.test.js` enforces key parity; `tests/guided_browser.py` ("why-this-field panel opens", "field assistant applies its suggestion").

## Note 3 — لا تعبئ نيابة عنك (nothing is inferred for you)

> The tool never infers anything from the context; the user must enter goals, KPIs, initiatives, follow-up and verification by hand.

**Change.** Inference now happens at two levels, and the user reviews rather than types.

1. **Deterministic drafting from the library.** Ticking a goal in the guided path (or in the *Add goals from the library* picker inside the workspace) creates the strategic choice with outcome, rationale and trade-off text, the mandates it serves, its references, the indicator with unit, direction, frequency and data source, straight-line annual targets between the baseline and target the user entered, the enablers and the initiatives with outputs and acceptance evidence, all linked. *Fill annual targets* does the same interpolation for any indicator in the workspace.
2. **AI drafting and review.** With the assistant enabled, the engine first **gathers context** (regulations, programmes, indicators, studies for the sector, using web search and the documents the user attached), then **generates the whole strategy** as structured JSON validated against the SULTAN schema, and finally **reviews** the result like a senior consultant, writing its findings into the dossier.

Both paths respect the method's honesty rules: an unknown baseline stays unknown (it is never zero), readiness is never assumed, budgets are never invented, requirements stay outside preference scoring, and AI review findings are warnings, never approval conditions. Every generated record is marked by origin (`lib-` or `ai-` ids and a provenance pill) so the expert always knows what a human wrote.

**Where.** `src/draft-engine.js` (`build`, `addGoal`, `interpolateAnnual`, `fromAI`), `src/ai.js` (`gatherContext`, `generateStrategy`, `reviewStrategy`, `suggestField`), `src/guided.js`.

**Verified by.** `tests/draft-engine.test.js` (every goal template of every sector builds a valid project with zero blocking issues; unknown numbers stay unknown; interpolation; AI output clamping and orphan handling); `tests/ai-layer.test.js` (nothing is sent before consent, documented headers, structured outputs, streaming, web-search tool, document blocks, error mapping); `tests/guided_browser.py` ("library draft built and opened in review", "numbers honoured, unknowns kept", "AI draft replaces strategic records and keeps identity", "AI output normalised", "AI expert review stored in the dossier").

## Note 4 — غياب مكتبة قطاعية (no sector library)

> There is no ready library for the education sector covering regulations, national and international goals and indicators.

**Change.** A bilingual **sector library** ships inside the application, deepest for education: general and private schools, international schools, kindergartens and training providers, with the regulators (Ministry of Education, ETEC), the national programmes (Human Capability Development Program, Quality of Life, …), the indicators the sector actually reports (NAFS results, teacher licensing, enrolment, cost per student, parent satisfaction, …) and twelve goal templates with enablers, initiatives and assumptions. Higher education, health, government and non-profit sectors are included at a lighter depth. Every reference records its issuer, year and public URL, and the library records the date it was last verified.

Each project additionally keeps its own **context dossier**: the sources the team accepted, the ones the assistant proposed and that still await review, the summaries of attached documents, the expert reviews and the AI usage log. Proposed sources appear as open issues in the References section, and the strategy report gains a section *Context sources and AI assistance*.

**Where.** `src/sector-library.js`, `src/context-core.js`, dossier card in `src/guided.js`, report fragment `E.contextReportHtml`.

**Verified by.** `tests/sector-library.test.js` (structure, bilingual completeness, indicator references resolve, URLs are public https); `tests/context-core.test.js` (schema, migration, strict validation incl. key rejection, issue rules, report fragment); `tests/guided_browser.py` ("context dossier lists accepted sources", "report carries the context section").

## Verdict — "an expert's tool, not a user's tool"

The busy manager's path is now: open SULTAN → *Start guided* → pick *Education / private school* → write three sentences → attach last year's report (optional) → confirm name, vision and beneficiaries → tick four goals and enter the numbers known → *Build the draft*. The result is a complete, validated strategy with indicators, annual targets, enablers and initiatives, opened in the review view with a banner explaining what was drafted and what still needs the team. The expert's path is unchanged and one click away.

## Follow-up request A — the engine must gather context before any design

> If the strategy is about education, the program must collect all the available documents, references and studies to serve strategy building.

Addressed by the context dossier in the engine (Note 4), by the library grounding that travels with every AI prompt, and by the **gather context** step of the guided path, which combines the sector library, optional web search and the user's own documents (PDF or text) into proposed sources and open questions that the team accepts or rejects before the draft is generated. The engine change came first; the interface only exposes it.

## Follow-up request B — the program must exploit AI, with the expert reviewing

> The user should enter general information, the AI or the program produces, then the expert reviews. Today humans do everything.

Addressed by the AI assistant (`src/ai.js`) and the AI build path of the guided wizard: general information in, a full validated draft out, then an **expert review** card in the Review section that asks the model for a senior-consultant critique and stores it in the dossier as warnings. The assistant is opt-in with explicit consent, works with the user's own key or through the small relay in `server/`, logs every call and discloses its use in the report. See `docs/AI_ASSISTANT.md` and `docs/PRIVACY.md`.

## What the review did not ask for and we did not change

The deterministic method is untouched: criteria, weights, Authority Space, the exact decision switch-point, mandatory requirements outside ranking, unknown-versus-zero, and the report structure. All earlier browser and model gates run unchanged and green on this release.
