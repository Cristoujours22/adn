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
2. **S2** — “tambien genera 2 diccionarios, el actual que tiene el sistema llamalo codigos madecentro  y el global que se generara como Codigos generales, alli en estos se generara la estructura que sera leida posteriormente en el sistema.”
3. **S3** — “elimina lo que lleve perfilería de aluminio.”
4. **S4** — “Importación completa de diccionarios” — “Catálogo vacío, validador JSON, vista previa, confirmación y guardado global.”

## Tasks

- [ ] **T1** — S1-S4 — Build and test the JSON dictionary parser, schema validator, service normalization, duplicate/collision reporting, and empty default catalog. Route: inline. Commit: pending.
- [ ] **T2** — S1-S4 — Add the import selection, validation preview, review-required state, cancellation, and explicit confirmation workflow to the services UI. Route: inline. Commit: pending.
- [ ] **T3** — S1-S4 — Persist confirmed imports as the user’s global catalog, load that catalog for projects without reintroducing bundled defaults, and preserve existing project compatibility. Route: inline. Commit: pending.
- [ ] **T4** — S1-S4 — Update documentation and run focused service, import, persistence, and production checks. Route: inline. Commit: pending.

## Log

- **L1** — “los servicios especiales estarán vacíos por defecto, el programa podrá leer un texto plano con una estructura que el sistema interpreta y aplica me entiendes?, esto es para no usar nombres privados de la empresa”
- **L2** — “tambien genera 2 diccionarios, el actual que tiene el sistema llamalo codigos madecentro  y el global que se generara como Codigos generales, alli en estos se generara la estructura que sera leida posteriormente en el sistema.”
- **L3** — “elimina lo que lleve perfilería de aluminio.”
- **L4** — The user selected “Importación completa de diccionarios”: “Catálogo vacío, validador JSON, vista previa, confirmación y guardado global.”
