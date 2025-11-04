"""
Verification script for Google Maps API
Tests the API key and Google Maps services
"""

import os
import sys
import requests
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from Config.google_maps_config import GoogleMapsConfig

def print_header(title):
    """Print a formatted header"""
    print()
    print("=" * 70)
    print(f"  {title}")
    print("=" * 70)
    print()

def print_section(title):
    """Print a section title"""
    print()
    print(f"📋 {title}")
    print("-" * 70)

def test_api_key():
    """Test if API key is configured"""
    print_section("Verificación de API Key")
    
    if not GoogleMapsConfig.API_KEY:
        print("❌ API Key NO configurada")
        print()
        print("Para configurar:")
        print("1. Agrega GOOGLE_MAPS_API_KEY=tu_api_key al archivo .env")
        print("2. O exporta la variable: export GOOGLE_MAPS_API_KEY=tu_api_key")
        return False
    
    print(f"✅ API Key encontrada: {GoogleMapsConfig.API_KEY[:20]}...")
    return True

def test_geocoding_api():
    """Test Geocoding API"""
    print_section("Probando Geocoding API")
    
    # Test address
    test_address = "Calle 100, Bogotá, Colombia"
    
    try:
        params = GoogleMapsConfig.get_geocoding_params(test_address)
        response = requests.get(GoogleMapsConfig.GEOCODING_API_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'OK':
                result = data['results'][0]
                location = result['geometry']['location']
                formatted_address = result['formatted_address']
                
                print(f"✅ Geocoding API funcionando correctamente")
                print(f"   Dirección probada: {test_address}")
                print(f"   Dirección formateada: {formatted_address}")
                print(f"   Coordenadas: {location['lat']}, {location['lng']}")
                return True
            else:
                print(f"❌ Error en respuesta: {data['status']}")
                if 'error_message' in data:
                    print(f"   Mensaje: {data['error_message']}")
                return False
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error al conectar con Geocoding API: {str(e)}")
        return False

def test_directions_api():
    """Test Directions API"""
    print_section("Probando Directions API")
    
    # Test route
    origin = "4.6097,-74.0817"  # Bogotá center
    destination = "4.6533,-74.0836"  # North Bogotá
    
    try:
        params = GoogleMapsConfig.get_directions_params(origin, destination)
        response = requests.get(GoogleMapsConfig.DIRECTIONS_API_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'OK':
                route = data['routes'][0]
                leg = route['legs'][0]
                
                distance = leg['distance']['text']
                duration = leg['duration']['text']
                
                print(f"✅ Directions API funcionando correctamente")
                print(f"   Origen: {leg['start_address']}")
                print(f"   Destino: {leg['end_address']}")
                print(f"   Distancia: {distance}")
                print(f"   Duración: {duration}")
                
                # Show first few steps
                if len(leg['steps']) > 0:
                    print(f"   Primeros pasos de la ruta:")
                    for i, step in enumerate(leg['steps'][:3], 1):
                        instruction = step['html_instructions'].replace('<b>', '').replace('</b>', '')
                        print(f"     {i}. {instruction}")
                
                return True
            else:
                print(f"❌ Error en respuesta: {data['status']}")
                if 'error_message' in data:
                    print(f"   Mensaje: {data['error_message']}")
                return False
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error al conectar con Directions API: {str(e)}")
        return False

def test_distance_matrix_api():
    """Test Distance Matrix API"""
    print_section("Probando Distance Matrix API")
    
    origins = ["4.6097,-74.0817"]  # Bogotá center
    destinations = ["4.6533,-74.0836", "4.5709,-74.2973"]  # Two destinations
    
    try:
        params = GoogleMapsConfig.get_distance_matrix_params(origins, destinations)
        response = requests.get(GoogleMapsConfig.DISTANCE_MATRIX_API_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'OK':
                print(f"✅ Distance Matrix API funcionando correctamente")
                
                for i, dest_address in enumerate(data['destination_addresses']):
                    element = data['rows'][0]['elements'][i]
                    if element['status'] == 'OK':
                        distance = element['distance']['text']
                        duration = element['duration']['text']
                        print(f"   Destino {i+1}: {dest_address}")
                        print(f"     - Distancia: {distance}")
                        print(f"     - Duración: {duration}")
                
                return True
            else:
                print(f"❌ Error en respuesta: {data['status']}")
                return False
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error al conectar con Distance Matrix API: {str(e)}")
        return False

def show_config_summary():
    """Show configuration summary"""
    print_section("Resumen de Configuración")
    
    print(f"📍 Centro predeterminado: {GoogleMapsConfig.DEFAULT_CENTER}")
    print(f"⏱️  Intervalo de actualización: {GoogleMapsConfig.TRACKING_UPDATE_INTERVAL} segundos")
    print(f"📏 Distancia de notificación cercana: {GoogleMapsConfig.NEAR_DELIVERY_DISTANCE} km")
    print(f"🚗 Velocidad promedio: {GoogleMapsConfig.AVERAGE_SPEED} km/h")
    print(f"🔍 Nivel de zoom predeterminado: {GoogleMapsConfig.DEFAULT_ZOOM_LEVEL}")
    print(f"🔍 Nivel de zoom de entrega: {GoogleMapsConfig.DELIVERY_ZOOM_LEVEL}")

def main():
    """Run all verification tests"""
    print_header("VERIFICACIÓN DE GOOGLE MAPS API")
    
    # Track results
    results = {
        'api_key': False,
        'geocoding': False,
        'directions': False,
        'distance_matrix': False
    }
    
    # Test API key
    results['api_key'] = test_api_key()
    
    if not results['api_key']:
        print()
        print("⚠️  No se puede continuar sin API Key")
        return False
    
    # Test APIs
    results['geocoding'] = test_geocoding_api()
    results['directions'] = test_directions_api()
    results['distance_matrix'] = test_distance_matrix_api()
    
    # Show config
    show_config_summary()
    
    # Summary
    print_section("Resultados Finales")
    
    all_passed = all(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name.replace('_', ' ').title()}")
    
    print()
    if all_passed:
        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print()
        print("Próximos pasos:")
        print("1. Las tablas de la base de datos ya deben estar creadas")
        print("2. Reinicia Docker: docker-compose restart app")
        print("3. Procede a implementar FASE 2 (endpoints del backend)")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa la configuración.")
        print()
        print("Posibles soluciones:")
        print("- Verifica que la API Key sea válida")
        print("- Asegúrate de tener habilitadas las APIs en Google Cloud Console:")
        print("  * Geocoding API")
        print("  * Directions API")
        print("  * Distance Matrix API")
        print("- Verifica que la API Key tenga los permisos necesarios")
    
    print()
    print("=" * 70)
    
    return all_passed

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
