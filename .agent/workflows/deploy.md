---
description: Compilar y desplegar a Firebase Hosting automáticamente
---

Este flujo de trabajo compila tu aplicación de React y la sube a Firebase sin pedir confirmación en cada paso.


1. Compilar el proyecto para producción
// turbo
2. run_command: npm run build

3. Desplegar a Firebase Hosting
// turbo
4. run_command: npx firebase-tools deploy --only hosting