# ADN - Manual de Identidad y Reglas del Agente

Este archivo contiene las reglas críticas y el conocimiento profundo del proyecto **ADN** (Aplicación de Despieces y Nomenclaturas). Léelo siempre para mantener la consistencia en el desarrollo.

## 🚀 Stack Tecnológico
- **Frontend**: React (Hooks, Context API, React Router).
- **Backend/DB**: Firebase (Firestore para datos, Authentication para usuarios, Hosting para despliegue).
- **Estilos**: CSS Modules (`.module.css`) con soporte para Modo Oscuro vía `ThemeContext`.

## 🧠 Conocimiento del Dominio (Reglas de Negocio)

### 1. Detección de Servicios en Detalle
- La detección debe ser **insensible a mayúsculas/minúsculas**.
- **IMPORTANTE**: Las regex de detección en `despieceCalculations.js` deben usar **SIN límites de palabra (`\b`)**. Esto permite detectar servicios aunque tengan texto antes o después:
  - Ejemplo: "PanelMANIGAVETA" debe detectar MANIGAVETA
  - Ejemplo: "algoMANIGAVETAalgo" debe detectar MANIGAVETA
  - Esto aplica a: calado, curva, nariz, senchamanual, perbis, sanduche, y todos los servicios con `tipoCobro: unidad`
- Los servicios SENCHAMANUAL y NARIZ cuando son escritos en detalle empiezan su valor en 0.

#### Detección de Cantidades Múltiples
Para servicios como CURVAS, CALADOS y NARICES, el usuario puede especificar múltiples unidades en el detalle:
- **Formatos válidos**: "Calado 2L", "2 calados", "calado x2", "curva 2L ", "nariz 2L", "3 curvas", etc.
- El sistema debe detectar el número antes del nombre del servicio para contar múltiples unidades.
- Si no se especifica cantidad, se cuenta como 1 unidad por defecto.

### 2. Cálculos de Servicios (`despieceCalculations.js`)
Es el corazón de la app. NO cambies las fórmulas sin validar estas reglas:

#### SENCHAMANUAL (Enchape Manual)
- **Cálculo**: Metros Lineales (ML). Independiente de Nariz.
- **Auto-suma**: Si una pieza tiene Largo o Ancho <= 119mm, se suman automáticamente los mm de los cantos marcados con '1', '2', '3' o '4'.
- **Círculos**: Si el detalle incluye "circulo", suma el perímetro completo `(L*2 + A*2)`.
- **Redondeo**: El total final siempre se redondea hacia arriba (`Math.ceil`).
- **Generación automática**: Cuando hay MANIGAVETA o MANICHAFLAN presente en detalle, se debe colocar automáticamente un SENCHAMANUAL.

#### NARIZ (SRNAR000)
- **Cálculo**: Independiente del Enchape Manual. Se cobra por ML.
- **Cantos**: Cuando se indica por cantos (L1, L2, A1, A2) con valor '3' o '4', se suman los milímetros de esos lados.
  - L1 y L2 suman el Largo de la pieza
  - A1 y A2 suman el Ancho de la pieza
- **Conversión**: La sumatoria de milímetros se convierte a ML dividiendo por 1000.
- **Redondeo**: Las unidades totales se obtienen redondeando hacia arriba (`Math.ceil`).
- **Cantidades múltiples**: El usuario puede especificar "nariz x2", "2 narices", "nariz 2" en el detalle.
- *Ejemplo*: Pieza de 790 x 239. Si marcas L1 con '3', suma 790mm = 0.79 ML, redondea a 1 unidad. Si marcas L1, A1 y A2 con '3', suma 790 + 239 + 239 = 1268mm = 1.268 ML, redondea a 2 unidades.

#### CALADO (CSCALADO) y CALADO INTERNO (SRCALAEI)
- **Cálculo**: 1 unidad por cada 600mm de la suma de dimensiones si se especifica `/L*A`.
- **Cantidades múltiples**: El usuario puede especificar "calado x2", "2 calados", "calado 2" en el detalle.

### 3. Catálogo de Servicios por Tipo de Cobro

#### Por Metro Lineal (Largo + Ancho) - ml_largo_ancho
| Nomenclatura | Nombre Original | Detección en Detalle |
|--------------|-----------------|---------------------|
| CSPERALM | Pegado Manija Aluminio | "CSPERALM" |
| CSCANTOA | Pegado Canto Aluminio | "CSCANTOA" |
| SRRANUPE | RanuraPE | "SRRANUPE" |
| CSRANUFO | RanuraFO | "CSRANUFO" |
| SRNAR000 | Nariz | Ver sección 2 |
| SRREPEGA | Sanduche Clavillo | "SRREPEGA" |
| SERVREME | Sanduche Pega | "SERVREME" |
| SERVIMARCO | Marco, Enguesrse en Melamina | "SERVIMARCO" |
| SENCHAMANUAL | Enchape Manual | Ver sección 2 |
| SENCHACURVA | Enchape Curvo | "SENCHACURVA" |
| CSCANTOC2 | Enchape Canto Curvo 2mm (Rígido) | "CSCANTOC2" |

#### Por Unidad - unidad
| Nomenclatura | Nombre Original | Detección en Detalle | Notas |
|--------------|-----------------|---------------------|-------|
| SERPERBIS | Perbis | "SERPERBIS" | |
| RANULED | RanuLED | "RANULED" | |
| CSCURVA1 | Curva | "curva", "CSCURVA1" | Soporta cantidades: "2 curvas", "curva x2" |
| CSCIRCULO | Círculos | "circulo" o "CSCIRCULO" | |
| SERVIENL | En L | "SERVIENL" | |
| CSCHAFLA | Chaflan | "CSCHAFLA" | |
| CSINGLES | Caja Inglesa | "CSINGLES" | |
| SERVICENEFA | Caja | "SERVICENEFA" | |
| SERPASACABLE | Pasacable | "SERPASACABLE" | |
| MANICHAFLAN | Manichaflan | "MANICHAFLAN" | Genera SENCHAMANUAL |
| MANICRUS | Manija de Incrustar | "MANICRUS" | |
| MANIGAVETA | Manigaveta | "MANIGAVETA" | Genera SENCHAMANUAL |
| SERCURML | Curva Media Luna | "SERCURML" | |

#### Por Escala (cada 60cm) - escala_60
| Nomenclatura | Nombre Original | Detección en Detalle |
|--------------|-----------------|---------------------|
| SERANGUL | Ángulo | "SERANGUL" |
| CSCALADO | Calado | Ver sección 2 |
| SRCALAEI | Calado Interno | Ver sección 2 |

### 4. Interfaz "Excel-Like"
El `ModeloDespiece.js` emula Excel con las siguientes interacciones:

#### Navegación con Teclado
| Tecla | Comportamiento |
|-------|-----------------|
| **Flecha arriba** | Mueve el cursor a la celda de la fila anterior (misma columna). Si está en la primera fila, no hace nada. |
| **Flecha abajo** | Mueve el cursor a la celda de la siguiente fila. **Si está en la última fila, crea automáticamente una nueva fila** y mueve el cursor ahí. |
| **Flecha izquierda** | Mueve el cursor a la celda anterior. **Si está en la primera columna (Cant), salta a la última columna (A2) de la fila anterior**. |
| **Flecha derecha** | Mueve el cursor a la celda siguiente. **Si está en la última columna (A2), salta a la primera columna (Cant) de la siguiente fila**. Si no existe, crea una nueva fila. |
| **Tab** | Avanza a la siguiente celda. **Si está en la última columna de la última fila, crea una nueva fila** y mueve el cursor a la primera columna. |
| **Shift+Tab** | Retrocede a la celda anterior. Si está en la primera columna de la primera fila, no hace nada. |
| **Enter** | En modo normal: baja una fila. **Si está en la última fila, crea una nueva fila** y mueve el cursor ahí. En modo edición: confirma el valor y baja una fila. |
| **Escape** | Cancela el modo edición y sale de la celda. |
| **F2** | Activa el modo edición en la celda actual sin borrar el contenido. |
| **Espacio** (en columna Rotar) | Alterna entre "X" y vacío. |

#### Modo Edición
- **Doble click** o **F2**: Activa el **modo edición completa** con cursor visible. Permite mover el cursor dentro del texto con flechas ←→. Las flechas ↑↓ salen del modo y navegan.
- Al escribir cualquier carácter (a-z, 0-9, símbolos): Activa el **modo edición rápida**. Se puede escribir una cadena completa de caracteres. Solo las teclas de flecha (↑↓←→) salen del modo edición y navegan a la celda correspondiente.
- **Ctrl+V** en modo edición: Pega el contenido del portapapeles en la celda actual.
- **Enter**: Confirma el valor y baja una fila.
- **Escape**: Cancela los cambios y sale del modo edición.
- **Flechas en modo normal**: Navegan entre celdas sin entrar en edición.

#### Selección Múltiple
- **Shift + Flechas**: Extiende la selección desde la celda activa hasta la celda destino.
- **Click + Shift + Click**: Selecciona el rango entre ambas celdas.
- **Ctrl + Supr/Backspace**: Borra todas las filas seleccionadas.

#### Operaciones de Filas
| Atajo | Comportamiento |
|-------|-----------------|
| **Ctrl+D** | Duplica la fila actual (copia todos los valores a una nueva fila debajo). |
| **Ctrl+Z** | Deshace el último cambio (hasta 50 niveles). |
| **Ctrl+V** (en celda) | Pega el contenido del portapapeles en la celda actual. |
| **Ctrl+V** (en tabla sin celda activa) | Pega datos desde Excel. Cada línea es una fila, las tabulaciones separan columnas. |

#### Autoguardado
- **10 segundos** después del último cambio se guarda automáticamente en Firestore (solo si existe un `id` de proyecto activo).

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

### Despiece Automático (Función Admin)
- **Ubicación**: `src/utils/despieceCalculations.js`
- **Función principal**: `aplicarDespieceAutomatico(filas, opcion)`
- **Estados en**: `ModeloDespiece.js`
- **Acceso**: Solo usuarios con cargo que contenga "admin"

#### Modos disponibles:
- Cocina Lineal
- Closet Lineal
- Centro de TV
- Escritorio Lineal

#### Opciones de canto:
- Canto en 1 lado (opción 1)
- Canto en 2 lados (opción 2)
- Canto en todos lados (opción 3)

#### Items reconocidos:
- **Items principales**: Lateral, Lat_Izq, Lat_Der, División, Travessa_Connariz_Vertical, Travessa_Connariz_Horizontal, Entrepaño, Fr_Falso, Testero
- **Refuerzos**: Refuerzo_Superior, Refuerzo_Trasero
- **Base**: Base
- **Paneles/Puertas**: PanelCajon, Puerta

## ⚠️ Errores Conocidos / "Gotchas"
- **removeChild**: Ten cuidado al manipular el DOM directamente o con extensiones que inyecten código, ya que React puede lanzar errores de "node not found".
- **Z-Index**: El menú superior tiene prioridad visual; asegúrate de que los modales usen el `modalOverlay` definido en `App.module.css`.

---
*Última actualización: Marzo 2026*
