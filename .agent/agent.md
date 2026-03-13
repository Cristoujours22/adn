# ADN - Manual de Identidad y Reglas del Agente

Este archivo contiene las reglas críticas y el conocimiento profundo del proyecto **ADN** (Aplicación de Despieces y Nomenclaturas). Léelo siempre para mantener la consistencia en el desarrollo.

## 🚀 Stack Tecnológico
- **Frontend**: React (Hooks, Context API, React Router).
- **Backend/DB**: Firebase (Firestore para datos, Authentication para usuarios, Hosting para despliegue).
- **Estilos**: CSS Modules (`.module.css`) con soporte para Modo Oscuro vía `ThemeContext`.

## 🧠 Conocimiento del Dominio (Reglas de Negocio)

### 1. Cálculos de Despiece (`despieceCalculations.js`)
Es el corazón de la app. NO cambies las fórmulas sin validar estas reglas:
- **SENCHAMANUAL (Enchape Manual)**: 
  - Se calcula en Metros Lineales (ML). Independiente de Nariz.
  - **Auto-suma**: Si una pieza tiene Largo o Ancho <= 119mm, se suman automáticamente los mm de los cantos marcados con '1', '2', '3' o '4'.
  - **Círculos**: Si el detalle incluye "circulo", suma el perímetro completo `(L*2 + A*2)`.
  - **Redondeo**: El total final de `SENCHAMANUAL` siempre se redondea hacia arriba (`Math.ceil`).
- **NARIZ**: Servicio independiente que se cobra por unidad. No se debe mezclar con el cobro de Enchape Manual.
  - Cuando se indica por cantos (L1, L2, A1, A2) con valor '3' o '4', se suman los milímetros de esos lados.
  - L1 y L2 (Largo 1, Largo 2) suman el Largo de la pieza. A1 y A2 (Ancho 1, Ancho 2) suman el Ancho de la pieza.
  - La sumatoria de milímetros se convierte a Metros Lineales (ML) dividiendo por 1000.
  - Las unidades totales a cobrar se obtienen redondeando hacia arriba esos Metros Lineales (`Math.ceil`).
  - *Ejemplo*: Pieza de 790 x 239. Si marcas L1 con '3', suma 790mm = 0.79 ML, redondea a 1 unidad. Si marcas L1, A1 y A2 con '3', suma 790 + 239 + 239 = 1268mm = 1.268 ML, redondea a 2 unidades.


- **CALADO**: Sigue una regla de escala: 1 unidad por cada 600mm de la suma de dimensiones si se especifica `/L*A`.

### 2. Interfaz "Excel-Like"
El `ModeloDespiece.js` emula Excel:
- Navegación con flechas, estas permiten desplazarse por cada celda hacia arriba, abajo, izquierda o derecha, Tab para saltar celdas, Enter para bajar solo en la ultima celda de la tabla, al hacer doble click en una celda se activa el modo edición.
- **Pegado**: Soporta `Ctrl+V` desde Excel directamente limpiando tabulaciones.
- **Autoguardado**: 10 segundos después del último cambio si hay un `id` de proyecto activo.

## 🛠️ Reglas de Desarrollo

### Estilo de Código
- **Idioma**: La interfaz y los comentarios importantes deben estar en **Español**.
- **Componentes**: Usa siempre componentes funcionales y Hooks.
- **Memoización**: Usa `useCallback` para funciones que se pasan a componentes hijos para evitar re-renders innecesarios en la tabla de despiece (que puede ser muy grande).

### Firebase
- Las colecciones principales son `despieces` y `usuarios`.
- Siempre asocia los nuevos despieces al `userId` del usuario actual.

### Despliegue
- Usa el workflow `/deploy` para subir cambios a Firebase Hosting de forma automática (usando `// turbo`).

## ⚠️ Errores Conocidos / "Gotchas"
- **removeChild**: Ten cuidado al manipular el DOM directamente o con extensiones que inyecten código, ya que React puede lanzar errores de "node not found".
- **Z-Index**: El menú superior tiene prioridad visual; asegúrate de que los modales usen el `modalOverlay` definido en `App.module.css`.

---
*Última actualización: Marzo 2026*
