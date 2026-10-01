# Product scope and design decisions

SULTAN helps a team build and review a strategy, rather than generating a plausible document from an institution name. The consultation-authoring deliverable is a linked roadmap, dashboard, and reviewable strategy draft. The institution owns execution; additional advisory support is optional.

## Two ways in: guided path and expert workspace

Version 0.9 answers the expert review that called SULTAN "an expert's tool, not a user's tool". A busy manager now starts from the **guided path**: pick a sector and institution type, write a short brief, optionally attach documents, let the engine gather the regulatory and indicator context, confirm identity, tick goals from the sector library, enter the few numbers they know, and receive a complete, validated draft. The full workspace remains for consultants and for review; it opens in **simple mode** (essential fields visible, advanced fields folded under *More*) and switches to **expert mode** with one click. Every field carries a *why this matters* note with an example, in both languages.

The division of labour is deliberate: the user supplies general information and judgment, the engine and the optional AI assistant produce the draft, and the expert reviews it. Generated records are marked by origin (`lib-` for the sector library, `ai-` for the assistant) so a reviewer always knows what a human wrote.

## Context dossier and sector library

Every project carries a **context dossier**: sector, type, brief, the regulations, programmes, indicators, studies and benchmarks that ground the strategy, attached-document summaries, expert-review findings and the AI usage log. Sources are *proposed* until the team *accepts* them; proposed sources appear as open issues so nothing silently becomes "the evidence".

The **sector library** ships inside the app: education (general and private schools, international schools, kindergartens, training), higher education, health, government and non-profit, with regulators, national programmes, indicators, goal templates, enablers and initiatives written in the SULTAN vocabulary. Library entries record their issuer, year and public URL and the date the library was last verified. They are a starting point for the team's own verification, not legal advice and not an accreditation checklist.

## Method boundaries

Strategy chooses direction, beneficiary value, differentiation, and trade-offs. The operating model describes roles, authority, resources, incentives, and delivery arrangements that support those choices. Examining present operations must not turn present capability into the ceiling for ambition.

The workflow preserves the source methodology's link from reference selection and assessment to a current-to-target pathway, annual initiatives, and performance review. The interface groups work into convenient sections; it does not claim a newly invented set of strategic stages.

Identity and mandate mapping distinguish binding obligations, chosen contributions, and objectives outside direct leadership scope. A label does not prove legal status. Reference compatibility requires a source, purpose, context rationale, and adaptation limits. Users must not reduce mandatory requirements merely to fit current capability.

Moonshots retain strategic value while their capability-building and evidence paths are planned. The beta has no automatic minimum-capability percentage. Legislative and organizational enablers track actions, authority, owners, activation routes, and fallback consequences; they do not create authority or legal advice.

## Calculations

Preference scores use normalized entered weights and 0–100 value judgments. Missing scores remain missing and generate bounds, rather than silently becoming zero. The limited sensitivity check varies individual weights by five percentage points with proportional rebalancing. It is not a probability model or exhaustive robustness analysis.

Historical readings use a normalized recency-weighted average of comparable observations. This optional descriptor is separate from strategic value, current capability, and execution permission. It does not forecast success or allocate resources automatically.

Funding totals cover selected choices only. Unestimated amounts are visible. Surplus is not automatically rolled into later years. Annual dependencies flag relevant sequencing issues, but do not provide a detailed resource-constrained schedule or prove within-year order.

## Experience references

Miyar's public entrance separates product value from the operational workspace. Its restrained green palette, clear first action, fictional preview, and staged journey informed the public entrance; no Miyar code or proprietary third-party assets were copied.

Cascade's public product presentation connects planning, alignment, measures, and dashboards: https://www.cascade.app/

ClearPoint's public presentation emphasizes a guided tour, connected objectives/measures/initiatives, and reports: https://www.clearpointstrategy.com/

These are experience references, not independent performance rankings or evidence of feature parity. SULTAN does not claim their enterprise integrations, security certifications, adoption numbers, or field results.

## Expert lenses

Structure checks cannot see what an experienced adviser sees at a glance. **Expert lenses** encode the method owner's judgement as questions every strategy is read through: what do we have that no one else has; concentrate resources rather than spread them; evaluate internally before you cut; stabilize before you climb; decompose any external index into what we control; critical mass over fragmentation; one moonshot scaled to us; led by our own high performers; partner or acquire, and say what we bring; find the recurring business; few verticals with large tickets and a national agenda; follow the funder; where does the time come from; how long external conditions hold; liabilities as capital; sustainability within the ecosystem; unknown unknowns; AI as a service line and securing it.

Lenses are applied in the Review section as advisory hints, in every AI drafting and review prompt, and in the report. They are the adviser's patterns, not rules of the method: they never enter `check()` or approval, and a lens that does not fit a case can be muted. The lens memory learns from the expert (own patterns, patterns kept from AI findings or extracted from notes, usefulness feedback) and lives in the browser, separate from projects, so it carries across every strategy the expert opens. See `docs/EXPERT_LENSES.md`.

## AI assistant boundaries

The AI assistant is optional and off by default. It can gather sector context (with optional web search), draft a full strategy as structured JSON, suggest text for a single field, and review the draft the way a senior consultant would. Everything it returns passes through the same normaliser as a library draft: unknown numbers stay unknown, readiness is never assumed, budgets are never invented, indicator directions are checked against the baseline and target, and years are clamped to the horizon. Its review findings are warnings in the review view and never approval conditions. Mandatory requirements remain outside preference scoring whether a human or the model proposed them.

The assistant does not verify legal authority, guarantee that a cited regulation is current, or predict success. The team must accept proposed sources and review every generated record before the strategy is treated as its own.

## Public beta boundaries

No paid subscription, login, cloud storage, live collaboration, legal verification, official accreditation, or protected audit trail is implemented. AI generation exists only as the opt-in assistant described above. Input completeness and passing software tests do not establish factual correctness, field effectiveness, or global novelty.
