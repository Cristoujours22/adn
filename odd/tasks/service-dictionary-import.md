# Implement service dictionary import

Deliver an explicit JSON dictionary import workflow while keeping ADN free of preloaded special-service names.

## Delivery

Strategy: `feature-branch-chain`, continuing the review-slice policy already selected for `feature/ajustes-adn`.

1. Model and ODD specification: `0bae867`.
2. Neutral general dictionary template.
3. Parser, validation, normalization, and empty defaults (T1).
4. Import preview and confirmation UI (T2).
5. Global user-catalog persistence and compatibility (T3).
6. Documentation, verification, and feature closure (T4).

## Specs

1. **S1** — “los servicios especiales estarán vacíos por defecto, el programa podrá leer un texto plano con una estructura que el sistema interpreta y aplica me entiendes?, esto es para no usar nombres privados de la empresa”
2. **S2** — Distribute only a neutral, optional general dictionary. Do not create, retain, document, or distribute company-specific dictionaries.
3. **S3** — “elimina lo que lleve perfilería de aluminio.”
4. **S4** — “Importación completa de diccionarios” — “Catálogo vacío, validador JSON, vista previa, confirmación y guardado global.”

## Tasks

- [x] **T1** — S1-S4 — Build and test the JSON dictionary parser, schema validator, service normalization, duplicate/collision reporting, and empty default catalog. Route: delegated writer + independent verifier. Commit: `8e8a4c2`.
- [x] **T2** — S1-S4 — Add the import selection, validation preview, review-required state, cancellation, and explicit confirmation workflow to the services UI. Route: delegated writer. Commit: `56d2e9a`.
- [x] **T3** — S1-S4 — Persist confirmed imports as the user’s global catalog, load that catalog for projects without reintroducing bundled defaults, and preserve existing project compatibility. Route: delegated writer + independent verifier. Commit: `4c75726`.
- [x] **T4** — S1-S4 — Update documentation and run focused service, import, persistence, and production checks. Route: delegated writer + parent verification. Commits: `8939e08`, `1832d67`.

## Verification

- Focused dictionary/import/persistence/matching checks: 9 suites, 52 tests passed.
- Full suite: 19 suites, 92 tests passed, 0 failed, 0 skipped.
- Production build: passed; deployable `build/` produced.
- Independent committed-range verification: S1-S4 passed with no blocking findings.
- `git diff --check`: passed for intended feature files.
- Unrelated `.firebase/hosting.YnVpbGQ.cache` and `.codegraph/` changes remain outside the feature commits.

## Log

- **L1** — “los servicios especiales estarán vacíos por defecto, el programa podrá leer un texto plano con una estructura que el sistema interpreta y aplica me entiendes?, esto es para no usar nombres privados de la empresa”
- **L2** — Superseded by the legal-neutral requirement: only the general dictionary may exist or be documented; company-specific dictionaries are prohibited.
- **L3** — “elimina lo que lleve perfilería de aluminio.”
- **L4** — The user selected “Importación completa de diccionarios”: “Catálogo vacío, validador JSON, vista previa, confirmación y guardado global.”
