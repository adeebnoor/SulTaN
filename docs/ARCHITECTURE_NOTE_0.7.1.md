# Architecture note

Version 0.7.1 is a behavior-first hardening release. It closes confirmed user-facing defects without changing the project schema. The next architectural refactor should move criterion polarity, Authority Space validation, and switch-point calculation into the deterministic engine so browser modules render state rather than replace model functions at runtime.
