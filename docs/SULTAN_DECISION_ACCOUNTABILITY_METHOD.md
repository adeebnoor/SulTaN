# SULTAN Decision Accountability Method

SULTAN treats strategy as an auditable decision system rather than a document. The method is designed to make strategic reasoning, authority, uncertainty, and execution conditions explicit before resources are released.

## Decision chain

`Mandate → Choice → Evidence → Authority → Initiative → Funding Gate → Outcome`

The chain is intentionally traceable. A strategic option should not appear as an isolated score or initiative; it should remain connected to the mandate that motivates it, the evidence supporting it, the authority required to act, the initiative that operationalizes it, the release condition for resources, and the intended outcome.

## Five constructs

### 1. Auditable Choice
A preferred option must expose the reason, trade-off, and supporting evidence, not only a final score. The purpose is to make strategic judgement inspectable without pretending that judgement can be reduced to a formula.

### 2. Authority Space
Ownership clarity, status clarity, and decision clearance are separate dimensions. A named owner does not prove executable authority. SULTAN therefore models internal/external/shared/unknown control and ready/pending/blocked/unknown status independently.

### 3. Decision Break-even
SULTAN exposes the criterion weight at which the preferred option changes. The break-even point is not a forecast; it is a sensitivity boundary showing how robust the current preference is to a change in the decision model.

### 4. Unknown ≠ Zero
Missing evidence, no declared initiative, no reading, and unconfirmed funding remain different states. Absence is never silently converted into zero, readiness, or completion.

### 5. Evidence-Gated Funding
Resources are released against named evidence or acceptance conditions. Funding status is part of the decision chain rather than a downstream accounting field.

## R1–R5 deterministic coherence hints

These are advisory semantic hints. They are intentionally excluded from `check()` and do not become approval blockers by themselves.

- **R1 — Unapproved borrowed target:** flag when a numeric target appears literally inside its linked reference while that reference is not approved for use or adaptation.
- **R2 — Boundary contradiction:** flag when something declared as “not doing” materially overlaps a selected choice, outcome, or rationale.
- **R3 — Trade-off omission:** flag a stated “not doing” boundary when no option trade-off visibly carries that boundary into the choice set.
- **R4 — Choice distinctiveness:** flag selected choices whose outcomes are so similar that they may be duplicates rather than real alternatives.
- **R5 — Advantage grounding:** flag a selected discretionary choice when its “why us” has no visible anchor in institutional assets or context.

These rules are deliberately deterministic and explainable. They are not presented as AI judgement and do not change the formal review result.

## Decision-ready conditions

A strategy is decision-ready when, at minimum:

1. the choice and its trade-off are explicit;
2. the supporting evidence is relevant to the institution’s context;
3. authority to act is visible rather than assumed;
4. unknowns remain visible and named; and
5. resource release has an explicit evidence condition.

SULTAN does not replace executive judgement. It makes the reasoning, authority, and uncertainty behind that judgement inspectable.
