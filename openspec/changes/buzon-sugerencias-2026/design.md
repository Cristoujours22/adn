# Design: Buzón de Sugerencias 2026

## Technical Approach

Extend `ModeloDespiece` as coordinator, but move detection, module identity, transformations, and Firestore writes into pure/adaptor modules. The active despiece remains the only mutation scope. Preserve the current Firestore envelope (`despieces`, `serviciosGuardados`, `proyecto`, `cliente`) and add marked optional fields.

## Architecture Decisions

| Decision | Alternatives considered | Rationale |
|---|---|---|
| Use immutable `serviceId` as canonical identity and `fila.serviceId` as the durable row association. | Infer services from `detalle` on every render; use editable `nomenclatura` as identity. | Current rows have no service field and `handleAddService` can edit nomenclatura. A normalized service record is `{ serviceId, nomenclatura, nombreOriginal, aliases?, tipoCobro, activo? }` in `serviciosGuardados`; legacy records without `serviceId` receive deterministic `svc_<normalized-nomenclatura>` IDs on load. Valid acceptance writes that ID to the matched row; invalid/unresolved/ambiguous results write nothing. |
| Make the project document the authoritative write; history and user defaults best-effort secondary writes. | Claim one all-or-nothing operation across separate collections; commit React state first. | `despieces/{id}` stores rows, row service IDs, module metadata, and `serviciosGuardados` together. `despiecePersistence.js` uses a Firestore `writeBatch` for the primary create/update (including a generated create ref), and propagates failure. Only after commit does `ModeloDespiece` commit the candidate locally. `historialVersiones` (`guardarVersion`) and `userServices/{uid}` are best-effort; failures leave the saved project/local candidate intact, show “saved, but history/default backup failed,” retain a retry payload, and never claim complete persistence. |
| Keep the legacy module token immutable and store display names separately. | Replace `/D\d+-\d+/i` text with the new name. | **New** `despiece.modules` is `[{ moduleId, legacyToken, displayName }]`; **new** `fila.moduleId` references it. `legacyToken` is the original token matched by the exact legacy regex and is never rewritten in `detalle`; `moduleId` is stable (legacy fallback: `module_<UPPERCASE_TOKEN>`). Resolve row `moduleId` first, then case-insensitive token lookup, then render the token when metadata is absent. Rename changes only `displayName` and all resolved row references. A failed save discards the candidate, preserving the old token/name state. |
| Keep browsing and dialogs side-effect free until explicit confirmation. | Select services or mutate rows while browsing; optimistic modal commits. | The carousel has list/empty fallback. Find/replace previews carry mode, pattern, replacement, active despiece ID, row IDs, and fingerprint; literal input is escaped, regex input compiles before preview, and stale/invalid previews are rejected. Rename rejects blank/duplicate display names before persistence. |

## Data Flow

```text
ModeloDespiece state → pure detection/identity/preview → candidate snapshot
                                             ↓
                          writeBatch(primary despieces document)
                              success → local commit → secondary attempts
                              failure → no local commit; actionable error
```

`detectServiceOccurrences(filas, services)` returns `empty|valid|unresolved|invalid` plus `{ serviceId, rowIds, count }`; canonical acceptance updates only those rows. Existing `calcularTotalesDespiece` keeps its billing rules but keys counts by `serviceId` with legacy nomenclature fallback.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/ModeloDespiece.js` | Modify | Adapt current load/save paths (401–474, 959–1060), candidate commits, service acceptance, warnings/retry, and modal triggers. |
| `src/utils/despieceCalculations.js` | Modify | Boundary-aware detection/validation and service-ID keyed totals. |
| `src/utils/moduleIdentity.js` | Create | Exact legacy-token parsing, module map hydration, lookup, and rename references. |
| `src/utils/despieceTransformations.js` | Create | Pure find/replace preview/apply and module rename. |
| `src/services/despiecePersistence.js` | Create | Primary batch adapter plus explicit secondary result reporting. |
| `src/components/Despieces/{ServicesCarousel,FindReplaceModal,ModuleRenameModal}.js` | Create | Carousel fallback and two accessible dialogs. |
| `src/components/Despieces/{TablaPiezas,TabsDespiece,PanelResumen}.js` | Modify | Resolve modules, semantic service actions/counts, double-click/keyboard rename, and keep tab names separate from module identity. |
| `src/App.module.css`, `src/index.js`, `package.json`, `package-lock.json` | Modify | Responsive dialog/carousel styles, one Slick CSS import, and `react-slick`/`slick-carousel`. |

## Interfaces / Contracts

```javascript
// [NEW] persisted fields: serviceId, fila.serviceId, despiece.modules, fila.moduleId.
persistDespieceSnapshot(snapshot) => Promise<{
  documentId, primary: 'committed', secondary: { history: 'ok'|'failed'|'skipped', defaults: 'ok'|'failed'|'skipped' }
}>
buildFindReplacePreview(despiece, input) => Preview
applyFindReplace(despiece, preview) => { despiece, changedRows }
renameModuleInDespiece(despiece, moduleId, displayName) => { despiece, changedRows }
```

Both `FindReplaceModal` and `ModuleRenameModal` use `role="dialog"`, `aria-modal="true"`, labelled title, and live validation/status. On open, focus goes to search/name respectively; Tab/Shift+Tab are trapped; Escape cancels and discards draft; close returns focus to the opening menu/module control. Errors focus the invalid field.

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Unit | Service IDs/legacy normalization, exact module fallback, transformations, stale previews | Jest pure utilities. |
| Component | Carousel fallback/keyboard reachability; both dialog focus/escape/return; rename and acceptance failure UI | React Testing Library; mock Slick/Firestore. |
| Persistence | Primary success/failure, delayed local commit, each secondary warning/retry path | Adapter and `ModeloDespiece` tests; no E2E runner exists. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration job. Load-time normalization reads legacy service records and token-only rows; metadata/IDs are persisted with the next successful project save. Rollback reverts code/dependency changes; old documents remain readable through both fallbacks.

## Open Questions

None.
