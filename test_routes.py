#!/usr/bin/env python3
"""Script para probar las rutas JSON del admin"""

from flask import Flask
from Config.db import app, db
from Config.models import User, Product, Order
from flask_login import LoginManager
import json

# Configurar Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def test_routes():
    with app.test_client() as client:
        with app.app_context():
            # Crear usuario admin para la sesión
            admin = User.query.filter_by(role='admin').first()
            if not admin:
                print("No hay usuario admin en la base de datos")
                return

            # Iniciar sesión
            with client:
                # Simular login
                with client.session_transaction() as sess:
                    sess['user_id'] = str(admin.id)
                    sess['_fresh'] = True

                print("=== PRUEBA DE RUTAS JSON ===")

                # Probar ruta de usuarios
                print("\n1. Probando /admin/export-users-data")
                response = client.get('/admin/export-users-data')
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = json.loads(response.data)
                    print(f"Usuarios encontrados: {len(data['users'])}")
                else:
                    print(f"Error: {response.data}")

                # Probar ruta de productos con stock bajo
                print("\n2. Probando /admin/low-stock-products-data")
                response = client.get('/admin/low-stock-products-data')
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = json.loads(response.data)
                    print(f"Productos con stock bajo: {len(data['products'])}")
                else:
                    print(f"Error: {response.data}")

                # Probar ruta de pedidos pendientes
                print("\n3. Probando /admin/pending-orders-data")
                response = client.get('/admin/pending-orders-data')
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = json.loads(response.data)
                    print(f"Pedidos pendientes: {len(data['orders'])}")
                else:
                    print(f"Error: {response.data}")

                # Probar ruta de pedidos completados
                print("\n4. Probando /admin/completed-orders-data")
                response = client.get('/admin/completed-orders-data')
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = json.loads(response.data)
                    print(f"Pedidos completados: {len(data['orders'])}")
                else:
                    print(f"Error: {response.data}")

if __name__ == "__main__":
    test_routes()