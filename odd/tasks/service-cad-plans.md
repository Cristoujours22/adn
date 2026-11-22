# Service CAD Plans
Status: active — branch `feat/service-cad-plans`, based on `e86facf`.

## Specs

1. **S1** — “necesito realizar planos de servicios con base a lo especificado en las filas de despiece. te dire metricas que creo deben tener y tu me ayudas a completarlas. se debe basar en cantidad de piezas de la fila que contenga en el detalle x servicio ejemplo de fila de despiece.  1 1200 800 Divisor servicio1 sericio2 etc. 1 1 1 1  -> cant, largo, ancho, detalle, L1, L2, A1, A2. el sistema detecta automaticamente que en detalle de la fila si hay un servicio, o tambien detectara si hay una cantidad mayor a 1, se debe habilitar un menu cuando demos click derecho en la casilla detalle. los planos deben tener formato visual tipo cad que creo es mas comprensible, las acotaciones deben ser en milimetros, se debe acotar por fuera de la pieza.”
2. **S2** — “pero tengo una duda, como sabremos a que servicio se asocia cada geometria? ejemplo puedo tener una pieza de 600 x 600, esta debe llevar curva, pero para que el sistema sepa que lleva curva debe estar declarada como una variable previamente en el codigo y esto es lo que no quiero. lo mas idoneo es que le demos atributos a la nomenclatura, seria que aparte de tener nombre de servicio, alias  y tipo de servicio tuviera geometria, y que el usuario defina si es ejemplo. circulo total, cortes curvos en esquinas, angulos. enchapes manuales internos(para estos me gustaria algo luego).”
3. **S3** — “perfecto procedamos asi y si algo vamos poco a poco cambiando lo que veamos mal o disfuncional.”

## Tasks

- **T1** — S1–S2 — Design the neutral service-plan schema and CAD interaction directions. Route: parent design + inline schema tests. Commit: pending.
- **T2** — S1–S2 — Validate declarative geometry profiles in imported service dictionaries. Route: inline test-first. Commit: pending.
- **T3** — S1–S2 — Create hybrid row/unit plan instances from detected services and quantities. Route: inline test-first. Commit: pending.
- **T4** — S1 — Add the detail-cell context menu and plan editor workflow. Route: writer candidate after design handoff. Commit: pending.
- **T5** — S1–S2 — Render neutral CAD primitives with external millimetre dimensions. Route: writer candidate after design handoff. Commit: pending.
- **T6** — S1–S3 — Persist plans, document the format, and verify the complete workflow. Route: inline integration and verification. Commit: pending.

## Log

- **L1** — “necesito realizar planos de servicios con base a lo especificado en las filas de despiece. te dire metricas que creo deben tener y tu me ayudas a completarlas. se debe basar en cantidad de piezas de la fila que contenga en el detalle x servicio ejemplo de fila de despiece.  1 1200 800 Divisor servicio1 sericio2 etc. 1 1 1 1  -> cant, largo, ancho, detalle, L1, L2, A1, A2. el sistema detecta automaticamente que en detalle de la fila si hay un servicio, o tambien detectara si hay una cantidad mayor a 1, se debe habilitar un menu cuando demos click derecho en la casilla detalle. los planos deben tener formato visual tipo cad que creo es mas comprensible, las acotaciones deben ser en milimetros, se debe acotar por fuera de la pieza.”
- **L2** — “pero tengo una duda, como sabremos a que servicio se asocia cada geometria? ejemplo puedo tener una pieza de 600 x 600, esta debe llevar curva, pero para que el sistema sepa que lleva curva debe estar declarada como una variable previamente en el codigo y esto es lo que no quiero. lo mas idoneo es que le demos atributos a la nomenclatura, seria que aparte de tener nombre de servicio, alias  y tipo de servicio tuviera geometria, y que el usuario defina si es ejemplo. circulo total, cortes curvos en esquinas, angulos. enchapes manuales internos(para estos me gustaria algo luego).”
- **L3** — “perfecto procedamos asi y si algo vamos poco a poco cambiando lo que veamos mal o disfuncional.”
- **L4** — Design directions created under `design/service-cad-plans/`: `01-cad-workbench.html`, `02-context-drawer.html`, and `03-guided-geometry.html`; no artboard chosen yet.
