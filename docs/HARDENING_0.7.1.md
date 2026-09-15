# SULTAN 0.7.1 verification notes

This hardening pass responds to confirmed defects found in the 0.7 execution upgrade. It does not change the strategic model or project schema.

Verification priorities:

1. Arabic and English internal/leadership reports include the dual Gregorian/Hijri report date.
2. Leadership report headings remain sequential after sections are omitted.
3. Authority Space terminology is localized consistently.
4. Value × Authority dots remain visible at 0 and 100 and follow document direction; incomplete authority data is surfaced explicitly.
5. Every criterion receives a switch-point result or an explicit no-switch result within the meaningful 0.5–99.5 range.
6. Funding displays known declared cost plus count of unestimated budget years.
7. Escalation exports include institution identity, revision, date, affected initiative/period, and separate internal decisions from external/shared decisions.
8. Criterion polarity changes warn the user that score anchors must be reviewed.
9. Translation parity covers all locale catalogs, not only the base Arabic and English files.
10. Regression checks are executable in CI before merge.
