#!/usr/bin/env python3
"""Script de prueba para verificar datos en la base de datos y rutas"""

from Config.db import app, db
from Config.models import User, Product, Order

def test_database():
    with app.app_context():
        print("=== VERIFICANDO DATOS EN BASE DE DATOS ===")

        # Verificar usuarios
        users = User.query.all()
        print(f"Usuarios encontrados: {len(users)}")
        for user in users:
            print(f"  - {user.name} ({user.email}) - Rol: {user.role}")

        # Verificar productos
        products = Product.query.all()
        print(f"Productos encontrados: {len(products)}")
        for product in products:
            print(f"  - {product.name} (SKU: {product.sku}) - Stock: {product.stock_quantity}")

        # Verificar pedidos
        orders = Order.query.all()
        print(f"Pedidos encontrados: {len(orders)}")
        for order in orders:
            user = User.query.get(order.user_id)
            user_name = user.name if user else "Usuario desconocido"
            print(f"  - Pedido {order.order_number} - Usuario: {user_name} - Estado: {order.status}")

        print("\n=== VERIFICANDO CONSULTAS ESPECÍFICAS ===")

        # Productos con stock bajo
        low_stock = Product.query.filter(Product.stock_quantity <= Product.min_stock_level).all()
        print(f"Productos con stock bajo: {len(low_stock)}")

        # Pedidos pendientes
        pending_orders = Order.query.filter_by(status='pending').all()
        print(f"Pedidos pendientes: {len(pending_orders)}")

        # Pedidos completados
        completed_orders = Order.query.filter(Order.status.in_(['shipped', 'delivered'])).all()
        print(f"Pedidos completados: {len(completed_orders)}")

if __name__ == "__main__":
    test_database()