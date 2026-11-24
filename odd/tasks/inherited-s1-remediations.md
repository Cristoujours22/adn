# Inherited S1 Remediations
Status: active — branch `fix/inherited-s1-remediations`, based on `e86facf`.
Three inherited correctness and environment blockers must be resolved before integrating service CAD tracker PR #28.

## Specs

1. **S1** — “Corregir los S1 heredados — recomendado”

## Tasks

- **T1** — S1 — Preserve `escala_60` billing for CALADO and CALADO INTERNO. Route: inline test-first. Commit: `20535b4`.
- **T2** — S1 — Prevent Playwright from reusing an arbitrary existing server that could reach production Firebase. Route: inline test-first/config verification. Commit: pending.
- **T3** — S1 — Prevent project persistence from overwriting a newly imported global service catalog. Route: inline test-first. Commit: pending.
- **T4** — S1 — Run focused and full verification and prepare reviewable delivery. Route: independent high-risk verification. Commit: pending.

## Log

- **L1** — “Corregir los S1 heredados — recomendado”
- **L2** — Review evidence: PR #15 reported that CALADO/CALADO INTERNO omit `escala_60` billing; PR #16 reported that `reuseExistingServer: !process.env.CI` can connect tests to a production-backed server; PR #23 reported that an earlier persistence path can overwrite a newly imported global catalog.
- **L3** — Service CAD tracker PR #28 remains draft and must not be integrated until these blockers are corrected and verified.
- **L4** — T1 RED: 2 failed / 32 passed. GREEN: 34/34 passed, ESLint and diff check passed. Unit CALADO quantities remain unchanged while non-unit billing reaches the declared metric.
