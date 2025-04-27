# ADN - Sistema de Despieces de Melamina 

ADN es una aplicación desarrollada para ayudar a diseñadores y asesores de venta a crear, gestionar y optimizar **despieces de melamina**. Pensado para minimizar errores en producción, facilitar el manejo de servicios especiales y ofrecer herramientas para una gestión eficiente de archivos XML.

---

## Características principales

- Login de usuario con recuperación de contraseña vía correo electrónico.
- Gestión de roles: `Administrador`, `Diseñador` y `Vendedor`.
- Importación y exportación de archivos XML para los despieces.
- Identificación y conteo de servicios especiales como nariz, curva, senchamannual, etc.
- Visualización de archivos guardados.
- Conexión segura a Firebase para autenticación y almacenamiento.
- Interfaz amigable desarrollada con React.
- **Optimización de corte de tableros**: La aplicación calcula automáticamente cuántos tableros de melamina son necesarios para una lista de piezas dadas, minimizando el desperdicio de material.
- **Historial de cambios**: Los diseñadores pueden ver los cambios realizados en cada despiece, con detalles sobre el usuario y la fecha.
- **Seguridad y protección de datos**: El sistema cuenta con niveles de seguridad robustos para proteger tanto los datos personales de los usuarios como los despieces creados.

---

## Tecnologías usadas

- **React** 19.1.0
- **Firebase** 11.6.0
- **React Router DOM** 7.5.1
- **React Icons**
- **Google reCAPTCHA**
- **Webpack & React Scripts**
- **NPM 11.3.0**

---

## Requisitos mínimos

Antes de instalar y correr el proyecto, asegúrate de contar con lo siguiente:

- **Node.js** versión 18.0.0 o superior
- **NPM** versión 9.0.0 o superior
- **Navegador** moderno actualizado (se recomienda Google Chrome o Microsoft Edge)
- **Conexión a Internet** para conectar con Firebase
- **Sistema operativo**: Windows 10/11, MacOS o una distribución Linux moderna
- **RAM recomendada**: mínimo 4GB (8GB ideal para desarrollo más fluido)

## Instalación

1. **Clona el repositorio**

```bash
git clone https://github.com/tu_usuario/adn.git
cd adn
```

2. **Instala las dependencias**

```bash
npm install
```
3. **Inicia el servidor de desarrollo**

```bash
npm start
```

Por defecto, la aplicación se ejecutará en el puerto 3000 y abrirá automáticamente en tu navegador en http://localhost:3000.

Si deseas cambiar el puerto en el que se ejecuta la aplicación, sigue estos pasos:

* **1** Abre el archivo .env en la raíz del proyecto (si no existe, créalo).

* **2** Agrega o modifica la siguiente línea para establecer el puerto que desees:

## Uso
**Diseñador**: Los diseñadores pueden crear despieces, cargar archivos XML, y editar las piezas con detalles como material, medidas y servicios especiales.

**Vendedor**: Los vendedores pueden ver los despieces, pero no tienen acceso para cargar o editar archivos XML.

**Administrador**: Los administradores pueden gestionar usuarios, ver todos los archivos y despieces, y realizar configuraciones avanzadas de la aplicación.
