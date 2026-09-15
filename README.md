# SULTAN — Strategy, with a reason.

**A free Arabic/English strategy-building workspace by Prof. Adeeb Noor.**

SULTAN connects institutional identity and ambition to explicit choices, context-appropriate references, authority, annual transitions, enablers, initiatives, funding context, and a reviewable strategy. It supports building a new strategy or improving an existing one. It is not an automatic strategy generator, accreditation service, or success-prediction model.

## Try the public beta

**Live beta:** https://sultan-strategy-beta.onrender.com

**Latest tested standalone release:** https://github.com/adeebnoor/SulTaN/releases/tag/v0.7.4 — open `SULTAN_Beta_AR_EN.html` in a browser. No subscription, account, payment card, installation, or API key is required.

If GitHub Pages is enabled for the repository, the same tested artifact can also be published at `https://adeebnoor.github.io/SulTaN/`.

Start with the **fictional example**, change a choice, criterion or authority state, then inspect the review and exports. You can also start with a blank project. Project text is never automatically translated when the interface language changes.

## What works in version 0.7.4

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

There are no analytics, tracking libraries, AI calls, or project-upload endpoints. Hosting providers can receive normal website requests. Email and GitHub feedback use external services only after explicit user action.

A completed field is not verified evidence. This edition does not authenticate decision owners, check legal authority, award accreditation, establish funding approval, or maintain a protected audit trail. Software tests do not establish field effectiveness, global novelty, or superiority over consulting firms.

Multi-user cloud collaboration, protected audit trails, direct DOCX generation, and task-level/quarterly project scheduling are outside this beta. Section-level exchange is the current collaboration mechanism.

See [privacy](docs/PRIVACY.md), [product scope](docs/PRODUCT.md), and [feedback guide](docs/FEEDBACK.md).

## Run and test locally

Use Node.js 22+ and Python 3. No third-party runtime dependencies are loaded by the web app.

```sh
node tests/engine.test.js
node tests/hardening.test.js
node tests/i18n.test.js
node tests/hardening071.test.js
node tests/performance.test.js
node tests/break-even-analytic.test.js
python3 build.py
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000/?lang=en` or `?lang=ar`.

For full browser acceptance tests:

```sh
python3 -m pip install playwright==1.57.0
python3 -m playwright install chromium
python3 tests/beta_browser.py
python3 tests/hardening_browser.py
```

`SULTAN_RENDER_ONLY=1` is for isolated inline-rendering environments; it is not a substitute for the full browser release check.

## Repository organization

`src/engine.js` contains the base deterministic model and validation rules. The 0.7 modules add Authority Space, criterion polarity, exact decision sensitivity, execution upgrades, assumptions/risks, and executive review visuals while retaining compatibility with the 0.5 project schema. Arabic is confined to localization catalogs and interface content; code identifiers and maintainer documentation use English.

The cybersecurity methodology, Adeeb Noor's institutional strategy philosophy, and REDA's emphasis on explicit data, comparison, and temporal performance underpin the design. The strategic criteria and Authority Space measures are product design choices, not a claim of field-validated universal equations.

Beta access is free. No redistribution license is included at this stage; please contact the author before redistributing the product or branding.

**Version 0.7.4 — exact decision-sensitivity beta for non-sensitive planning and feedback.**

### Review checks

The example deliberately contains unresolved and unmapped choices; it is not a completed strategy template. No initiatives means no cost estimate or budget-confirmation judgment. An explicitly entered zero remains zero. The sole Export menu provides the internal strategy, leadership strategy, escalation pack, reusable project JSON and print/PDF of the internal strategy; section exchange remains a separate control.

`tests/hardening071.test.js` contains model behavior checks. `tests/break-even-analytic.test.js` compares the exact switch-point solver with the retained scan, randomized projects, incomplete alternatives, upper-envelope crossings, and dense numerical search. `tests/hardening_browser.py` invokes `tests/review_regressions.py` for actual DOM, geometry, report, print and user-edit checks in Arabic/English at three viewport widths. `SULTAN_BASE_URL` can run the same browser suite against the public mirror. Reports under `qa/` state whether a run used a local real origin or the live URL.
