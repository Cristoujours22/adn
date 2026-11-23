# Service CAD Plans
Status: complete — branch `feat/service-cad-plans`, based on `e86facf`.

## Specs

1. **S1** — “necesito realizar planos de servicios con base a lo especificado en las filas de despiece. te dire metricas que creo deben tener y tu me ayudas a completarlas. se debe basar en cantidad de piezas de la fila que contenga en el detalle x servicio ejemplo de fila de despiece.  1 1200 800 Divisor servicio1 sericio2 etc. 1 1 1 1  -> cant, largo, ancho, detalle, L1, L2, A1, A2. el sistema detecta automaticamente que en detalle de la fila si hay un servicio, o tambien detectara si hay una cantidad mayor a 1, se debe habilitar un menu cuando demos click derecho en la casilla detalle. los planos deben tener formato visual tipo cad que creo es mas comprensible, las acotaciones deben ser en milimetros, se debe acotar por fuera de la pieza.”
2. **S2** — “pero tengo una duda, como sabremos a que servicio se asocia cada geometria? ejemplo puedo tener una pieza de 600 x 600, esta debe llevar curva, pero para que el sistema sepa que lleva curva debe estar declarada como una variable previamente en el codigo y esto es lo que no quiero. lo mas idoneo es que le demos atributos a la nomenclatura, seria que aparte de tener nombre de servicio, alias  y tipo de servicio tuviera geometria, y que el usuario defina si es ejemplo. circulo total, cortes curvos en esquinas, angulos. enchapes manuales internos(para estos me gustaria algo luego).”
3. **S3** — “perfecto procedamos asi y si algo vamos poco a poco cambiando lo que veamos mal o disfuncional.”

## Tasks

- **T1** — S1–S2 — Design the neutral service-plan schema and CAD interaction directions. Route: parent design + inline schema tests. Commit: `dc22bbf`.
- **T2** — S1–S2 — Validate declarative geometry profiles in imported service dictionaries. Route: inline test-first. Commit: `e277961`.
- **T3** — S1–S2 — Create hybrid row/unit plan instances from detected services and quantities. Route: inline test-first. Commit: `a73714e`.
- **T4** — S1 — Add the detail-cell context menu and plan editor workflow. Route: writer candidate after design handoff. Commits: `a9140c9`, `d93560f`, `4ff39f9`.
- **T5** — S1–S2 — Render neutral CAD primitives with external millimetre dimensions. Route: writer candidate after design handoff. Commit: `6cf3a85`.
- **T6** — S1–S3 — Persist plans, document the format, and verify the complete workflow. Route: inline integration and verification. Commit: `ace7bb7`.

## Log

- **L1** — “necesito realizar planos de servicios con base a lo especificado en las filas de despiece. te dire metricas que creo deben tener y tu me ayudas a completarlas. se debe basar en cantidad de piezas de la fila que contenga en el detalle x servicio ejemplo de fila de despiece.  1 1200 800 Divisor servicio1 sericio2 etc. 1 1 1 1  -> cant, largo, ancho, detalle, L1, L2, A1, A2. el sistema detecta automaticamente que en detalle de la fila si hay un servicio, o tambien detectara si hay una cantidad mayor a 1, se debe habilitar un menu cuando demos click derecho en la casilla detalle. los planos deben tener formato visual tipo cad que creo es mas comprensible, las acotaciones deben ser en milimetros, se debe acotar por fuera de la pieza.”
- **L2** — “pero tengo una duda, como sabremos a que servicio se asocia cada geometria? ejemplo puedo tener una pieza de 600 x 600, esta debe llevar curva, pero para que el sistema sepa que lleva curva debe estar declarada como una variable previamente en el codigo y esto es lo que no quiero. lo mas idoneo es que le demos atributos a la nomenclatura, seria que aparte de tener nombre de servicio, alias  y tipo de servicio tuviera geometria, y que el usuario defina si es ejemplo. circulo total, cortes curvos en esquinas, angulos. enchapes manuales internos(para estos me gustaria algo luego).”
- **L3** — “perfecto procedamos asi y si algo vamos poco a poco cambiando lo que veamos mal o disfuncional.”
- **L4** — Design directions created under `design/service-cad-plans/`: `01-cad-workbench.html`, `02-context-drawer.html`, and `03-guided-geometry.html`; `02-context-drawer.html` is the implementation baseline because it preserves the despiece table while exposing the CAD editor.
- **L5** — Delivery boundary: this feature is stacked on `e86facf` and must be reviewed against that base; each task commit is a separate review slice rather than measuring the inherited chain against `origin/main`.
- **L6** — T2 verification: `src/utils/serviceDictionary.test.js` passed 7/7 tests and ESLint passed after correcting the invalid test fixture that treated the supported `degrees` unit as invalid.
- **L7** — T3 verification: `src/utils/servicePlans.test.js` passed 4/4 tests and ESLint passed; explicit service quantities use single-token ownership, so examples use unambiguous grammar such as `curva y perforaciones x2`.
- **L8** — T5 renderer commit `6cf3a85` is an isolated review slice despite its 586 authored lines: it contains one SVG renderer, styles, and focused tests for neutral primitives, external millimetre dimensions, circular outer-contour validation, and safe states.
- **L9** — Combined UI verification passed 6 suites / 30 tests plus ESLint before slicing the menu/editor integration commits.
- **L10** — T4 was split into reviewable responsibilities: context-menu/table integration `a9140c9` (431 lines), editor/styles/tests `d93560f` (612 lines), and row-state integration `4ff39f9` (62 lines). The two larger slices each contain one cohesive UI component with its focused tests.
- **L11** — Final verification passed 33/33 suites and 188/188 tests; the production build passed. The only output warning is the pre-existing stale Browserslist database notice.
- **L12** — T6 landed in `ace7bb7`; all six tasks are complete. Delivery remains separate: the branch has not been pushed, merged, or deployed.
