# SULTAN 0.7.1 hardening candidate

This candidate addresses the confirmed review findings before any new feature work:

- Localized report dates for Arabic and English without matching literal report text.
- Semantic leadership-report trimming with automatic section renumbering.
- Localized Authority Space report heading.
- Value × Authority matrix boundary and RTL fixes, plus an explicit unplotted list for incomplete authority data.
- Decision switch-points exclude meaningless 0%/100% boundaries and report criteria with no switch in the meaningful range.
- Funding review retains unestimated budget years instead of silently dropping them.
- Escalation pack includes institution identity, dual date, revision, affected initiatives/periods, and separates external/shared from unresolved internal decisions.
- Criterion polarity changes require explicit acknowledgement to revisit score anchors.
- Export controls are consolidated into an Export / Share menu in the section toolbar.
- Locale tests now load every JavaScript catalog under src/locales/.
- Added regression tests for the confirmed 0.7.1 findings.

Architectural consolidation of scoring/polarity/authority validation into the base engine remains a separate refactor after the hardening release; 0.7.1 prioritizes verified behavioral fixes without changing the project schema.
