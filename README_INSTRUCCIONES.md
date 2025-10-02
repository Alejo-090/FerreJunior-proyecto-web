
# FerreJunior - Sistema de Gestión

## Descripción General

FerreJunior es un sistema web para la gestión de ferreterías, permitiendo administración de usuarios, ventas, inventario y compras por parte de clientes. Está desarrollado en Python con Flask y utiliza SQLite como base de datos.

## Funcionalidades Principales

- **Sistema de Login** con validación y mensajes de error.
- **Gestión de Roles**: Administrador, Empleado y Cliente.
- **Dashboards personalizados** según el rol.
- **Gestión de usuarios** (crear, editar, eliminar).
- **Gestión de productos e inventario**.
- **Registro y gestión de ventas**.
- **Catálogo de productos para clientes**.
- **Historial de compras y sistema de puntos**.
- **Carrito de compras y favoritos**.
- **Reportes y estadísticas** (para administradores y empleados).
- **Control de acceso** a rutas protegidas.
- **Redirección automática** según el rol.
- **Mensajes de error y éxito** en todas las operaciones.

## Instalación y Configuración

### 1. Instalar Python

Descarga Python desde: https://www.python.org/downloads/

### 2. Instalar Dependencias

```bash
pip install -r requirements.txt
```

Si tienes problemas, instala manualmente:

```bash
pip install Flask Flask-SQLAlchemy Flask-Login Flask-Marshmallow Werkzeug
```

### 3. Ejecutar la Aplicación

```bash
python app.py
```

La aplicación estará disponible en: [http://localhost:5000](http://localhost:5000)

## Usuarios de Prueba

- **Administrador**  
  Email: admin@ferrejunior.com  
  Contraseña: admin123

- **Empleado**  
  Email: empleado@ferrejunior.com  
  Contraseña: empleado123

- **Cliente**  
  Email: cliente@ferrejunior.com  
  Contraseña: cliente123

## Características por Rol

### 👑 Administrador
- Gestión de usuarios y roles
- Configuración del sistema
- Gestión de productos e inventario
- Acceso a reportes completos

### 👔 Empleado
- Registro y gestión de ventas
- Gestión de inventario
- Atención al cliente
- Reportes de ventas personales

### 👤 Cliente
- Catálogo de productos
- Historial de compras
- Sistema de puntos
- Favoritos y carrito de compras

## Posibles Errores y Soluciones

### Python no encontrado
- Instala Python desde [python.org](https://www.python.org/downloads/)
- Asegúrate de agregar Python al PATH
- Reinicia la terminal

### Error de dependencias
- Ejecuta:  
  ```bash
  pip install -r requirements.txt
  ```
- Si falla, instala los paquetes manualmente (ver arriba).

### Error de base de datos
- La aplicación usa SQLite, no requiere configuración adicional.
- Si ves errores de permisos, verifica que tienes permisos de escritura en la carpeta del proyecto.

### Error "Address already in use"
- Cambia el puerto en `app.py` o cierra la instancia anterior.

### Error "ModuleNotFoundError"
- Asegúrate de instalar todas las dependencias.
- Verifica que estés usando el entorno virtual correcto.
## Errores Comunes al Modificar el Código y Soluciones

Al modificar el código fuente, pueden surgir errores que afecten el funcionamiento de la aplicación. Aquí algunos ejemplos y cómo solucionarlos:

### 1. Error de Sintaxis (`SyntaxError`)
**Causa:** Se escribió mal una línea de código (por ejemplo, falta de dos puntos, paréntesis, comillas, etc.).  
**Solución:**  
- Revisa el mensaje de error en la terminal, que indica la línea y el archivo donde está el problema.
- Corrige la sintaxis según el mensaje.

### 2. Error de Importación (`ImportError` o `ModuleNotFoundError`)
**Causa:** Se eliminó o renombró un archivo, o se cambió el nombre de una función/clase y no se actualizó en los imports.  
**Solución:**  
- Verifica que todos los archivos y nombres importados existan y estén correctamente escritos.
- Si agregaste nuevas dependencias, instálalas con `pip install <paquete>`.

### 3. Error de Indentación (`IndentationError`)
**Causa:** Se modificó la indentación (espacios o tabulaciones) de manera incorrecta.  
**Solución:**  
- Usa siempre la misma cantidad de espacios (recomendado: 4 espacios por nivel).
- No mezcles espacios y tabulaciones.

### 4. Error de Base de Datos (`OperationalError`, `IntegrityError`)
**Causa:** Se cambiaron los modelos o migraciones sin actualizar la base de datos.  
**Solución:**  
- Si cambiaste la estructura de la base de datos, elimina el archivo `.db` y deja que la aplicación lo genere de nuevo (solo si no tienes datos importantes).
- Usa herramientas de migración si están disponibles.

### 5. Error de Rutas o Vistas (`404 Not Found`, `AttributeError`)
**Causa:** Se cambió el nombre de una ruta, función o plantilla y no se actualizó en todas partes.  
**Solución:**  
- Verifica que los nombres de las rutas y funciones coincidan en todo el proyecto.
- Revisa los enlaces y redirecciones en las plantillas.

### 6. Error de Permisos (`PermissionError`)
**Causa:** Se cambiaron permisos de archivos o carpetas.  
**Solución:**  
- Asegúrate de tener permisos de lectura y escritura en la carpeta del proyecto.

### 7. Error de Variables No Definidas (`NameError`)
**Causa:** Se eliminó o renombró una variable y no se actualizó en todo el código.  
**Solución:**  
- Revisa el mensaje de error para identificar la variable y corrige el nombre o define la variable antes de usarla.

---

**Recomendación:**  
Antes de modificar el código, haz una copia de seguridad. Si ocurre un error, revisa el mensaje que aparece en la terminal, ya que suele indicar la causa y la línea donde ocurrió el problema.