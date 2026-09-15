# SULTAN 0.7.3 performance hardening

Planned changes before the next release:

- Cache `breakEven()` results by the exact criteria/options inputs that affect the calculation.
- Fail the standalone build if any `src/` script or stylesheet reference remains uninlined.
- Add regression coverage for cache invalidation and standalone-build completeness.
- Evaluate an exact analytical break-even solver against the existing scan before replacing the scan.

This document is temporary and should be removed or folded into CHANGELOG when the hardening release is complete.
