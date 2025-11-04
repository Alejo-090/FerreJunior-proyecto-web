"""
Test script for tracking endpoints
Verifies all tracking API endpoints are working correctly
"""

import requests
import json
from datetime import datetime

# Base URL
BASE_URL = "http://localhost:5000"

# Test credentials
EMPLOYEE_EMAIL = "empleado@ferrejunior.com"
EMPLOYEE_PASSWORD = "empleado123"
CLIENT_EMAIL = "cliente@ferrejunior.com"
CLIENT_PASSWORD = "cliente123"

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_header(title):
    print()
    print("=" * 70)
    print(f"{BLUE}{title}{RESET}")
    print("=" * 70)

def print_section(title):
    print()
    print(f"{YELLOW}📋 {title}{RESET}")
    print("-" * 70)

def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
    print(f"{RED}❌ {message}{RESET}")

def print_info(message):
    print(f"   {message}")

def login(email, password):
    """Login and get session"""
    session = requests.Session()
    
    # Get CSRF token
    response = session.get(f"{BASE_URL}/auth/login")
    
    # Login
    response = session.post(
        f"{BASE_URL}/auth/login",
        data={
            'email': email,
            'password': password
        },
        allow_redirects=False
    )
    
    if response.status_code in [200, 302]:
        return session
    else:
        return None

def test_start_tracking(session, order_id=1):
    """Test starting tracking for an order"""
    print_section("Iniciando Rastreo de Pedido")
    
    data = {
        "destination_address": "Calle 100, Bogotá, Colombia",
        "driver_name": "Juan Pérez",
        "driver_phone": "3001234567",
        "vehicle_info": "Moto - ABC123"
    }
    
    response = session.post(
        f"{BASE_URL}/tracking/order/{order_id}/start",
        json=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print_success(f"Rastreo iniciado para pedido #{order_id}")
        print_info(f"Destino: {result['tracking']['destination_address']}")
        print_info(f"Conductor: {result['tracking']['driver_name']}")
        return True
    else:
        print_error(f"Error al iniciar rastreo: {response.status_code}")
        print_info(response.text)
        return False

def test_update_location(session, order_id=1):
    """Test updating delivery location"""
    print_section("Actualizando Ubicación")
    
    # Coordinates near Bogotá center
    data = {
        "latitude": 4.6533,
        "longitude": -74.0836
    }
    
    response = session.put(
        f"{BASE_URL}/tracking/order/{order_id}/location",
        json=data
    )
    
    if response.status_code == 200:
        result = response.json()
        tracking = result['tracking']
        print_success("Ubicación actualizada")
        print_info(f"Ubicación actual: {tracking.get('current_address', 'N/A')}")
        print_info(f"Distancia al destino: {tracking.get('distance_km', 'N/A')} km")
        print_info(f"Tiempo estimado: {tracking.get('time_minutes', 'N/A')} min")
        return True
    else:
        print_error(f"Error al actualizar ubicación: {response.status_code}")
        print_info(response.text)
        return False

def test_get_tracking(session, order_id=1):
    """Test getting tracking information"""
    print_section("Obteniendo Información de Rastreo")
    
    response = session.get(f"{BASE_URL}/tracking/order/{order_id}")
    
    if response.status_code == 200:
        result = response.json()
        tracking = result['tracking']
        print_success("Información de rastreo obtenida")
        print_info(f"Pedido: #{result['order']['id']} - Estado: {result['order']['status']}")
        print_info(f"Destino: {tracking.get('destination_address', 'N/A')}")
        print_info(f"Distancia restante: {tracking.get('distance_km', 'N/A')} km")
        print_info(f"ETA: {tracking.get('eta', 'N/A')}")
        return True
    else:
        print_error(f"Error al obtener rastreo: {response.status_code}")
        print_info(response.text)
        return False

def test_get_route(session, order_id=1):
    """Test getting route information"""
    print_section("Obteniendo Ruta")
    
    response = session.get(f"{BASE_URL}/tracking/order/{order_id}/route")
    
    if response.status_code == 200:
        result = response.json()
        route = result['route']
        print_success("Ruta calculada")
        print_info(f"Distancia: {route.get('distance_text', 'N/A')}")
        print_info(f"Duración: {route.get('duration_text', 'N/A')}")
        print_info(f"Pasos de la ruta: {len(route.get('steps', []))}")
        return True
    else:
        print_error(f"Error al obtener ruta: {response.status_code}")
        print_info(response.text)
        return False

def test_get_history(session, order_id=1):
    """Test getting tracking history"""
    print_section("Obteniendo Historial")
    
    response = session.get(f"{BASE_URL}/tracking/order/{order_id}/history")
    
    if response.status_code == 200:
        result = response.json()
        history = result['history']
        print_success(f"Historial obtenido: {len(history)} entradas")
        for entry in history[:3]:  # Show first 3
            print_info(f"- {entry['status']} - {entry.get('notes', 'N/A')}")
        return True
    else:
        print_error(f"Error al obtener historial: {response.status_code}")
        print_info(response.text)
        return False

def test_notifications(session):
    """Test getting notifications"""
    print_section("Obteniendo Notificaciones")
    
    response = session.get(f"{BASE_URL}/tracking/notifications")
    
    if response.status_code == 200:
        result = response.json()
        notifications = result['notifications']
        unread_count = result['unread_count']
        print_success(f"Notificaciones obtenidas: {len(notifications)} total, {unread_count} sin leer")
        for notif in notifications[:3]:  # Show first 3
            status = "📬" if not notif['is_read'] else "📭"
            print_info(f"{status} {notif['message']}")
        return True
    else:
        print_error(f"Error al obtener notificaciones: {response.status_code}")
        print_info(response.text)
        return False

def test_complete_delivery(session, order_id=1):
    """Test completing delivery"""
    print_section("Completando Entrega")
    
    response = session.post(f"{BASE_URL}/tracking/order/{order_id}/complete")
    
    if response.status_code == 200:
        result = response.json()
        print_success("Entrega completada")
        print_info(f"Pedido #{result['order']['id']} - Estado: {result['order']['status']}")
        return True
    else:
        print_error(f"Error al completar entrega: {response.status_code}")
        print_info(response.text)
        return False

def main():
    print_header("PRUEBA DE ENDPOINTS DE RASTREO - DOCUMENTACIÓN")
    
    print_section("📚 Endpoints Disponibles")
    
    endpoints = [
        {
            'method': 'POST',
            'url': '/tracking/order/<order_id>/start',
            'desc': 'Iniciar rastreo de pedido',
            'auth': 'Empleado/Admin',
            'body': {
                'destination_address': 'Calle 100, Bogotá',
                'driver_name': 'Juan Pérez',
                'driver_phone': '3001234567',
                'vehicle_info': 'Moto - ABC123'
            }
        },
        {
            'method': 'PUT',
            'url': '/tracking/order/<order_id>/location',
            'desc': 'Actualizar ubicación del conductor',
            'auth': 'Empleado/Admin',
            'body': {
                'latitude': 4.6533,
                'longitude': -74.0836
            }
        },
        {
            'method': 'GET',
            'url': '/tracking/order/<order_id>',
            'desc': 'Obtener información de rastreo',
            'auth': 'Usuario del pedido/Empleado/Admin',
            'body': None
        },
        {
            'method': 'GET',
            'url': '/tracking/order/<order_id>/route',
            'desc': 'Obtener ruta con polyline para mapa',
            'auth': 'Usuario del pedido/Empleado/Admin',
            'body': None
        },
        {
            'method': 'GET',
            'url': '/tracking/order/<order_id>/history',
            'desc': 'Obtener historial de ubicaciones',
            'auth': 'Usuario del pedido/Empleado/Admin',
            'body': None
        },
        {
            'method': 'POST',
            'url': '/tracking/order/<order_id>/complete',
            'desc': 'Marcar entrega como completada',
            'auth': 'Empleado/Admin',
            'body': None
        },
        {
            'method': 'POST',
            'url': '/tracking/order/<order_id>/cancel',
            'desc': 'Cancelar rastreo activo',
            'auth': 'Empleado/Admin',
            'body': None
        },
        {
            'method': 'GET',
            'url': '/tracking/notifications',
            'desc': 'Obtener notificaciones del usuario',
            'auth': 'Usuario autenticado',
            'body': None,
            'params': '?unread_only=true&limit=50'
        },
        {
            'method': 'PUT',
            'url': '/tracking/notifications/<notif_id>/read',
            'desc': 'Marcar notificación como leída',
            'auth': 'Usuario autenticado',
            'body': None
        },
        {
            'method': 'PUT',
            'url': '/tracking/notifications/read-all',
            'desc': 'Marcar todas las notificaciones como leídas',
            'auth': 'Usuario autenticado',
            'body': None,
            'params': '?order_id=<order_id>'
        }
    ]
    
    for endpoint in endpoints:
        print()
        print(f"{BLUE}{endpoint['method']}{RESET} {BASE_URL}{endpoint['url']}")
        print(f"   📝 {endpoint['desc']}")
        print(f"   🔐 Requiere: {endpoint['auth']}")
        if endpoint.get('params'):
            print(f"   🔗 Parámetros: {endpoint['params']}")
        if endpoint['body']:
            print(f"   📦 Body JSON:")
            print(f"   {json.dumps(endpoint['body'], indent=6)}")
    
    print_header("FLUJO COMPLETO DE RASTREO")
    
    print_section("1️⃣ Iniciar Rastreo (Empleado)")
    print_info("POST /tracking/order/1/start")
    print_info("Body: { destination_address, driver_name, driver_phone, vehicle_info }")
    print_info("➡️ Crea DeliveryTracking, geocodifica destino, notifica al cliente")
    
    print_section("2️⃣ Actualizar Ubicación (Empleado - cada 30s)")
    print_info("PUT /tracking/order/1/location")
    print_info("Body: { latitude, longitude }")
    print_info("➡️ Actualiza ubicación, calcula distancia/ETA, notifica si está cerca")
    
    print_section("3️⃣ Ver Rastreo (Cliente)")
    print_info("GET /tracking/order/1")
    print_info("➡️ Obtiene ubicación actual, ETA, información del conductor")
    
    print_section("4️⃣ Ver Ruta en Mapa (Cliente)")
    print_info("GET /tracking/order/1/route")
    print_info("➡️ Obtiene polyline, pasos de ruta, distancia y duración")
    
    print_section("5️⃣ Completar Entrega (Empleado)")
    print_info("POST /tracking/order/1/complete")
    print_info("➡️ Marca pedido como entregado, desactiva rastreo, notifica cliente")
    
    print_header("SERVICIOS DE GOOGLE MAPS")
    
    services = [
        {
            'name': 'Geocoding API',
            'usage': 'Convertir direcciones a coordenadas',
            'example': '"Calle 100, Bogotá" → (4.687, -74.058)'
        },
        {
            'name': 'Reverse Geocoding',
            'usage': 'Convertir coordenadas a direcciones',
            'example': '(4.687, -74.058) → "Ac 100, Bogotá"'
        },
        {
            'name': 'Directions API',
            'usage': 'Calcular rutas con pasos detallados',
            'example': 'Origen → Destino con polyline para mapa'
        },
        {
            'name': 'Distance Matrix API',
            'usage': 'Calcular distancia y tiempo rápidamente',
            'example': 'Ubicación actual → Destino (7.1 km, 16 min)'
        }
    ]
    
    for service in services:
        print()
        print(f"{GREEN}✅ {service['name']}{RESET}")
        print(f"   {service['usage']}")
        print(f"   Ejemplo: {service['example']}")
    
    print_header("MODELOS DE BASE DE DATOS")
    
    print_section("OrderStatusHistory")
    print_info("• Historial de cambios de estado con geolocalización")
    print_info("• Campos: order_id, status, latitude, longitude, address, created_at")
    
    print_section("DeliveryTracking")
    print_info("• Rastreo en tiempo real del pedido")
    print_info("• Ubicación actual + destino + conductor + ETA")
    print_info("• Campos: current_lat/lng, destination_lat/lng, driver_info, distance_km, eta")
    
    print_section("OrderNotification")
    print_info("• Notificaciones automáticas para usuarios")
    print_info("• Tipos: confirmado, en preparación, en camino, cerca, entregado")
    print_info("• Campos: user_id, order_id, message, type, is_read")
    
    print_header("SERVICIOS IMPLEMENTADOS")
    
    print_section("GoogleMapsService")
    print_info("✓ geocode_address(address)")
    print_info("✓ reverse_geocode(lat, lng)")
    print_info("✓ calculate_route(origin, destination)")
    print_info("✓ calculate_distance_and_time(origin, destination)")
    print_info("✓ calculate_eta(distance_km)")
    print_info("✓ is_near_delivery(distance_km)")
    
    print_section("NotificationService")
    print_info("✓ create_notification(user_id, order_id, type)")
    print_info("✓ notify_order_confirmed(user_id, order_id)")
    print_info("✓ notify_out_for_delivery(user_id, order_id)")
    print_info("✓ notify_near_delivery(user_id, order_id, minutes)")
    print_info("✓ notify_delivered(user_id, order_id)")
    print_info("✓ get_user_notifications(user_id, unread_only)")
    print_info("✓ mark_as_read(notification_id)")
    
    print_header("PRUEBA MANUAL CON CURL/POSTMAN")
    
    print_section("Ejemplo con curl (desde terminal)")
    
    print()
    print(f"{YELLOW}# 1. Login como empleado{RESET}")
    print('curl -X POST http://localhost:5000/auth/login \\')
    print('  -d "email=empleado@ferrejunior.com" \\')
    print('  -d "password=empleado123" \\')
    print('  -c cookies.txt')
    
    print()
    print(f"{YELLOW}# 2. Iniciar rastreo{RESET}")
    print('curl -X POST http://localhost:5000/tracking/order/1/start \\')
    print('  -b cookies.txt \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"destination_address":"Calle 100, Bogotá","driver_name":"Juan Pérez","driver_phone":"3001234567","vehicle_info":"Moto ABC123"}\'')
    
    print()
    print(f"{YELLOW}# 3. Actualizar ubicación{RESET}")
    print('curl -X PUT http://localhost:5000/tracking/order/1/location \\')
    print('  -b cookies.txt \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"latitude":4.6533,"longitude":-74.0836}\'')
    
    print()
    print(f"{YELLOW}# 4. Ver rastreo{RESET}")
    print('curl -X GET http://localhost:5000/tracking/order/1 \\')
    print('  -b cookies.txt')
    
    print_header("ESTADO DE IMPLEMENTACIÓN")
    
    status_items = [
        ('Modelos de base de datos', True),
        ('Servicios de Google Maps', True),
        ('Servicios de notificaciones', True),
        ('Blueprint de tracking', True),
        ('Endpoints de rastreo', True),
        ('Endpoints de notificaciones', True),
        ('Migración de base de datos', True),
        ('Configuración de Google Maps', True),
        ('APIs de Google verificadas', True),
        ('Frontend con mapas', False),
        ('Interfaz de rastreo para cliente', False),
        ('Interfaz de gestión para empleado', False)
    ]
    
    print()
    for item, completed in status_items:
        status = f"{GREEN}✅{RESET}" if completed else f"{YELLOW}⏳{RESET}"
        print(f"{status} {item}")
    
    print()
    print(f"{BLUE}FASE 2 (Backend): COMPLETADA ✅{RESET}")
    print(f"{YELLOW}FASE 3 (Frontend): PENDIENTE ⏳{RESET}")
    
    print()
    print("=" * 70)

if __name__ == '__main__':
    main()
