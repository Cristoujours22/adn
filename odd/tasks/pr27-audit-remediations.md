# PR 27 Audit Remediations
Status: complete — branch `fix/pr27-audit-remediations`, based on `e9ad6c2`, final code HEAD `57cd1c7`.
Fresh audit findings must be reproduced and corrected before PR #27 can be considered merge-ready.

## Specs

1. **S1** — “Auditoría nueva de PR #27 — recomendado”

## Tasks

- **T1** — S1 — Exclude inactive imported services from every matching and billing path. Route: inline test-first. Commits: `8ca1cbe`, `57cd1c7`.
- **T2** — S1 — Apply service plans to the despiece captured when the editor opened, even after tab changes. Route: inline test-first. Commit: `9a4502b`.
- **T3** — S1 — Make explicit service quantities constrain CAD unit ownership instead of configuring every row unit. Route: inline test-first. Commit: `be9e343`.
- **T4** — S1 — Prevent stale asynchronous catalog hydration from overwriting a newer confirmed import. Route: inline test-first. Commit: `8b5a696`.
- **T5** — S1 — Reject invalid negative required numeric geometry parameters before applying a plan. Route: inline test-first. Commit: `99a0ab5`.
- **T6** — S1 — Give context-menu actions honest, distinct behavior and clamp the menu to the viewport. Route: inline test-first. Commits: `3057a22`, `633e0bf`.
- **T7** — S1 — Keep CAD geometry valid for extreme aspect ratios. Route: inline test-first. Commit: `28867bd`.
- **T8** — S1 — Stabilize imported-service memo dependencies so the production build passes with CI warnings-as-errors. Route: inline build-failure correction. Commit: `dbca13f`.
- **T9** — S1 — Run consolidated verification and independent re-audit. Route: high-risk independent verification. Commit: `919cd9a`.

## Log

- **L1** — “Auditoría nueva de PR #27 — recomendado”
- **L2** — Native review authority inspection timed out before starting; no mutation occurred and no automatic retry was attempted.
- **L3** — Independent audit passed 12 suites / 107 tests plus 4 suites / 8 tests and found no blocker, but reported one high, five medium, and two low candidate-caused findings. PR #27 is not merge-ready until the high and medium findings are corrected and verified.
- **L4** — For `cant=4` with `perforaciones x2`, the user selected “Dos de las cuatro piezas”: explicit service quantities own that number of physical units; mentions without an explicit quantity continue to apply to every unit.
- **L5** — All seven candidate-caused findings were reproduced RED and corrected in bounded commits. Consolidated verification and independent re-audit remain pending.
- **L6** — The first consolidated production build failed because `ServiceDictionaryImport` recreated the `importedServices` fallback array on every render, making two `useMemo` dependencies unstable under CI warnings-as-errors. This current candidate-caused build defect requires a minimal correction before verification can close.
- **L7** — Independent verification found two residual integration gaps: `TablaPiezas` wrapped absent context-menu handlers in no-op functions, and legacy `detectServiceOccurrences` still considered inactive services. T6 and T1 were reopened for focused RED corrections before final verification.
- **L8** — Both residuals were reproduced RED and corrected in `633e0bf` and `57cd1c7`. Focused GREEN passed; final full-suite, production-build, and independent verification remain pending on the updated HEAD.
- **L9** — Final verification on `57cd1c7`: 34/34 suites and 203/203 tests passed; CI production build compiled successfully; independent verifier PASS with 10 suites and 100 focused tests; no candidate-caused regression found. One pre-existing non-failing React `act(...)` warning remains outside this remediation.
- **L10** — Native RDD assessment and authority inspection were unavailable because the verified package-local Gentle AI binary is missing. No lineage was created and no mutation occurred. The configuration blocker is user-owned; the provider returned `node scripts/install-gentle-ai.mjs` as the managed remediation before any separately authorized fresh review attempt.
