# Council workflows (0.11.0-beta)

The Council & decision log section adds portable workflows to the local project. It does not introduce a collaboration server or change approval rules.

## Signed sharing

Create a read-only snapshot or exactly three independent owner invitations after reviewing the scope. A compressed URL fragment contains the snapshot and an ECDSA P-256 signature. The host receives only the static reader request, not the fragment. The reader never loads the workspace or saved project. Snapshots do not track live changes; fictional examples retain their label.

The sender key stays in separate browser storage. Each invitation has a unique reply capability; the project retains the corresponding public key, request ID and content digest. Responses return as links or signed files, and the project checks the expected key, signature, request, content digest, owner label and expiry. Duplicate replies are rejected. Stored proofs are rechecked for display and export.

Signatures prove integrity and possession of a capability, not identity or organisational authority. Anyone holding an invitation can respond. Positions never mark the plan approved, clear permissions or change scores. Links are not encrypted and cannot be remotely revoked; app-side expiry is not server-enforced access control. Confirm sender and fingerprint through a trusted channel.

Uploaded summaries, AI logs and previous council responses are excluded. Remaining strategy fields, sources, names and finances are included. No analytics or shortening service receives the link. Links are capped at 24,000 characters; larger snapshots use signed files. Decoding is bounded to 240KB and 24 nesting levels, and a project supports 60 invitations.

## Board pack

One local ZIP contains editable PPTX, a fixed visual PDF, complete HTML appendix and calendar. Slides show selected decisions, funding and unknown costs, authority clearance, baseline/target/actual charts, execution dates, challenges, owner positions and next-review changes. Unknown is distinct from zero; delta targets become absolute chart values.

Slides retain the navy/gold identity. PDF pages are visual images; PowerPoint text and shapes are editable. Dense slide text is shortened, with complete details in the appendix. Stale owner positions are labelled. A stale adversarial review is replaced by fresh local questions in the deck and labelled in the appendix. Export does not change document numbering or plan records.

Pinned PptxGenJS 4.0.1, jsPDF 4.2.1 and JSZip 3.10.2 browser builds load only on demand from the same origin. Their licenses are included. No project goes to an export service.

## Adversarial reviewer

Local rules challenge weak measurement evidence, implicit or untested assumptions, missing trade-offs, applicability, unresolved authority and funding. Each criterion changes by ±10 percent of its own weight, with the others normalised proportionally to keep 100. This is not ±10 percentage points. Incomplete comparisons explicitly report unavailable sensitivity.

Optional AI uses the existing `src/ai.js` transport and settings, plus per-review consent. Only selected portfolio fields, cited sources and exact local sensitivity results are sent. Uploaded contents, council replies and signing material are excluded. Findings are advisory and preserve approval semantics. A result is discarded when the strategy changes while the request is running.

The interface discloses model, endpoint, server-held versus user-held key and provider terms. Google data treatment depends on billing tier, which the app cannot confirm. The relay does not persist request bodies; provider processing follows its terms. Synthetic transport tests do not establish external model quality.

## Decision log and offline use

The latest 12 checkpoints retain the decision note, next review date and business snapshot. Differences identify changed fields, preserving zero. Assumption test dates, initiative-card reviews, checkpoint dates and unresolved permission years generate reminders. Year-only reminders display the year; ICS uses 1 January with an explicit planning note. They are not marked as exact overdue dates during that year.

Reminders appear when the app opens. Import the ICS file for calendar notifications; SULTAN sends no scheduled emails or background alerts. Export project backups to retain a longer archive.

On the hosted site, offline preparation now runs automatically after load (0.12.0-beta). The Council section reports readiness and offers retry if preparation fails. The service worker caches a static allow-list, including export libraries, and never caches AI POST data or cross-origin requests. The manifest uses the approved existing logo. The web build has cacheable hashed scripts/styles; the standalone HTML retains embedded export libraries. Standalone sharing points to the hosted reader. AI needs a connection.

## Verification

`tests/council.test.js` checks schema, signature substitution, tampering, duplicates, expiry, content freshness, unknowns, sensitivity, calendar semantics and delta chart values. `tests/council_browser.py` checks Arabic/English sharing round trips, consent, synthetic AI transport, exports, persistence, responsive widths, installability and offline reload/export, including the standalone edition locally.

The live workflow compares the entry page and every published asset with the tested manifest before exercising Render in isolated synthetic browser contexts. It is triggered only after deployment; it is not a pre-deployment checksPass dependency.
