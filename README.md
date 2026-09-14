# SULTAN — Strategy, with a reason.

**A free Arabic/English strategy-building workspace by Prof. Adeeb Noor.**

SULTAN connects institutional identity and ambition to explicit choices, context-appropriate references, annual transitions, enablers, initiatives, and a reviewable strategy draft. It supports building a new strategy or improving an existing one. It is not an automatic strategy generator or an accreditation service.

## Try the beta

**[Download the tested bilingual beta](https://github.com/adeebnoor/SulTaN/releases/tag/v0.6.1)** — open the `SULTAN_Beta_AR_EN.html` release asset in a browser. No subscription, account, payment card, installation, or API key is required.

**Hosting activation is still required.** The repository owner must enable GitHub Pages before the following website addresses become available:

[English interface after activation](https://adeebnoor.github.io/SulTaN/?lang=en) · [Arabic interface after activation](https://adeebnoor.github.io/SulTaN/?lang=ar)

To activate: open **Settings → Pages → Build and deployment → Source → GitHub Actions**, then rerun **Test and package SULTAN**. The publication workflow deploys only an artifact that passed the full browser checks. It never requests an administrative credential from the application or silently reports a missing site as live.

Start with the **fictional example**, change one choice or weight, then export a strategy draft. You can also start with a blank project. The language control changes the interface, not user-entered project text. Switching languages preserves the local draft and current section when browser storage is available. If storage cannot save an edited draft, the switch is blocked to prevent data loss.

## What works in version 0.6.1

- Institution identity, beneficiaries, distinctive assets, context, vision, and mandate/contribution mapping.
- Strategic alternatives, explicit trade-offs, moonshot footholds, and documented selection decisions.
- References and compatibility review, current/target states, annual milestones, acceptance evidence, and indicators.
- Editable criteria, score anchors and weights, missing-score ranges, and limited local sensitivity checks.
- Enablers covering authority, legislation, capability, incentives, and operating arrangements.
- Linked initiatives, annual funding, dependencies, review notes, and actual measurements.
- Local draft recovery, validated JSON import/export, and localized, script-free HTML strategy reports suitable for printing.
- Optional feedback through an email draft or public GitHub issue draft; neither channel automatically includes project data.
- Stricter import whitelisting plus browser editing/recovery hardening without changing the strategic model or the 0.5-compatible project schema.

Strategic value is **not** multiplied by current readiness or historical performance. Mandatory requirements are not automatically waived by a high preference score. A moonshot may need a learning and capability-building path rather than immediate full-scale execution.

## Privacy and beta limitations

Project inputs stay in local browser storage. They are **not encrypted**, synchronized, or backed up by SULTAN. Export a JSON copy regularly; clearing browser data can remove the local draft. Do not use confidential institutional information or personal records in this public beta.

There are no analytics, tracking libraries, AI calls, or project-upload endpoints. Hosting providers can receive normal website requests. Email and GitHub feedback use external services only after an explicit user action. GitHub issues are public and require a GitHub account; email feedback does not require GitHub.

A completed field is not verified evidence. This edition does not authenticate decision owners, check legal authority, award accreditation, establish funding approval, or maintain a protected audit trail. Scores represent entered preferences, not probabilities of success. Software tests do not establish field effectiveness, global novelty, or superiority over consulting firms.

See [privacy](docs/PRIVACY.md), [product scope](docs/PRODUCT.md), and [feedback guide](docs/FEEDBACK.md).

## Run and test locally

Use Node.js 22+ and Python 3. No third-party runtime dependencies are loaded by the web app.

```sh
node tests/engine.test.js
node tests/hardening.test.js
node tests/i18n.test.js
python3 build.py
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000/?lang=en` or `?lang=ar`. The build emits a self-contained `public/index.html` and a source archive under `release/`.

For full browser acceptance tests:

```sh
python3 -m pip install playwright==1.57.0
python3 -m playwright install chromium
python3 tests/beta_browser.py
python3 tests/hardening_browser.py
```

`SULTAN_RENDER_ONLY=1` is for isolated inline-rendering environments; it explicitly skips real-origin persistence and language-navigation checks. It is not a substitute for the full browser release check. `CHROMIUM_PATH` can point to an installed Chromium binary.

## Repository organization

`src/engine.js` contains deterministic model and validation rules. `src/app.js` contains the workspace. `src/portal.js` contains the public entrance and opt-in feedback. `src/locales/en.js` and `ar.js` hold translations; Arabic is confined to localization and language-test fixtures, while documentation, code identifiers, and contributor workflows use English.

The cybersecurity methodology, Adeeb Noor's institutional strategy philosophy, and REDA's emphasis on explicit data, comparison, and temporal performance underpin the design. The strategic scoring criteria are design choices for this beta, not a transfer of teacher-ranking rules into strategy. No original client documents or personal transfer records are included.

Beta access is free. No redistribution license is included at this stage; please contact the author before redistributing the product or branding.

**Version 0.6.1 — hardened beta for non-sensitive planning and feedback.**
