# SULTAN — Strategy, with a reason.

**A free Arabic/English strategy-building workspace by Prof. Adeeb Noor.**

SULTAN connects institutional identity and ambition to explicit choices, context-appropriate references, authority, annual transitions, enablers, initiatives, funding context, and a reviewable strategy. It supports building a new strategy or improving an existing one. Since 0.9 it can draft that strategy for you from a sector library or with an optional AI assistant; the draft is a starting point the team reviews, not a finished strategy. SULTAN is not an accreditation service or a success-prediction model.

## Try the public beta

**Live beta:** https://sultan-strategy-beta.onrender.com

**Latest tested standalone release:** https://github.com/adeebnoor/SulTaN/releases/tag/v0.12.0-beta — open `SULTAN_Beta_AR_EN.html` in a browser. No subscription, account, payment card, installation, or API key is required.

If GitHub Pages is enabled for the repository, the same tested artifact can also be published at `https://adeebnoor.github.io/SulTaN/`.

Start with the **fictional example**, change a choice, criterion or authority state, then inspect the review and exports. You can also start with a blank project. Project text is never automatically translated when the interface language changes.

## New in 0.9.1-beta — consulting audit safeguards

AI drafts retain existing KPI meanings and entered measurements, leave unsupported initiative costs unknown, and label factual proposals. Incomplete replacement drafts are rejected before changing the project. Reviews become stale when their input content changes; leadership reports retain unresolved issues. These safeguards do not validate earlier AI drafts or replace sector expert review and field pilots.

## New in 0.9.0-beta — guided, context-aware, AI-assisted

This release answers an external expert review (40+ years in strategy consulting) that found the workspace exhausting (80+ fields), unexplained (fields say *what*, not *why*), passive (nothing is inferred for the user) and context-free (no sector library). What changed:

- **Guided path** (`#guide`, the first button on the home page): sector → brief and documents → context gathering → identity → goals and the few numbers you know → a linked draft for review. The full workspace stays one click away for review.
- **Sector library** bundled in the app: education (general and private schools, international schools, kindergartens, training), higher education, health, government, non-profit and technology/digital services, with regulators, national programmes, indicators, goal templates, enablers and initiatives written in the SULTAN vocabulary. Library drafts carry `lib-` ids. See [docs/SECTOR_LIBRARY.md](docs/SECTOR_LIBRARY.md).
- **Context dossier** on every project (`project.context`): sector, brief, regulations/programmes/indicators/studies/benchmarks with issuer, year and URL, attached-document summaries, expert-review findings and the AI usage log. Proposed sources are open issues until the team accepts them; the report gains a *Context sources and AI assistance* section.
- **Optional AI assistant** (off by default, explicit consent): gathers sector context with optional web search and your documents, generates a full strategy as validated structured JSON, suggests text for any field, and reviews the draft like a senior consultant. Works with your own API key in the browser or through the small relay in `server/`. AI records carry `ai-` ids and every call is logged and disclosed. See [docs/AI_ASSISTANT.md](docs/AI_ASSISTANT.md).
- **Simple / expert mode**: your own projects open with the essential fields only; advanced fields fold under *More* and keep their values. One click switches to expert mode. The fictional example opens in expert mode.
- **Why this field** on every workspace field, with an example, in Arabic and English (107 field patterns, parity-tested), plus a one-click *AI suggestion* on text fields.
- **Expert lenses**: the method owner's thinking patterns (concentrate resources rather than spread them, evaluate before you cut, stabilize before you climb, decompose external indices, one moonshot scaled to us, partner or acquire and say what we bring, find the recurring business, few verticals with large tickets and a national agenda, follow the funder, …) run as advisory checks in Review, travel with every AI drafting and review prompt, and **learn**: add your own patterns, turn an AI finding into one, paste your notes and keep the extracted patterns, mark lenses useful or "not here". See [docs/EXPERT_LENSES.md](docs/EXPERT_LENSES.md).
- **Technology and digital services sector** in the library (systems integrators, cybersecurity, fintech, software): recurring services over project tickets, vertical focus, partnerships and selective acquisitions, AI fraud detection for banks, security for AI, ECC compliance, divesting small-ticket work.
- **Honesty rules kept**: unknown is never zero, readiness is never assumed, budgets are never invented, AI review findings are warnings and never approval conditions.

The response to each expert note is documented in [docs/EXPERT_REVIEW_RESPONSE.md](docs/EXPERT_REVIEW_RESPONSE.md).

## What works since version 0.7.4

- Institution identity, beneficiaries, distinctive assets, context, vision, mandates, and chosen contribution.
- Strategic alternatives, explicit trade-offs, moonshot footholds, assumptions, strategic risks, and documented selection decisions.
- References and compatibility review, current/target states, annual milestones, acceptance evidence, and indicators.
- Multi-criteria comparison with editable weights and anchors, optional **Benefit** or **Cost/Burden** direction, missing-score ranges, live sensitivity preview, and **exact decision switch-point / break-even weight** analysis in the normal case.
- The exact switch-point solver uses the same proportional redistribution rule as the prior scan, with the earlier scan retained as a fallback for boundary criterion weights or tied current leaders.
- Mandatory requirements remain outside discretionary ranking. Strategic value is not multiplied by readiness, current capability, historical performance, or authority clearance.
- **Authority Space** separates ownership clarity, decision-status clarity, and decision clearance. Unknown remains unknown. Small authority maps emphasize counts instead of misleading percentages.
- Authority unknown, pending, and blocked states enter the same consistency-note system as the rest of the strategy.
- Time-aware authority view plus an exportable **Escalation Pack** with decision owner, due year, activation/escalation route, and fallback if delayed or refused.
- Linked initiatives, dependencies, annual funding, a visual execution timeline, and a review view that places strategic value beside declared investment without dividing one by the other.
- **Value × Authority** matrix for discussion only; the axes are deliberately not multiplied.
- Per-section issue/completion badges and stronger guardrails, including disabled strategy export on an empty project and automatic JSON backup before replacing populated work with a new project or example.
- Local draft recovery, validated/whitelisted JSON import/export, and browser-history navigation.
- Section-level JSON export/import for lightweight collaboration without a server: one owner can complete a section and another user can merge it into the project.
- Separate **Internal** and **Leadership** HTML reports, including Authority Space, escalation information, and Gregorian + Hijri report dates. Browser print can be used to produce PDF.
- Optional feedback through an email draft or public GitHub issue draft; neither channel automatically includes project data.

## Method notes

SULTAN uses a transparent weighted additive comparison for discretionary alternatives. A Benefit criterion uses the entered 0–100 score directly. A Cost/Burden criterion uses `100 − raw score` before weighting, so a lower raw burden is better. Users define the 0 and 100 anchors themselves. Scores describe stated preference judgments; they are not probabilities of success.

Weight normalization closes at exactly 100%. If every criterion weight is zero, SULTAN distributes 100% equally rather than producing NaN/Infinity. For sensitivity, the interface provides both a live hypothetical slider and the nearest criterion weight at which the leading fully scored alternative changes while other weights are redistributed proportionally. In 0.7.4, SULTAN solves that switch-point analytically when the current comparison is non-degenerate; the retained grid scan is used as a safe fallback for boundary-weight or tied-leader cases.

Authority Space is descriptive, not predictive. It does not claim that authority has been legally verified, and it does not discount strategic ambition because authority or capability is incomplete.

## Privacy and beta limitations

Project inputs stay in local browser storage. They are **not encrypted, synchronized, or backed up by SULTAN**. Export JSON regularly; clearing browser data can remove the local draft. Do not use confidential institutional information or personal records in this public beta.

There are no analytics, tracking libraries or project-upload endpoints. The only outbound calls are the optional AI assistant's requests to the Anthropic API or to the Gemini/Anthropic relay, and they happen only after you switch the assistant on and give consent. Hosting providers can receive normal website requests. Email and GitHub feedback use external services only after explicit user action.

A completed field is not verified evidence. This edition does not authenticate decision owners, check legal authority, award accreditation, establish funding approval, or maintain a protected audit trail. Software tests do not establish field effectiveness, global novelty, or superiority over consulting firms.

Multi-user cloud collaboration, protected audit trails, direct DOCX generation, and task-level/quarterly project scheduling are outside this beta. Section-level exchange is the current collaboration mechanism.

See [privacy](docs/PRIVACY.md), [product scope](docs/PRODUCT.md), and [feedback guide](docs/FEEDBACK.md).

## Run and test locally

Use Node.js 22+ and Python 3. No third-party runtime dependencies are loaded by the web app.

```sh
for suite in tests/*.test.js; do node "$suite"; done   # engine, i18n parity, library, draft engine, context, AI layer, relay, field guide …
python3 build.py
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000/?lang=en` or `?lang=ar`.

For full browser acceptance tests:

```sh
python3 -m pip install playwright==1.57.0
python3 -m playwright install chromium
python3 tests/review_regressions.py
python3 tests/beta_browser.py
python3 tests/hardening_browser.py
python3 tests/surfacing_browser.py
python3 tests/rev3_browser.py
python3 tests/guided_browser.py      # guided path, dossier, simple/expert, AI path against an in-page fake API
```

To run the AI relay locally: `GEMINI_API_KEY=… ALLOWED_ORIGINS=http://localhost:8000 node server/ai-proxy.js` (see [server/README.md](server/README.md)). The web app also works with your own key entered in the AI settings, without any relay.

`SULTAN_RENDER_ONLY=1` is for isolated inline-rendering environments; it is not a substitute for the full browser release check.

## Repository organization

`src/engine.js` contains the base deterministic model and validation rules. The 0.7 modules add Authority Space, criterion polarity, exact decision sensitivity, execution upgrades, assumptions/risks, and executive review visuals while retaining compatibility with the 0.5 project schema. The 0.9 modules add the context dossier (`context-core.js`), the sector library (`sector-library.js`), the draft engine that turns library templates or AI JSON into validated projects (`draft-engine.js`), the AI client (`ai.js`), field guidance and simple/expert disclosure (`field-guide.js`), the guided path (`guided.js`) and the expert lenses (`expert-lens.js`, `lens-ui.js`); `server/ai-proxy.js` is the optional dependency-free relay. Arabic is confined to localization catalogs and interface content; code identifiers and maintainer documentation use English.

The cybersecurity methodology, Adeeb Noor's institutional strategy philosophy, and REDA's emphasis on explicit data, comparison, and temporal performance underpin the design. The strategic criteria and Authority Space measures are product design choices, not a claim of field-validated universal equations.

Beta access is free. No redistribution license is included at this stage; please contact the author before redistributing the product or branding.

**Version 0.9.0-beta — guided, context-aware, AI-assisted beta for non-sensitive planning and feedback.**

### Review checks

The example deliberately contains unresolved and unmapped choices; it is not a completed strategy template. No initiatives means no cost estimate or budget-confirmation judgment. An explicitly entered zero remains zero. The sole Export menu provides the internal strategy, leadership strategy, escalation pack, reusable project JSON and print/PDF of the internal strategy; section exchange remains a separate control.

`tests/hardening071.test.js` contains model behavior checks. `tests/break-even-analytic.test.js` compares the exact switch-point solver with the retained scan, randomized projects, incomplete alternatives, upper-envelope crossings, and dense numerical search. `tests/hardening_browser.py` invokes `tests/review_regressions.py` for actual DOM, geometry, report, print and user-edit checks in Arabic/English at three viewport widths. `SULTAN_BASE_URL` can run the same browser suite against the public mirror. Reports under `qa/` state whether a run used a local real origin or the live URL.

## Council review and board packs

Version 0.11.0-beta adds signed fixed snapshots, three-owner input, adversarial questions, portable decision checkpoints and one-click board packages. See [workflow, privacy limits and verification](docs/COUNCIL.md). Full committee work is best on desktop; the three-line homepage preview remains mobile-friendly.

Version 0.12.0-beta adds Arabic workspace breadcrumbs, planning context independent of language (Saudi / international), explicit country and currency without amount conversion, automatic offline preparation, a social image, search metadata, and a visible HTML first-paint shell. See [international mode and hosting migration](docs/INTERNATIONAL_HOSTING.md).
