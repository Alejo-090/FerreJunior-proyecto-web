#!/usr/bin/env python3
"""Script de prueba para verificar imports de la aplicación FerreJunior"""

try:
    print("Verificando imports básicos...")
    from flask import Flask
    print("✓ Flask importado correctamente")

    from Config.db import app, db
    print("✓ Config.db importado correctamente")

    from Config.models import User, Product, Order
    print("✓ Modelos importados correctamente")

    from Config.decorators import admin_required, employee_required, client_access
    print("✓ Decoradores importados correctamente")

    # Verificar blueprints
    from Config.blueprints.auth import auth_bp
    from Config.blueprints.admin import admin_bp
    from Config.blueprints.employee import employee_bp
    from Config.blueprints.client import client_bp
    from Config.blueprints.main import main_bp
    print("✓ Blueprints importados correctamente")

    print("\n🎉 Todos los imports funcionan correctamente!")
    print("La aplicación debería poder iniciarse sin problemas.")

except ImportError as e:
    print(f"❌ Error de importación: {e}")
except Exception as e:
    print(f"❌ Error inesperado: {e}")