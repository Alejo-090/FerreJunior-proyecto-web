from flask import Flask
from Config.db import app, db
from Config.models import User, Product, Order
from datetime import datetime

def init_test_data():
    """Inicializa datos de prueba en la base de datos"""

    with app.app_context():
        # Crear las tablas si no existen
        db.create_all()

        # Verificar si ya existen productos
        if Product.query.count() > 0:
            print("Los productos ya existen en la base de datos.")
            return

        # Crear productos de prueba
        products = [
            Product(
                name="Martillo de Carpintero",
                description="Martillo profesional para carpintería",
                sku="MAR001",
                price=25.50,
                stock_quantity=15,
                min_stock_level=5,
                category="Herramientas Manuales",
                brand="FerreJunior",
                active=True
            ),
            Product(
                name="Destornillador Phillips",
                description="Destornillador profesional con punta Phillips",
                sku="DES001",
                price=8.75,
                stock_quantity=2,  # Stock bajo
                min_stock_level=5,
                category="Herramientas Manuales",
                brand="FerreJunior",
                active=True
            ),
            Product(
                name="Taladro Inalámbrico",
                description="Taladro profesional con batería recargable",
                sku="TAL001",
                price=125.00,
                stock_quantity=8,
                min_stock_level=3,
                category="Herramientas Eléctricas",
                brand="Bosch",
                active=True
            ),
            Product(
                name="Cinta Métrica 5m",
                description="Cinta métrica profesional de 5 metros",
                sku="CIN001",
                price=12.30,
                stock_quantity=1,  # Stock bajo
                min_stock_level=5,
                category="Medición",
                brand="Stanley",
                active=True
            ),
            Product(
                name="Guantes de Seguridad",
                description="Guantes resistentes para trabajo pesado",
                sku="GUA001",
                price=15.90,
                stock_quantity=25,
                min_stock_level=10,
                category="Seguridad",
                brand="FerreJunior",
                active=True
            )
        ]

        # Agregar productos
        try:
            for product in products:
                db.session.add(product)
            db.session.commit()
            print("Productos de prueba creados exitosamente")
        except Exception as e:
            print(f"Error al crear productos: {e}")
            db.session.rollback()
            return

        # Crear pedidos de prueba
        users = User.query.all()
        if len(users) >= 2:
            admin_user = users[0]  # Admin
            client_user = users[1]  # Cliente

            orders = [
                Order(
                    user_id=client_user.id,
                    order_number="ORD001",
                    status="pending",
                    total_amount=34.25,
                    shipping_address="Calle Principal 123, Ciudad",
                    payment_method="transferencia",
                    notes="Pedido urgente"
                ),
                Order(
                    user_id=client_user.id,
                    order_number="ORD002",
                    status="shipped",
                    total_amount=125.00,
                    shipping_address="Avenida Central 456, Ciudad",
                    payment_method="tarjeta",
                    notes="Entregar en horario de oficina"
                ),
                Order(
                    user_id=admin_user.id,
                    order_number="ORD003",
                    status="delivered",
                    total_amount=41.20,
                    shipping_address="Plaza Mayor 789, Ciudad",
                    payment_method="efectivo",
                    notes="Pedido completado"
                ),
                Order(
                    user_id=client_user.id,
                    order_number="ORD004",
                    status="pending",
                    total_amount=140.90,
                    shipping_address="Calle Nueva 321, Ciudad",
                    payment_method="transferencia",
                    notes="Cliente preferencial"
                )
            ]

            # Agregar pedidos
            try:
                for order in orders:
                    db.session.add(order)
                db.session.commit()
                print("Pedidos de prueba creados exitosamente")
            except Exception as e:
                print(f"Error al crear pedidos: {e}")
                db.session.rollback()
        else:
            print("No hay suficientes usuarios para crear pedidos de prueba")

if __name__ == '__main__':
    init_test_data()