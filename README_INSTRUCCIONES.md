# FerreJunior - Sistema de Gestión

## Configuración e Instalación

### Paso 1: Instalar Python
Si no tienes Python instalado, descárgalo desde: https://www.python.org/downloads/

### Paso 2: Instalar Dependencias
```bash
pip install -r requirements.txt
```

### Paso 3: Ejecutar la Aplicación
```bash
python app.py
```

La aplicación se ejecutará en: http://localhost:5000

## Usuarios de Prueba

La aplicación crea automáticamente estos usuarios de prueba:

- **Administrador**: 
  - Email: admin@ferrejunior.com
  - Contraseña: admin123
  - Acceso: Panel completo de administración

- **Empleado**: 
  - Email: empleado@ferrejunior.com
  - Contraseña: empleado123
  - Acceso: Panel de ventas y gestión

- **Cliente**: 
  - Email: cliente@ferrejunior.com
  - Contraseña: cliente123
  - Acceso: Panel de cliente

## Funcionalidades Implementadas

### ✅ **Fase 1 - Sistema de Login**:
- Formulario de login funcional
- Validación de campos
- Mensajes de error y éxito
- Recordar sesión

### ✅ **Fase 2 - Roles y Dashboards**:
- **Sistema de Roles**: Admin, Empleado, Cliente
- **Control de Acceso**: Decoradores para proteger rutas
- **Dashboards Específicos**:
  - 🔴 **Admin**: Gestión completa del sistema
  - 🔵 **Empleado**: Panel de ventas y atención
  - 🟢 **Cliente**: Interfaz de compras
- **Redirección Automática**: Según rol del usuario

### 📊 **Características por Rol**:

**👑 Administrador**:
- Gestión de usuarios
- Configuración del sistema
- Acceso a reportes completos
- Control total de la aplicación

**👔 Empleado**:
- Registro de ventas
- Gestión de inventario
- Atención al cliente
- Reportes de ventas personales

**👤 Cliente**:
- Catálogo de productos
- Historial de compras
- Sistema de puntos
- Favoritos y carrito

## Próximas Fases

**Fase 3**: Gestión de productos e inventario
**Fase 4**: Sistema de ventas y facturación
**Fase 5**: Reportes y estadísticas

## Solución de Problemas

### Error de Python no encontrado:
1. Instalar Python desde python.org
2. Asegurarse de que esté en el PATH
3. Reiniciar la terminal

### Error de dependencias:
```bash
pip install Flask Flask-SQLAlchemy Flask-Login Flask-Marshmallow Werkzeug
```

### Error de base de datos:
La aplicación usa SQLite, no requiere configuración adicional.