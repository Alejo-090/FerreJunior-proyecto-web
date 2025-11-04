from flask import render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_required, current_user
from flask_wtf.csrf import generate_csrf
from . import client_bp
from Config.decorators import client_access
from Config.models.user import User
from Config.models.order import Order
from Config.models.order_item import OrderItem
from Config.models.address import Address
from Config.models.product import Product
from Config.models.cart import Cart, CartItem
import random
from Config.db import db
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
import json

@client_bp.route("/client")
@client_access
def client_dashboard():
    """Dashboard para clientes con estadísticas y resumen"""
    return render_template("views/client/client_dashboard.html")

@client_bp.route("/client/dashboard-data")
@client_access
def client_dashboard_data():
    """API endpoint para obtener datos del dashboard del cliente"""
    try:
        # Estadísticas del cliente
        total_orders = Order.query.filter_by(user_id=current_user.id).count()
        completed_orders = Order.query.filter_by(user_id=current_user.id, status='delivered').count()
        total_spent = db.session.query(db.func.sum(Order.total_amount)).filter_by(user_id=current_user.id, status='delivered').scalar() or 0

        # Calcular días activo (desde la fecha de registro hasta ahora)
        days_active = 0
        if current_user.created_at:
            days_active = (datetime.utcnow() - current_user.created_at).days

        # Calcular rating promedio (esto sería de reseñas, por ahora usamos un valor simulado)
        rating = 4.5  # En una implementación real, esto vendría de reseñas de productos

        # Calcular satisfacción (porcentaje de pedidos completados vs total)
        satisfaction = 0
        if total_orders > 0:
            satisfaction = int((completed_orders / total_orders) * 100)

        # Pedidos recientes (últimos 5) - cargar items explícitamente
        recent_orders = Order.query.filter_by(user_id=current_user.id).options(
            joinedload(Order.items)
        ).order_by(Order.created_at.desc()).limit(5).all()
        recent_orders_data = []
        for order in recent_orders:
            try:
                recent_orders_data.append(order.to_dict())
            except Exception as e:
                print(f"Error serializando orden {order.id}: {e}")
                # Crear dict básico sin items si hay error
                recent_orders_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'status_display': 'Pendiente' if order.status == 'pending' else order.status.title(),
                    'total_amount': float(order.total_amount),
                    'total_amount_cop': int(round(order.total_amount)),
                    'created_at': order.created_at.isoformat() if order.created_at else None,
                    'items': [],
                    'items_count': 0
                })

        # Próximos pedidos en proceso - cargar items explícitamente
        pending_orders = Order.query.filter_by(user_id=current_user.id).filter(
            Order.status.in_(['pending', 'processing', 'shipped'])
        ).options(
            joinedload(Order.items)
        ).order_by(Order.created_at.desc()).all()
        pending_orders_data = []
        for order in pending_orders:
            try:
                pending_orders_data.append(order.to_dict())
            except Exception as e:
                print(f"Error serializando orden {order.id}: {e}")
                # Crear dict básico sin items si hay error
                pending_orders_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'status_display': 'Pendiente' if order.status == 'pending' else order.status.title(),
                    'total_amount': float(order.total_amount),
                    'total_amount_cop': int(round(order.total_amount)),
                    'created_at': order.created_at.isoformat() if order.created_at else None,
                    'items': [],
                    'items_count': 0
                })

        return jsonify({
            'stats': {
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'total_spent': float(total_spent),
                'total_spent_cop': int(round(total_spent)) if total_spent is not None else 0,
                'pending_orders': len(pending_orders),
                'rating': rating,
                'days_active': days_active,
                'satisfaction': satisfaction
            },
            'recent_orders': recent_orders_data,
            'pending_orders': pending_orders_data,
            'success': True
        })
    except Exception as e:
        print(f"Error en client_dashboard_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/orders")
@client_access
def client_orders():
    """Página de historial de pedidos del cliente"""
    return render_template("views/client/client_orders.html")

@client_bp.route("/client/orders-data")
@client_access
def client_orders_data():
    """API endpoint para obtener pedidos del cliente con paginación"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status_filter = request.args.get('status', None)

        query = Order.query.filter_by(user_id=current_user.id).options(
            joinedload(Order.items).joinedload(OrderItem.product)
        )

        if status_filter:
            query = query.filter_by(status=status_filter)

        orders = query.order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        # Serializar órdenes con manejo de errores
        orders_data = []
        for order in orders.items:
            try:
                orders_data.append(order.to_dict())
            except Exception as e:
                print(f"Error serializando orden {order.id}: {e}")
                import traceback
                traceback.print_exc()
                # Crear dict básico sin items si hay error
                orders_data.append({
                    'id': order.id,
                    'user_id': order.user_id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'status_display': 'Pendiente' if order.status == 'pending' else order.status.title(),
                    'total_amount': float(order.total_amount),
                    'total_amount_cop': int(round(order.total_amount)),
                    'subtotal': 0,
                    'subtotal_cop': 0,
                    'shipping_cost': 0,
                    'shipping_cost_cop': 0,
                    'tax_amount': 0,
                    'tax_amount_cop': 0,
                    'shipping_address': order.shipping_address,
                    'payment_method': order.payment_method,
                    'notes': order.notes or '',
                    'created_at': order.created_at.isoformat() if order.created_at else None,
                    'updated_at': order.updated_at.isoformat() if order.updated_at else None,
                    'user_name': current_user.name if current_user else None,
                    'user_email': current_user.email if current_user else None,
                    'items_count': 0,
                    'items': []
                })

        return jsonify({
            'orders': orders_data,
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages,
                'has_next': orders.has_next,
                'has_prev': orders.has_prev
            },
            'success': True
        })
    except Exception as e:
        print(f"Error en client_orders_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/order/<int:order_id>")
@client_access
def client_order_detail(order_id):
    """Página de detalle de un pedido específico"""
    try:
        order = Order.query.get_or_404(order_id)

        # Verificar que el pedido pertenece al cliente actual
        if order.user_id != current_user.id:
            flash('No tienes permiso para ver este pedido.', 'error')
            return redirect(url_for('client.client_orders'))

        return render_template("views/client/client_order_detail.html", order=order)
    except Exception as e:
        flash('Pedido no encontrado.', 'error')
        return redirect(url_for('client.client_orders'))

@client_bp.route("/client/order/<int:order_id>/data")
@client_access
def client_order_detail_data(order_id):
    """API endpoint para obtener detalles completos de un pedido"""
    try:
        order = Order.query.get_or_404(order_id)

        # Verificar que el pedido pertenece al cliente actual
        if order.user_id != current_user.id:
            return jsonify({'error': 'No tienes permiso para ver este pedido', 'success': False}), 403

        # Obtener items del pedido (si existe el modelo OrderItem)
        order_items = []
        if hasattr(order, 'items'):
            order_items = [item.to_dict() for item in order.items]

        return jsonify({
            'order': order.to_dict(),
            'items': order_items,
            'success': True
        })
    except Exception as e:
        print(f"Error en client_order_detail_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/catalog")
@client_access
def catalog():
    """Página del catálogo de productos"""
    return render_template("views/client/catalog.html")


@client_bp.route('/client/catalog-data')
@client_access
def catalog_data():
    """API: lista de productos activos (sin mocks)"""
    try:
        # soporta paginación opcional ?page=1&per_page=12
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))

        query = Product.query.filter_by(active=True).order_by(Product.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        products = pagination.items
        data = [p.to_dict() for p in products]

        return jsonify({
            'products': data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'success': True
        })
    except Exception as e:
        print(f"Error en catalog_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/checkout")
@client_access
def checkout():
    """Página de proceso de pago / carrito de compras"""
    # Obtener carrito persistido en la base de datos para el usuario actual
    cart = Cart.query.filter_by(user_id=current_user.id).first()
    if not cart:
        # crear carrito vacío para el usuario
        cart = Cart(user_id=current_user.id)
        db.session.add(cart)
        db.session.commit()

    cart_items = []
    for it in cart.items:
        prod = it.product
        if not prod:
            continue
        cart_items.append({
            'id': it.id,
            'product_id': prod.id,
            'name': prod.name,
            'model': getattr(prod, 'brand', '') or getattr(prod, 'sku', ''),
            # Prefer the unit_price snapshot from the cart item if present
            'price': float(it.unit_price) if it.unit_price is not None else float(prod.price),
            'price_cop': int(round(it.unit_price)) if it.unit_price is not None else int(round(prod.price)) if prod.price is not None else 0,
            'quantity': it.quantity,
            'image': None
        })

    subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
    subtotal_cop = int(round(subtotal)) if subtotal is not None else 0
    shipping = 15000 if subtotal < 200000 else 0
    shipping_cop = int(round(shipping))
    tax = int(subtotal * 0.19) if subtotal else 0  # IVA 19%
    tax_cop = int(round(tax)) if tax is not None else 0
    total = subtotal + shipping + tax
    total_cop = int(round(total)) if total is not None else 0

    return render_template("views/client/checkout.html",
                         cart_items=cart_items,
                         subtotal=subtotal,
                         subtotal_cop=subtotal_cop,
                         shipping=shipping,
                         shipping_cop=shipping_cop,
                         tax=tax,
                         tax_cop=tax_cop,
                         total=total,
                         total_cop=total_cop)

@client_bp.route("/product/<int:product_id>")
@client_access
def product_detail(product_id):
    """Página de detalle de producto"""
    # Obtener producto real desde la base de datos
    product = Product.query.get_or_404(product_id)

    # Productos relacionados por categoría (máx 4)
    related_q = Product.query.filter(Product.category_id == product.category_id, Product.id != product.id, Product.active == True).limit(4).all()
    related_products = [p.to_dict() for p in related_q]

    # Construir un dict compatible con la plantilla (agregar campos opcionales/compatibilidad)
    product_data = product.to_dict()
    product_data['in_stock'] = (product.stock_quantity > 0)
    product_data['rating'] = getattr(product, 'rating', 4.5) or 4.5
    product_data['reviews'] = getattr(product, 'reviews', 0) or 0
    product_data['special_price'] = getattr(product, 'special_price', None)
    product_data['features'] = getattr(product, 'features', []) or []
    product_data['specifications'] = getattr(product, 'specifications', {}) or {}
    product_data['image'] = getattr(product, 'image', None)

    return render_template("views/client/product_detail.html", product=product_data, related_products=related_products)


@client_bp.route('/client/cart', methods=['GET'])
def client_get_cart():
    """API que devuelve el carrito del usuario actual"""
    try:
        # Support both authenticated users (DB-backed carts) and anonymous guests (session-backed)
        if current_user.is_authenticated:
            cart = Cart.query.filter_by(user_id=current_user.id).first()
            if not cart:
                cart = Cart(user_id=current_user.id)
                db.session.add(cart)
                db.session.commit()

            items = []
            for it in cart.items:
                if not it.product:
                    continue
                # Prefer stored unit_price on cart item (snapshot at add-time), fall back to product price
                try:
                    unit_price_val = float(it.unit_price) if it.unit_price is not None else float(it.product.price or 0.0)
                except Exception:
                    unit_price_val = float(it.product.price or 0.0)

                items.append({
                    'id': it.id,
                    'product_id': it.product.id,
                    'name': it.product.name,
                    'price': unit_price_val,
                    'price_cop': int(round(unit_price_val)) if unit_price_val is not None else 0,
                    'unit_price': unit_price_val,
                    'unit_price_cop': int(round(unit_price_val)) if unit_price_val is not None else 0,
                    'total_price': float(it.total_price) if it.total_price is not None else unit_price_val * it.quantity,
                    'total_price_cop': int(round(float(it.total_price) if it.total_price is not None else unit_price_val * it.quantity)),
                    'quantity': it.quantity
                })

            return jsonify({'cart_id': cart.id, 'items': items, 'success': True})
        else:
            guest = session.get('guest_cart', [])
            items = []
            # guest entries: {id, product_id, quantity}
            for it in guest:
                prod = Product.query.get(it.get('product_id'))
                if not prod:
                    continue
                items.append({
                    'id': it.get('id'),
                    'product_id': prod.id,
                    'name': prod.name,
                    'price': float(prod.price),
                    'price_cop': int(round(prod.price)) if prod.price is not None else 0,
                    'quantity': it.get('quantity', 1)
                })
            return jsonify({'cart_id': None, 'items': items, 'success': True})
    except Exception as e:
        print(f"Error en client_get_cart: {e}")
        return jsonify({'error': str(e), 'success': False}), 500


@client_bp.route('/client/cart/add', methods=['POST'])
def client_cart_add():
    """Añadir producto al carrito (JSON body: product_id, quantity)
    Supports authenticated DB-backed carts and anonymous session-backed guest carts.
    """
    try:
        data = request.get_json() or {}
        product_id = int(data.get('product_id'))
        qty = int(data.get('quantity', 1))

        product = Product.query.get(product_id)
        if not product or not product.active:
            return jsonify({'error': 'Producto no encontrado', 'success': False}), 404
        # Verificar stock disponible
        if product.stock_quantity < qty:
            return jsonify({'error': 'Stock insuficiente', 'success': False}), 400

        if current_user.is_authenticated:
            cart = Cart.query.filter_by(user_id=current_user.id).first()
            if not cart:
                cart = Cart(user_id=current_user.id)
                db.session.add(cart)
                db.session.commit()

            # Reservar stock: decrementar stock_quantity en producto
            item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
            if item:
                # verificar que haya stock para la cantidad adicional
                if product.stock_quantity < qty:
                    return jsonify({'error': 'Stock insuficiente para la cantidad adicional', 'success': False}), 400
                item.quantity = item.quantity + qty
                # keep line total in sync
                try:
                    unit = float(item.unit_price) if item.unit_price is not None else float(product.price or 0.0)
                except Exception:
                    unit = float(product.price or 0.0)
                item.total_price = unit * item.quantity
            else:
                # Save unit_price at time of adding to cart to avoid later price drift and satisfy NOT NULL constraint
                unit_price_val = float(product.price) if product.price is not None else 0.0
                item = CartItem(cart_id=cart.id, product_id=product_id, quantity=qty, unit_price=unit_price_val, total_price=unit_price_val * qty)
                db.session.add(item)

            # Aplicar reserva en inventario
            product.stock_quantity = product.stock_quantity - qty
            db.session.commit()
            return jsonify({'success': True})
        else:
            # Guest session cart stored in Flask session
            guest = session.get('guest_cart', [])
            # Generate a simple unique id for the guest item
            next_id = max([i.get('id', 0) for i in guest], default=0) + 1
            # Check if product already in guest cart
            existing = next((i for i in guest if i.get('product_id') == product_id), None)
            if existing:
                existing['quantity'] = existing.get('quantity', 1) + qty
            else:
                guest.append({'id': next_id, 'product_id': product_id, 'quantity': qty})

            # Reserve stock in DB so inventory reflects reservation
            product.stock_quantity = product.stock_quantity - qty
            session['guest_cart'] = guest
            session.modified = True
            db.session.commit()
            return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Error en client_cart_add: {e}")
        return jsonify({'error': str(e), 'success': False}), 500


@client_bp.route('/client/cart/item/<int:item_id>', methods=['DELETE'])
def client_cart_remove(item_id):
    """Eliminar un item del carrito"""
    try:
        # If authenticated, operate on DB-backed cart
        if current_user.is_authenticated:
            item = CartItem.query.get_or_404(item_id)
            # verificar pertenece al usuario
            if item.cart.user_id != current_user.id:
                return jsonify({'error': 'No autorizado', 'success': False}), 403
            # Devolver stock al inventario
            product = item.product
            if product:
                product.stock_quantity = (product.stock_quantity or 0) + item.quantity

            db.session.delete(item)
            db.session.commit()
            return jsonify({'success': True})
        else:
            guest = session.get('guest_cart', [])
            item = next((i for i in guest if i.get('id') == item_id), None)
            if not item:
                return jsonify({'error': 'Item no encontrado en carrito', 'success': False}), 404
            prod = Product.query.get(item.get('product_id'))
            if prod:
                prod.stock_quantity = (prod.stock_quantity or 0) + item.get('quantity', 0)
            # remove
            guest = [i for i in guest if i.get('id') != item_id]
            session['guest_cart'] = guest
            session.modified = True
            db.session.commit()
            return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Error en client_cart_remove: {e}")
        return jsonify({'error': str(e), 'success': False}), 500


@client_bp.route('/client/cart/item/<int:item_id>', methods=['PUT'])
def client_cart_update(item_id):
    """Actualizar cantidad de un item del carrito (JSON body: quantity)
    Supports both DB-backed and session-backed guest carts.
    """
    try:
        data = request.get_json() or {}
        qty = int(data.get('quantity', 0))

        if current_user.is_authenticated:
            item = CartItem.query.get_or_404(item_id)
            if item.cart.user_id != current_user.id:
                return jsonify({'error': 'No autorizado', 'success': False}), 403

            product = item.product
            if qty <= 0:
                # Devolver stock
                if product:
                    product.stock_quantity = (product.stock_quantity or 0) + item.quantity
                db.session.delete(item)
            else:
                # calcular delta (positivo = pedir más; negativo = devolver)
                delta = qty - item.quantity
                if delta > 0:
                    # comprobar stock disponible
                    if not product or product.stock_quantity < delta:
                        return jsonify({'error': 'Stock insuficiente para la actualización', 'success': False}), 400
                    product.stock_quantity = product.stock_quantity - delta
                    item.quantity = qty
                else:
                    # devolver stock (-delta)
                    if product:
                        product.stock_quantity = (product.stock_quantity or 0) + (-delta)
                    item.quantity = qty
                # update total price on the line to reflect new quantity
                try:
                    unit = float(item.unit_price) if item.unit_price is not None else float(product.price or 0.0)
                except Exception:
                    unit = float(product.price or 0.0)
                item.total_price = unit * item.quantity
            db.session.commit()
            return jsonify({'success': True})
        else:
            guest = session.get('guest_cart', [])
            item = next((i for i in guest if i.get('id') == item_id), None)
            if not item:
                return jsonify({'error': 'Item no encontrado en carrito', 'success': False}), 404

            prod = Product.query.get(item.get('product_id'))
            if qty <= 0:
                # devolver stock
                if prod:
                    prod.stock_quantity = (prod.stock_quantity or 0) + item.get('quantity', 0)
                guest = [i for i in guest if i.get('id') != item_id]
            else:
                delta = qty - item.get('quantity', 0)
                if delta > 0:
                    if not prod or prod.stock_quantity < delta:
                        return jsonify({'error': 'Stock insuficiente para la actualización', 'success': False}), 400
                    prod.stock_quantity = prod.stock_quantity - delta
                    item['quantity'] = qty
                else:
                    if prod:
                        prod.stock_quantity = (prod.stock_quantity or 0) + (-delta)
                    item['quantity'] = qty

            session['guest_cart'] = guest
            session.modified = True
            db.session.commit()
            return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Error en client_cart_update: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/addresses")
@client_access
def client_addresses():
    """Página de gestión de direcciones de envío"""
    return render_template("views/client/client_addresses.html")

@client_bp.route("/client/addresses-data")
@client_access
def client_addresses_data():
    """API endpoint para obtener direcciones del cliente"""
    try:
        addresses = Address.query.filter_by(user_id=current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
        addresses_data = [address.to_dict() for address in addresses]

        return jsonify({
            'addresses': addresses_data,
            'success': True
        })
    except Exception as e:
        print(f"Error en client_addresses_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/address", methods=["POST"])
@client_access
def create_client_address():
    """Crear nueva dirección de envío"""
    try:
        data = request.get_json()
        print(f"DEBUG - Datos recibidos: {data}")
        print(f"DEBUG - Tipo de datos: {type(data)}")

        # Si es la primera dirección o se marca como default, quitar default de otras
        if data.get('is_default', False) or Address.query.filter_by(user_id=current_user.id).count() == 0:
            Address.query.filter_by(user_id=current_user.id).update({'is_default': False})

        address = Address(
            user_id=current_user.id,
            name=data['name'],
            street=data['street'],
            city=data['city'],
            state=data['state'],
            zip_code=data['zip_code'],
            country=data.get('country', 'Colombia'),
            phone=data.get('phone'),
            is_default=data.get('is_default', False)
        )

        db.session.add(address)
        db.session.commit()

        return jsonify({
            'address': address.to_dict(),
            'message': 'Dirección creada exitosamente',
            'success': True
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error en create_client_address: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/address/<int:address_id>", methods=["PUT"])
@client_access
def update_client_address(address_id):
    """Actualizar dirección de envío"""
    try:
        address = Address.query.get_or_404(address_id)

        # Verificar que la dirección pertenece al cliente actual
        if address.user_id != current_user.id:
            return jsonify({'error': 'No tienes permiso para modificar esta dirección', 'success': False}), 403

        data = request.get_json()

        # Si se marca como default, quitar default de otras
        if data.get('is_default', False):
            Address.query.filter_by(user_id=current_user.id).filter(Address.id != address_id).update({'is_default': False})

        # Actualizar campos
        for field in ['name', 'street', 'city', 'state', 'zip_code', 'country', 'phone', 'is_default']:
            if field in data:
                setattr(address, field, data[field])

        address.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'address': address.to_dict(),
            'message': 'Dirección actualizada exitosamente',
            'success': True
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_client_address: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/address/<int:address_id>", methods=["DELETE"])
@client_access
def delete_client_address(address_id):
    """Eliminar dirección de envío"""
    try:
        address = Address.query.get_or_404(address_id)

        # Verificar que la dirección pertenece al cliente actual
        if address.user_id != current_user.id:
            return jsonify({'error': 'No tienes permiso para eliminar esta dirección', 'success': False}), 403

        # No permitir eliminar la dirección por defecto si hay otras direcciones
        if address.is_default and Address.query.filter_by(user_id=current_user.id).count() > 1:
            return jsonify({'error': 'No puedes eliminar tu dirección por defecto. Establece otra como por defecto primero.', 'success': False}), 400

        db.session.delete(address)
        db.session.commit()

        return jsonify({
            'message': 'Dirección eliminada exitosamente',
            'success': True
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error en delete_client_address: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/checkout/create-order", methods=["POST"])
@client_access
def create_order():
    """Crear un pedido desde el carrito"""
    try:
        data = request.get_json() or {}
        
        # Obtener el carrito del usuario
        cart = Cart.query.filter_by(user_id=current_user.id).first()
        if not cart or not cart.items:
            return jsonify({'error': 'El carrito está vacío', 'success': False}), 400
        
        # Calcular totales
        subtotal = sum(float(item.unit_price or item.product.price) * item.quantity for item in cart.items)
        shipping = 15000 if subtotal < 200000 else 0
        tax = int(subtotal * 0.19)  # IVA 19%
        total = subtotal + shipping + tax
        
        # Obtener dirección de envío (usar la dirección por defecto o la primera disponible)
        shipping_address = None
        address = Address.query.filter_by(user_id=current_user.id, is_default=True).first()
        if not address:
            address = Address.query.filter_by(user_id=current_user.id).first()
        
        if address:
            shipping_address = address.get_full_address()
        
        # Generar número de orden único (ORD + timestamp + random)
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        random_suffix = random.randint(1000, 9999)
        order_number = f"ORD{timestamp}{random_suffix}"
        
        # Verificar que el número de orden sea único
        while Order.query.filter_by(order_number=order_number).first():
            random_suffix = random.randint(1000, 9999)
            order_number = f"ORD{timestamp}{random_suffix}"
        
        # Crear la orden
        order = Order(
            user_id=current_user.id,
            order_number=order_number,
            status='pending',
            total_amount=float(total),
            subtotal=float(subtotal),
            shipping_cost=float(shipping),
            tax_amount=float(tax),
            shipping_address=shipping_address,
            payment_method=data.get('payment_method', 'Tarjeta de crédito'),
            notes=data.get('notes', '')
        )
        db.session.add(order)
        db.session.flush()  # Para obtener el ID de la orden
        
        # Crear los items de la orden desde el carrito
        order_items_list = []
        order_items_data = []
        for cart_item in cart.items:
            product = cart_item.product
            if not product:
                continue
            
            unit_price = float(cart_item.unit_price) if cart_item.unit_price is not None else float(product.price)
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                total_price=unit_price * cart_item.quantity
            )
            db.session.add(order_item)
            order_items_list.append(order_item)
            
            # Crear dict del item con el producto ya disponible
            order_items_data.append({
                'id': None,  # Se asignará después del commit
                'order_id': order.id,
                'product_id': product.id,
                'product_name': product.name,
                'product_image': getattr(product, 'image', None),
                'quantity': cart_item.quantity,
                'price': unit_price,
                'unit_price': unit_price,
                'unit_price_cop': int(round(unit_price)),
                'total_price': unit_price * cart_item.quantity,
                'total_price_cop': int(round(unit_price * cart_item.quantity)),
                'created_at': None
            })
        
        # Limpiar el carrito (eliminar todos los items)
        CartItem.query.filter_by(cart_id=cart.id).delete()
        
        # Commit de todos los cambios
        db.session.commit()
        
        # Refrescar la orden y recargar los items desde la base de datos
        db.session.refresh(order)
        # Recargar la orden con sus items
        order = Order.query.options(joinedload(Order.items)).filter_by(id=order.id).first()
        
        # Construir el dict manualmente para evitar problemas con relaciones lazy
        order_dict = {
            'id': order.id,
            'user_id': order.user_id,
            'order_number': order.order_number,
            'status': order.status,
            'status_display': 'Pendiente',
            'total_amount': float(order.total_amount),
            'total_amount_cop': int(round(order.total_amount)),
            'subtotal': subtotal,
            'subtotal_cop': int(round(subtotal)),
            'shipping_cost': shipping,
            'shipping_cost_cop': shipping,
            'tax_amount': tax,
            'tax_amount_cop': tax,
            'shipping_address': shipping_address,
            'payment_method': order.payment_method,
            'notes': order.notes or '',
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'updated_at': order.updated_at.isoformat() if order.updated_at else None,
            'user_name': current_user.name if current_user else None,
            'user_email': current_user.email if current_user else None,
            'items_count': len(order_items_list),
            'items': order_items_data
        }
        
        # Retornar la orden creada
        return jsonify({
            'order': order_dict,
            'order_number': order_number,
            'message': 'Pedido creado exitosamente',
            'success': True
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en create_order: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/profile")
@client_access
def client_profile():
    """Página de perfil para clientes"""
    return render_template("views/client/client_profile.html")

@client_bp.route("/client/profile-data")
@client_access
def client_profile_data():
    """API endpoint para obtener datos del perfil del cliente"""
    try:
        user = User.query.get(current_user.id)

        # Estadísticas adicionales del cliente
        total_orders = Order.query.filter_by(user_id=current_user.id).count()
        completed_orders = Order.query.filter_by(user_id=current_user.id, status='delivered').count()
        total_spent = db.session.query(db.func.sum(Order.total_amount)).filter_by(user_id=current_user.id, status='delivered').scalar() or 0

        profile_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'active': user.active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'stats': {
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'total_spent': float(total_spent),
                'member_since': user.created_at.strftime('%B %Y') if user.created_at else None
            }
        }

        return jsonify({
            'profile': profile_data,
            'success': True
        })
    except Exception as e:
        print(f"Error en client_profile_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/profile/update", methods=["POST"])
@client_access
def update_client_profile():
    """Actualizar información del perfil del cliente"""
    try:
        user = User.query.get(current_user.id)
        data = request.get_json()

        # Actualizar campos permitidos
        if 'name' in data:
            user.name = data['name']
        if 'email' in data and data['email'] != user.email:
            # Verificar que el email no esté en uso
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Este email ya está registrado', 'success': False}), 400
            user.email = data['email']

        db.session.commit()

        return jsonify({
            'message': 'Perfil actualizado exitosamente',
            'profile': {
                'id': user.id,
                'name': user.name,
                'email': user.email
            },
            'success': True
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_client_profile: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@client_bp.route("/client/profile/change-password", methods=["POST"])
@client_access
def change_client_password():
    """Cambiar contraseña del cliente"""
    try:
        user = User.query.get(current_user.id)
        data = request.get_json()

        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return jsonify({'error': 'Todos los campos de contraseña son requeridos', 'success': False}), 400

        if not user.check_password(current_password):
            return jsonify({'error': 'Contraseña actual incorrecta', 'success': False}), 400

        if new_password != confirm_password:
            return jsonify({'error': 'Las contraseñas no coinciden', 'success': False}), 400

        if len(new_password) < 6:
            return jsonify({'error': 'La nueva contraseña debe tener al menos 6 caracteres', 'success': False}), 400

        user.set_password(new_password)
        db.session.commit()

        return jsonify({
            'message': 'Contraseña cambiada exitosamente',
            'success': True
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error en change_client_password: {e}")
        return jsonify({'error': str(e), 'success': False}), 500
# Client Ticket/Support Endpoints
@client_bp.route("/client/my-tickets")
@login_required
def my_tickets():
    try:
        from Config.models.ticket import Ticket
        
        tickets = Ticket.query.filter_by(user_id=current_user.id).order_by(Ticket.created_at.desc()).all()
        tickets_data = [ticket.to_dict() for ticket in tickets]
        
        return jsonify({
            'success': True,
            'tickets': tickets_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@client_bp.route("/client/ticket/create", methods=["POST"])
@login_required
def create_ticket():
    try:
        from Config.models.ticket import Ticket
        
        data = request.get_json()
        subject = data.get('subject')
        message = data.get('message')
        category = data.get('category', 'consulta')
        priority = data.get('priority', 'medium')
        
        if not subject or not message:
            return jsonify({
                'success': False,
                'error': 'Asunto y mensaje son requeridos'
            }), 400
        
        new_ticket = Ticket(
            user_id=current_user.id,
            subject=subject,
            message=message,
            category=category,
            priority=priority,
            status='open'
        )
        
        db.session.add(new_ticket)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ticket creado exitosamente',
            'ticket': new_ticket.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@client_bp.route("/client/ticket/<int:ticket_id>")
@login_required
def get_my_ticket(ticket_id):
    try:
        from Config.models.ticket import Ticket, TicketMessage
        
        ticket = Ticket.query.filter_by(id=ticket_id, user_id=current_user.id).first()
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        # Get messages (exclude internal ones for clients)
        messages = TicketMessage.query.filter_by(
            ticket_id=ticket_id,
            is_internal=False
        ).order_by(TicketMessage.created_at.asc()).all()
        
        messages_data = [msg.to_dict() for msg in messages]
        
        return jsonify({
            'success': True,
            'ticket': ticket.to_dict(),
            'messages': messages_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@client_bp.route("/client/ticket/<int:ticket_id>/message", methods=["POST"])
@login_required
def add_my_ticket_message(ticket_id):
    try:
        from Config.models.ticket import Ticket, TicketMessage
        
        ticket = Ticket.query.filter_by(id=ticket_id, user_id=current_user.id).first()
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        data = request.get_json()
        message_text = data.get('message')
        
        if not message_text:
            return jsonify({
                'success': False,
                'error': 'El mensaje no puede estar vacío'
            }), 400
        
        new_message = TicketMessage(
            ticket_id=ticket_id,
            user_id=current_user.id,
            message=message_text,
            is_internal=False
        )
        
        ticket.updated_at = datetime.utcnow()
        
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Mensaje enviado correctamente',
            'ticket_message': new_message.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@client_bp.route("/client/support")
@client_access
def client_support():
    """Pagina de soporte y tickets para clientes"""
    return render_template("views/client/client_support.html")


@client_bp.route("/client/get-csrf-token")
@client_access
def get_csrf_token():
    """Obtener token CSRF para peticiones AJAX"""
    return jsonify({
        'csrf_token': generate_csrf()
    })


@client_bp.route("/client/tickets-data")
@client_access
def client_tickets_data():
    """API endpoint para obtener todos los tickets del cliente"""
    try:
        from Config.models.ticket import Ticket
        
        tickets = Ticket.query.filter_by(user_id=current_user.id).order_by(Ticket.created_at.desc()).all()
        tickets_data = []
        
        for ticket in tickets:
            ticket_dict = ticket.to_dict()
            # Agregar nombre del asignado si existe
            if ticket.assigned_to:
                assigned_user = User.query.get(ticket.assigned_to)
                if assigned_user:
                    ticket_dict['assigned_to_name'] = assigned_user.name
            tickets_data.append(ticket_dict)
        
        return jsonify({
            'success': True,
            'tickets': tickets_data
        })
    except Exception as e:
        print(f"Error en tickets-data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@client_bp.route("/client/tickets/create", methods=["POST"])
@client_access
def create_client_ticket():
    """Crear nuevo ticket de soporte"""
    try:
        from Config.models.ticket import Ticket, TicketMessage
        
        # Get data from JSON or form
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            
        subject = data.get('subject', '').strip()
        description = data.get('description', '').strip()  # Viene como 'description' del frontend
        category = data.get('category', 'otro')
        priority = data.get('priority', 'media')
        
        print(f"DEBUG: Creating ticket - subject={subject}, category={category}, priority={priority}")
        
        if not subject or not description:
            return jsonify({
                'success': False,
                'error': 'Asunto y descripción son requeridos'
            }), 400
        
        # Mapear estados y prioridades al formato del modelo existente
        status_map = {
            'abierto': 'open',
            'en_proceso': 'in_progress',
            'resuelto': 'resolved',
            'cerrado': 'closed'
        }
        
        priority_map = {
            'baja': 'low',
            'media': 'medium',
            'alta': 'high',
            'urgente': 'urgent'
        }
        
        # Crear el ticket usando el campo 'message' del modelo
        new_ticket = Ticket(
            user_id=current_user.id,
            subject=subject,
            message=description,  # El modelo usa 'message' no 'description'
            category=category,
            priority=priority_map.get(priority, 'medium'),
            status='open'  # El modelo usa 'open' no 'abierto'
        )
        
        db.session.add(new_ticket)
        db.session.flush()  # Get the ticket ID
        
        # Crear el primer mensaje con la descripción
        initial_message = TicketMessage(
            ticket_id=new_ticket.id,
            user_id=current_user.id,
            message=description,
            is_internal=False
        )
        
        db.session.add(initial_message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ticket creado exitosamente',
            'ticket': new_ticket.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creando ticket: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@client_bp.route("/client/tickets/<int:ticket_id>/messages", methods=["GET", "POST"])
@client_access
def client_ticket_messages(ticket_id):
    """Obtener o agregar mensajes a un ticket"""
    try:
        from Config.models.ticket import Ticket, TicketMessage
        
        # Verificar que el ticket pertenece al cliente
        ticket = Ticket.query.filter_by(id=ticket_id, user_id=current_user.id).first()
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        if request.method == 'GET':
            # Obtener mensajes (excluir internos)
            messages = TicketMessage.query.filter_by(
                ticket_id=ticket_id,
                is_internal=False
            ).order_by(TicketMessage.created_at.asc()).all()
            
            messages_data = []
            for msg in messages:
                msg_dict = msg.to_dict()
                # Agregar sender_role basado en el rol del usuario
                if msg.user:
                    msg_dict['sender_role'] = msg.user.role
                    msg_dict['sender_name'] = msg.user.name
                messages_data.append(msg_dict)
            
            return jsonify({
                'success': True,
                'messages': messages_data
            })
        
        elif request.method == 'POST':
            # Agregar nuevo mensaje
            data = request.get_json()
            content = data.get('content', '').strip()
            
            if not content:
                return jsonify({
                    'success': False,
                    'error': 'El mensaje no puede estar vacío'
                }), 400
            
            new_message = TicketMessage(
                ticket_id=ticket_id,
                user_id=current_user.id,
                message=content,  # El modelo usa 'message' no 'content'
                is_internal=False
            )
            
            # Actualizar fecha de modificación del ticket
            ticket.updated_at = datetime.utcnow()
            
            # Si el ticket estaba resuelto, reabrirlo
            if ticket.status in ['resolved', 'closed']:
                ticket.status = 'open'
            
            db.session.add(new_message)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Mensaje enviado correctamente',
                'ticket_message': new_message.to_dict()
            })
            
    except Exception as e:
        db.session.rollback()
        print(f"Error en ticket messages: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@client_bp.route("/client/order/<int:order_id>/tracking")
@client_access
def order_tracking(order_id):
    """Página de rastreo en tiempo real del pedido"""
    import os
    
    # Verificar que el pedido pertenece al cliente
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first()
    
    if not order:
        flash('Pedido no encontrado', 'error')
        return redirect(url_for('client.orders'))
    
    # Obtener API Key de Google Maps
    google_maps_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    
    if not google_maps_api_key:
        flash('El sistema de rastreo no está configurado correctamente', 'error')
        return redirect(url_for('client.order_detail', order_id=order_id))
    
    return render_template(
        'views/client/client_order_tracking.html',
        order=order,
        google_maps_api_key=google_maps_api_key
    )
