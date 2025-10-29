#!/usr/bin/env python3
"""Script mínimo para probar Flask"""

try:
    from flask import Flask
    print("✓ Flask importado correctamente")

    app = Flask(__name__)
    print("✓ App Flask creada correctamente")

    @app.route('/')
    def hello():
        return "Hello World!"

    print("✓ Ruta definida correctamente")

    # Probar si la app puede ejecutarse en modo de prueba
    with app.test_client() as client:
        response = client.get('/')
        print(f"✓ Respuesta de prueba: {response.status_code}")
        print(f"✓ Contenido: {response.data.decode()}")

    print("\n🎉 Flask funciona correctamente!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()