# Analytical decision switch-points — validation note

This branch evaluates an exact alternative to SULTAN's established 0.5-percentage-point scan. It is **not loaded by the public application** while validation is in progress.

## Why an exact solution exists

When one criterion `c` is assigned a hypothetical weight `w` and all other criterion weights are redistributed proportionally, every fully scored option has a linear value function:

```text
S_o(w) = 100 B_o + w (A_o - B_o)

A_o = normalized score of option o on criterion c / 100
B_o = weighted normalized score of option o on all other criteria / their current total weight
```

For a current unique leader `L` and competitor `J`, their crossing is therefore:

```text
w* = (b_J - b_L) / (m_L - m_J)
```

where `b = 100 B` and `m = A - B`.

The nearest valid crossing on the upper envelope is the exact point at which the current leader ceases to lead. This avoids scanning 199 trial weights for every criterion and removes the scan's 0.5-point resolution limit.

## Safety fallbacks

The experimental implementation deliberately falls back to the established scan when:

- the criterion is currently at 0% or 100%;
- the current leading set is tied;
- proportional redistribution is degenerate;
- there are not at least two eligible option lines.

Boundary crossings at exactly 0% or 100% remain excluded, matching the product rule that switch-points describe changes within the open decision range.

## Validation gate

`tests/break-even-analytic.test.js` checks:

- known exact crossings;
- benefit and cost polarity;
- no-switch and boundary cases;
- scan fallback cases;
- 250 randomized complete projects, requiring the analytical method never to miss a switch detected by the established scan and never to report a farther nearest switch;
- 120 additional randomized projects, checking that reported exact thresholds lie on the current leader's upper envelope;
- a 20-option × 12-criterion timing comparison.

A production replacement should only happen after these tests and the existing model/browser suites pass. The scan should remain available internally as a reference/fallback during at least one release cycle.
