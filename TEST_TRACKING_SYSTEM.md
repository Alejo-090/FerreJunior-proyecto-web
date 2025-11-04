# Guía de Prueba - Sistema de Rastreo de Entregas

## 📋 Resumen del Sistema

El sistema de rastreo de entregas está completamente implementado con:

✅ **FASE 1 - Base de Datos:** 
- Tablas: `order_status_history`, `delivery_tracking`, `order_notifications`
- Migraciones ejecutadas correctamente

✅ **FASE 2 - Backend:**
- Servicio de Google Maps (geocodificación, rutas, ETA)
- Servicio de notificaciones
- 10 endpoints de tracking API
- APIs de Google Maps verificadas y funcionando

✅ **FASE 3 - Frontend:**
- Página de rastreo para clientes (HTML/CSS/JS)
- Dashboard de rastreo para empleados (HTML/CSS/JS)
- Integración con Google Maps
- Actualización en tiempo real (30 segundos)

---

## 🔧 Configuración Requerida

### 1. Variables de Entorno (.env)
Asegúrate de tener configurado:
```env
GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 2. APIs de Google Maps Habilitadas
- ✅ Geocoding API
- ✅ Directions API
- ✅ Distance Matrix API
- ✅ Maps JavaScript API

---

## 🧪 Plan de Pruebas

### PRUEBA 1: Verificar Instalación

```bash
# 1. Reiniciar Docker
docker-compose restart flask_app

# 2. Verificar logs
docker-compose logs -f flask_app

# 3. Verificar que no hay errores en la carga de blueprints
```

**Resultado esperado:** 
- No debe haber errores en los logs
- El blueprint `tracking_bp` debe estar registrado
- La app debe iniciar correctamente

---

### PRUEBA 2: Flujo Completo de Cliente

#### Paso 1: Crear un Pedido
1. Iniciar sesión como **cliente** (usuario normal)
2. Navegar al catálogo de productos
3. Agregar productos al carrito
4. Completar el checkout con dirección de envío clara
   - Ejemplo: "Calle 123, Ciudad de México, CDMX, México"

#### Paso 2: Esperar Cambio de Estado
El administrador o empleado debe cambiar el estado del pedido:
- De `pending` → `processing` → `shipped`

#### Paso 3: Acceder al Rastreo
1. Ir a "Mis Pedidos" en el dashboard del cliente
2. Buscar el pedido con estado "Enviado" o "En Camino"
3. Click en "Ver Rastreo en Tiempo Real"

**Resultado esperado:**
- Se abre la página de rastreo: `/client/order/{id}/tracking`
- Se muestra el mapa de Google Maps
- Se ve el mensaje "No hay información de rastreo disponible" (hasta que el empleado inicie el rastreo)

---

### PRUEBA 3: Flujo Completo de Empleado

#### Paso 1: Acceder a Rastreo de Entregas
1. Iniciar sesión como **empleado**
2. Click en "Rastreo de Entregas" en el menú lateral
3. Verificar que aparece el pedido enviado

**Resultado esperado:**
- La sección muestra estadísticas (Entregas Activas, Pendientes, Completadas)
- La tabla muestra pedidos con estado `shipped`, `in_transit`, o `delivered`
- El badge en el menú muestra el número de entregas activas

#### Paso 2: Iniciar Rastreo
1. Click en "Iniciar Rastreo" en un pedido con estado "Enviado"
2. Se abre el modal con el formulario:
   - **Dirección de destino:** (pre-llenada con la dirección del pedido)
   - **Nombre del conductor:** Ej. "Juan Pérez"
   - **Teléfono:** Ej. "+52 55 1234 5678"
   - **Información del vehículo:** Ej. "Camioneta blanca ABC-123"
3. Click en "Iniciar Rastreo"

**Resultado esperado:**
- Se cierra el modal
- El pedido cambia de estado a `in_transit` (En Camino)
- Aparece notificación de éxito
- El pedido ahora muestra botones "Actualizar Ubicación" y "Completar"

#### Paso 3: Actualizar Ubicación
1. Click en "Actualizar Ubicación"
2. Se abre el modal de geolocalización
3. El navegador solicita permiso para acceder a la ubicación
4. Click en "Permitir"
5. Se muestran las coordenadas actuales (Latitud y Longitud)
6. Click en "Confirmar Ubicación"

**Resultado esperado:**
- Se cierra el modal
- Aparece notificación de éxito
- La ubicación se guarda en la base de datos
- Se envía notificación al cliente si está cerca (<1km)

#### Paso 4: Cliente Ve el Rastreo
El cliente debe actualizar o volver a la página de rastreo:
1. Refrescar la página `/client/order/{id}/tracking`

**Resultado esperado:**
- El mapa muestra:
  - 📍 Marcador azul: Ubicación actual del conductor
  - 🏠 Marcador rojo: Dirección de destino
  - 🛣️ Línea de ruta entre ambos puntos
- Se muestra la tarjeta de ETA con:
  - Tiempo estimado de llegada
  - Distancia restante
- Se muestra información del conductor:
  - Nombre
  - Teléfono
  - Vehículo
- Línea de tiempo con estados del pedido
- Auto-actualización cada 30 segundos

#### Paso 5: Completar Entrega
Como empleado:
1. Click en "Completar" en el pedido
2. Confirmar la acción
3. El pedido cambia a estado `delivered`

**Resultado esperado:**
- Notificación de éxito
- El pedido desaparece de la lista de activos
- Aparece en "Completadas Hoy"
- El cliente recibe notificación de entrega

---

### PRUEBA 4: Verificar Notificaciones

#### Endpoint: GET /tracking/notifications
```bash
# Como cliente, obtener notificaciones
curl -X GET "http://localhost:5000/tracking/notifications" \
  -H "Cookie: session=tu_session_cookie"
```

**Resultado esperado:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "out_for_delivery",
      "title": "Pedido en camino",
      "message": "Tu pedido #123 está en camino",
      "is_read": false,
      "created_at": "2025-01-XX..."
    },
    {
      "id": 2,
      "type": "delivered",
      "title": "Pedido entregado",
      "message": "Tu pedido #123 ha sido entregado",
      "is_read": false,
      "created_at": "2025-01-XX..."
    }
  ]
}
```

---

### PRUEBA 5: Verificar Historial de Rastreo

Como empleado:
1. Click en "Ver Historial" en un pedido completado
2. Se abre un modal con el historial

**Resultado esperado:**
- Lista de eventos ordenados por fecha
- Cada evento muestra:
  - Estado
  - Fecha y hora
  - Ubicación (si aplica)
  - Notas (si aplica)

---

## 🔍 Endpoints de API para Pruebas Manuales

### 1. Iniciar Rastreo
```bash
POST /tracking/order/{order_id}/start
Content-Type: application/json

{
  "destination_address": "Calle 123, Ciudad de México",
  "driver_name": "Juan Pérez",
  "driver_phone": "+52 55 1234 5678",
  "vehicle_info": "Camioneta blanca ABC-123"
}
```

### 2. Actualizar Ubicación
```bash
PUT /tracking/order/{order_id}/location
Content-Type: application/json

{
  "latitude": 19.4326,
  "longitude": -99.1332
}
```

### 3. Obtener Información de Rastreo
```bash
GET /tracking/order/{order_id}
```

### 4. Obtener Ruta
```bash
GET /tracking/order/{order_id}/route
```

### 5. Completar Entrega
```bash
POST /tracking/order/{order_id}/complete
```

### 6. Ver Historial
```bash
GET /tracking/order/{order_id}/history
```

---

## 📊 Verificaciones de Base de Datos

### Ver Tracking Activo
```sql
SELECT * FROM delivery_tracking WHERE is_active = 1;
```

### Ver Historial de Estados
```sql
SELECT * FROM order_status_history 
ORDER BY created_at DESC 
LIMIT 20;
```

### Ver Notificaciones
```sql
SELECT * FROM order_notifications 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## ⚠️ Solución de Problemas

### Problema: "Google Maps no se carga"
**Solución:**
- Verificar que la API Key esté en el archivo `.env`
- Verificar que las APIs estén habilitadas en Google Cloud Console
- Verificar la consola del navegador (F12) para errores

### Problema: "Error al obtener ubicación"
**Solución:**
- El navegador requiere HTTPS para geolocalización (excepto localhost)
- Dar permiso de ubicación en el navegador
- En Chrome: icono de candado → Configuración del sitio → Ubicación → Permitir

### Problema: "No aparecen pedidos en Rastreo de Entregas"
**Solución:**
- Verificar que hay pedidos con estado `shipped`, `in_transit`, o `delivered`
- Verificar que el usuario es empleado
- Ver consola del navegador para errores en la carga

### Problema: "El mapa no muestra la ruta"
**Solución:**
- Verificar que la dirección de destino sea válida y geocodificable
- Verificar que hay ubicación actual del conductor
- Ver errores en la consola del servidor

---

## 📝 Checklist de Funcionalidades

### Cliente
- [ ] Ver lista de pedidos
- [ ] Acceder a página de rastreo desde pedido
- [ ] Ver mapa con ubicación actual y destino
- [ ] Ver ruta calculada en el mapa
- [ ] Ver ETA y distancia
- [ ] Ver información del conductor
- [ ] Ver línea de tiempo de estados
- [ ] Auto-actualización cada 30 segundos
- [ ] Recibir notificaciones

### Empleado
- [ ] Ver sección de "Rastreo de Entregas"
- [ ] Ver estadísticas (activas, pendientes, completadas)
- [ ] Ver lista de pedidos rastreables
- [ ] Iniciar rastreo con información del conductor
- [ ] Actualizar ubicación con geolocalización
- [ ] Completar entrega
- [ ] Ver historial de rastreo
- [ ] Filtrar por estado

### Sistema
- [ ] Geocodificación de direcciones
- [ ] Cálculo de rutas
- [ ] Cálculo de ETA
- [ ] Detección de proximidad (<1km)
- [ ] Creación de notificaciones
- [ ] Almacenamiento de historial
- [ ] Actualización de estados de pedidos

---

## 🎯 Próximos Pasos (Opcionales)

1. **Notificaciones en Tiempo Real**
   - Implementar WebSockets para notificaciones push
   - Agregar icono de campana con dropdown

2. **Interfaz de Admin**
   - Panel para ver todos los rastreos activos
   - Mapa con múltiples entregas simultáneas

3. **Mejoras de UX**
   - Sonido de notificación
   - Vibración en móvil
   - Modo oscuro

4. **Optimizaciones**
   - Cache de rutas calculadas
   - Batch de actualizaciones de ubicación
   - Compresión de coordenadas históricas

---

## 📞 Soporte

Si encuentras problemas durante las pruebas:
1. Verificar logs del servidor: `docker-compose logs -f flask_app`
2. Verificar consola del navegador (F12)
3. Verificar que el archivo `.env` tenga la API Key
4. Verificar que las tablas estén creadas en la BD

**¡Sistema listo para pruebas! 🚀**
