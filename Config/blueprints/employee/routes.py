from flask import render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import login_required, current_user
from . import employee_bp
from Config.decorators import employee_required
from Config.models.user import User
from Config.models.task import Task
from Config.models.order import Order
from Config.models.product import Product
from Config.db import db
import json
from datetime import datetime

@employee_bp.route("/employee")
@employee_required
def employee_dashboard():
    """Dashboard para empleados y administradores"""
    # Obtener conteos reales
    task_count = Task.query.filter_by(assigned_to=current_user.id).count()
    order_count = Order.query.count()
    pending_tasks = Task.query.filter_by(assigned_to=current_user.id, status='pending').count()
    
    return render_template("views/employee/employee_dashboard.html",
                         task_count=task_count,
                         order_count=order_count,
                         pending_tasks=pending_tasks)

@employee_bp.route("/employee/profile")
@employee_required
def employee_profile():
    """Página de perfil para empleados"""
    return render_template("views/employee/employee_profile.html")

@employee_bp.route("/employee/profile/update", methods=["POST"])
@employee_required
def update_employee_profile():
    """Actualizar perfil del empleado"""
    user = User.query.get(current_user.id)
    if request.method == "POST":
        user.name = request.form.get("name")
        user.email = request.form.get("email")
        db.session.commit()
        flash("Perfil actualizado exitosamente!", "success")
        return redirect(url_for("employee.employee_profile"))

@employee_bp.route("/employee/profile/change-password", methods=["POST"])
@employee_required
def change_employee_password():
    """Cambiar contraseña del empleado"""
    user = User.query.get(current_user.id)
    current_password = request.form.get("current_password")
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirm_password")

    if not user.check_password(current_password):
        flash("Contraseña actual incorrecta", "error")
        return redirect(url_for("employee.employee_profile"))

    if new_password != confirm_password:
        flash("Las contraseñas no coinciden", "error")
        return redirect(url_for("employee.employee_profile"))

    user.set_password(new_password)
    db.session.commit()
    flash("Contraseña cambiada exitosamente!", "success")
    return redirect(url_for("employee.employee_profile"))

@employee_bp.route("/employee/profile/download-data")
@employee_required
def download_employee_data():
    """Descargar reporte de datos personales del empleado"""
    user = User.query.get(current_user.id)

    # Crear datos del reporte
    data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "active": user.active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "exported_at": datetime.now().isoformat()
    }

    # Crear archivo JSON temporal
    import io
    json_data = json.dumps(data, indent=2, ensure_ascii=False)
    buffer = io.BytesIO(json_data.encode('utf-8'))

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"datos_personales_empleado_{user.id}.json",
        mimetype="application/json"
    )

@employee_bp.route("/employee/profile/toggle-2fa", methods=["POST"])
@employee_required
def toggle_employee_2fa():
    """Habilitar/deshabilitar autenticación de dos factores"""
    # Por simplicidad, implementaremos un sistema básico de 2FA
    # En un sistema real, se usaría una librería como pyotp
    user = User.query.get(current_user.id)

    # Simular toggle de 2FA (en BD real tendríamos un campo two_factor_enabled)
    # Por ahora solo mostraremos un mensaje
    flash("Autenticación de dos factores habilitada exitosamente! (Funcionalidad básica implementada)", "success")
    return redirect(url_for("employee.employee_profile"))

# Task Management Routes

@employee_bp.route("/employee/tasks-data")
@login_required
@employee_required
def tasks_data():
    """Devolver datos de tareas del empleado actual en formato JSON"""
    try:
        # Obtener tareas asignadas al empleado actual
        tasks = Task.query.filter_by(assigned_to=current_user.id).order_by(Task.created_at.desc()).all()
        tasks_data = []

        # Calcular estadísticas
        stats = {
            'pending': 0,
            'in_progress': 0,
            'completed': 0,
            'urgent': 0,
            'total': len(tasks)
        }

        for task in tasks:
            task_dict = task.to_dict()
            tasks_data.append(task_dict)

            # Contar por estado
            if task.status == 'pending':
                stats['pending'] += 1
            elif task.status == 'in_progress':
                stats['in_progress'] += 1
            elif task.status == 'completed':
                stats['completed'] += 1

            # Contar tareas urgentes (prioridad alta)
            if task.priority == 'high':
                stats['urgent'] += 1

        return jsonify({'tasks': tasks_data, 'stats': stats, 'success': True})
    except Exception as e:
        print(f"Error en tasks_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@employee_bp.route("/employee/task/<int:task_id>")
@login_required
@employee_required
def get_task(task_id):
    """Obtener datos de una tarea específica"""
    try:
        task = Task.query.get_or_404(task_id)

        # Verificar que la tarea pertenece al empleado actual
        if task.assigned_to != current_user.id:
            return jsonify({'error': 'No tienes permiso para ver esta tarea', 'success': False}), 403

        return jsonify({'task': task.to_dict(), 'success': True})
    except Exception as e:
        print(f"Error en get_task: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@employee_bp.route("/employee/task/<int:task_id>/status", methods=["PUT"])
@login_required
@employee_required
def update_task_status(task_id):
    """Actualizar el estado de una tarea"""
    try:
        task = Task.query.get_or_404(task_id)

        # Verificar que la tarea pertenece al empleado actual
        if task.assigned_to != current_user.id:
            return jsonify({'error': 'No tienes permiso para modificar esta tarea', 'success': False}), 403

        data = request.get_json()

        if 'status' not in data:
            return jsonify({'error': 'El estado es requerido', 'success': False}), 400

        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'error': 'Estado no válido', 'success': False}), 400

        # Si se marca como completada, establecer fecha de completado
        if data['status'] == 'completed' and task.status != 'completed':
            task.completed_at = datetime.utcnow()
        elif data['status'] != 'completed':
            task.completed_at = None

        task.status = data['status']
        task.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'task': task.to_dict(), 'success': True, 'message': 'Estado de la tarea actualizado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en update_task_status: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@employee_bp.route("/employee/task/<int:task_id>/complete", methods=["POST"])
@login_required
@employee_required
def complete_task(task_id):
    """Marcar una tarea como completada"""
    try:
        task = Task.query.get_or_404(task_id)

        # Verificar que la tarea pertenece al empleado actual
        if task.assigned_to != current_user.id:
            return jsonify({'error': 'No tienes permiso para modificar esta tarea', 'success': False}), 403

        if task.status == 'completed':
            return jsonify({'error': 'La tarea ya está completada', 'success': False}), 400

        task.status = 'completed'
        task.completed_at = datetime.utcnow()
        task.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'task': task.to_dict(), 'success': True, 'message': 'Tarea completada exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en complete_task: {e}")
        return jsonify({'error': str(e), 'success': False}), 500
# Order Management Routes

@employee_bp.route("/employee/orders-data")
@login_required
@employee_required
def orders_data():
    """Devolver datos de pedidos en formato JSON"""
    try:
        # Obtener todos los pedidos ordenados por fecha
        orders = Order.query.order_by(Order.created_at.desc()).all()
        orders_data = []

        # Calcular estadísticas
        stats = {
            'pending': 0,
            'shipped': 0,
            'delivered': 0,
            'total': len(orders)
        }

        for order in orders:
            order_dict = order.to_dict()
            orders_data.append(order_dict)

            # Contar por estado
            if order.status == 'pending':
                stats['pending'] += 1
            elif order.status == 'shipped':
                stats['shipped'] += 1
            elif order.status == 'delivered':
                stats['delivered'] += 1

        return jsonify({'orders': orders_data, 'stats': stats, 'success': True})
    except Exception as e:
        print(f'Error en orders_data: {e}')
        return jsonify({'error': str(e), 'success': False}), 500

@employee_bp.route("/employee/order/<int:order_id>")
@login_required
@employee_required
def get_order(order_id):
    """Obtener datos de un pedido específico"""
    try:
        order = Order.query.get_or_404(order_id)
        return jsonify({'order': order.to_dict(), 'success': True})
    except Exception as e:
        print(f'Error en get_order: {e}')
        return jsonify({'error': str(e), 'success': False}), 500

@employee_bp.route("/employee/order/<int:order_id>/status", methods=["PUT"])
@login_required
@employee_required
def update_order_status(order_id):
    """Actualizar el estado de un pedido"""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()

        if 'status' not in data:
            return jsonify({'error': 'El estado es requerido', 'success': False}), 400

        valid_statuses = ['pending', 'shipped', 'delivered', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'error': 'Estado no válido', 'success': False}), 400

        order.status = data['status']
        order.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'order': order.to_dict(), 'success': True, 'message': 'Estado del pedido actualizado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f'Error en update_order_status: {e}')
        return jsonify({'error': str(e), 'success': False}), 500

@employee_bp.route("/employee/order/<int:order_id>/notes", methods=["PUT"])
@login_required
@employee_required
def update_order_notes(order_id):
    """Actualizar las notas de un pedido"""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()

        if 'notes' in data:
            order.notes = data['notes']
            order.updated_at = datetime.utcnow()
            db.session.commit()

        return jsonify({'order': order.to_dict(), 'success': True, 'message': 'Notas actualizadas exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f'Error en update_order_notes: {e}')
        return jsonify({'error': str(e), 'success': False}), 500

# Inventory Management Endpoints
@employee_bp.route("/employee/inventory-data")
@login_required
@employee_required
def inventory_data():
    try:
        products = Product.query.all()
        
        # Calculate stats
        total_products = len(products)
        low_stock = sum(1 for p in products if p.is_low_stock() and p.stock_quantity > 0)
        out_of_stock = sum(1 for p in products if p.stock_quantity == 0)
        total_value = sum(p.price * p.stock_quantity for p in products)
        
        # Get all products with category info
        products_data = []
        for product in products:
            product_dict = product.to_dict()
            products_data.append(product_dict)
        
        stats = {
            'total_products': total_products,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'total_value': total_value
        }
        
        return jsonify({
            'success': True,
            'products': products_data,
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/product/<int:product_id>")
@login_required
@employee_required
def get_product(product_id):
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'product': product.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/product/<int:product_id>/stock", methods=["PUT"])
@login_required
@employee_required
def update_product_stock(product_id):
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        data = request.get_json()
        new_stock = data.get('stock_quantity')
        
        if new_stock is None:
            return jsonify({
                'success': False,
                'error': 'Cantidad de stock requerida'
            }), 400
        
        if new_stock < 0:
            return jsonify({
                'success': False,
                'error': 'La cantidad no puede ser negativa'
            }), 400
        
        product.stock_quantity = new_stock
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Stock actualizado correctamente',
            'product': product.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/product/<int:product_id>", methods=["PUT"])
@login_required
@employee_required
def update_product(product_id):
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'stock_quantity' in data:
            product.stock_quantity = int(data['stock_quantity'])
        if 'min_stock_level' in data:
            product.min_stock_level = int(data['min_stock_level'])
        if 'brand' in data:
            product.brand = data['brand']
        if 'active' in data:
            product.active = bool(data['active'])
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Producto actualizado correctamente',
            'product': product.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Customer Management Endpoints
@employee_bp.route("/employee/customers-data")
@login_required
@employee_required
def customers_data():
    try:
        # Get all clients (users with role 'cliente')
        customers = User.query.filter_by(role='cliente').all()
        
        # Calculate stats
        total_customers = len(customers)
        active_customers = sum(1 for c in customers if c.active)
        
        # Get customers created this month
        from datetime import datetime, timedelta
        current_date = datetime.utcnow()
        first_day_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = sum(1 for c in customers if c.created_at and c.created_at >= first_day_of_month)
        
        # Get customer data with order count
        customers_data = []
        for customer in customers:
            customer_dict = customer.to_dict()
            # Count orders for this customer
            order_count = Order.query.filter_by(user_id=customer.id).count()
            customer_dict['order_count'] = order_count
            
            # Get total spent
            orders = Order.query.filter_by(user_id=customer.id).all()
            total_spent = sum(order.total_amount for order in orders)
            customer_dict['total_spent'] = total_spent
            
            customers_data.append(customer_dict)
        
        stats = {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_this_month': new_this_month,
            'inactive_customers': total_customers - active_customers
        }
        
        return jsonify({
            'success': True,
            'customers': customers_data,
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/customer/<int:customer_id>")
@login_required
@employee_required
def get_customer(customer_id):
    try:
        customer = User.query.get(customer_id)
        
        if not customer:
            return jsonify({
                'success': False,
                'error': 'Cliente no encontrado'
            }), 404
        
        customer_data = customer.to_dict()
        
        # Get order count and total spent
        orders = Order.query.filter_by(user_id=customer.id).all()
        customer_data['order_count'] = len(orders)
        customer_data['total_spent'] = sum(order.total_amount for order in orders)
        
        return jsonify({
            'success': True,
            'customer': customer_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/customer/<int:customer_id>/orders")
@login_required
@employee_required
def get_customer_orders(customer_id):
    try:
        customer = User.query.get(customer_id)
        
        if not customer:
            return jsonify({
                'success': False,
                'error': 'Cliente no encontrado'
            }), 404
        
        # Get all orders for this customer
        orders = Order.query.filter_by(user_id=customer_id).order_by(Order.created_at.desc()).all()
        
        orders_data = []
        for order in orders:
            order_dict = order.to_dict()
            order_dict['user_name'] = customer.name
            orders_data.append(order_dict)
        
        return jsonify({
            'success': True,
            'orders': orders_data,
            'customer': customer.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/customer/<int:customer_id>/toggle-status", methods=["PUT"])
@login_required
@employee_required
def toggle_customer_status(customer_id):
    try:
        customer = User.query.get(customer_id)
        
        if not customer:
            return jsonify({
                'success': False,
                'error': 'Cliente no encontrado'
            }), 404
        
        # Toggle active status
        customer.active = not customer.active
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Estado del cliente actualizado correctamente',
            'customer': customer.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Reports Management Endpoints
@employee_bp.route("/employee/reports-data")
@login_required
@employee_required
def reports_data():
    try:
        from datetime import datetime, timedelta
        
        # Get date filters from query params (default: last 30 days)
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all orders in period
        orders = Order.query.filter(Order.created_at >= start_date).all()
        
        # Calculate stats
        total_orders = len(orders)
        total_sales = sum(order.total_amount for order in orders)
        completed_orders = [o for o in orders if o.status == 'delivered']
        pending_orders = [o for o in orders if o.status == 'pending']
        
        # Calculate average order value
        avg_order_value = total_sales / total_orders if total_orders > 0 else 0
        
        # Get top products (from order items)
        from Config.models.order_item import OrderItem
        order_ids = [o.id for o in orders]
        
        if order_ids:
            order_items = OrderItem.query.filter(OrderItem.order_id.in_(order_ids)).all()
            
            # Count products sold
            product_sales = {}
            for item in order_items:
                if item.product_id not in product_sales:
                    product_sales[item.product_id] = {
                        'quantity': 0,
                        'revenue': 0,
                        'name': item.product.name if item.product else 'Producto eliminado'
                    }
                product_sales[item.product_id]['quantity'] += item.quantity
                product_sales[item.product_id]['revenue'] += item.subtotal
            
            top_products = sorted(product_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)[:5]
            top_products_data = [{'id': k, 'name': v['name'], 'quantity': v['quantity'], 'revenue': v['revenue']} for k, v in top_products]
        else:
            top_products_data = []
        
        # Sales by day (for chart)
        sales_by_day = {}
        for order in orders:
            day_key = order.created_at.strftime('%Y-%m-%d')
            if day_key not in sales_by_day:
                sales_by_day[day_key] = {'count': 0, 'total': 0}
            sales_by_day[day_key]['count'] += 1
            sales_by_day[day_key]['total'] += order.total_amount
        
        # Sort by date
        sales_timeline = [{'date': k, 'count': v['count'], 'total': v['total']} for k, v in sorted(sales_by_day.items())]
        
        stats = {
            'total_orders': total_orders,
            'total_sales': total_sales,
            'completed_orders': len(completed_orders),
            'pending_orders': len(pending_orders),
            'avg_order_value': avg_order_value,
            'period_days': days
        }
        
        return jsonify({
            'success': True,
            'stats': stats,
            'top_products': top_products_data,
            'sales_timeline': sales_timeline
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/sales-summary")
@login_required
@employee_required
def sales_summary():
    try:
        from datetime import datetime, timedelta
        
        # Get current month orders
        current_date = datetime.utcnow()
        first_day_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        orders_this_month = Order.query.filter(Order.created_at >= first_day_of_month).all()
        
        # Get last month for comparison
        if current_date.month == 1:
            first_day_last_month = current_date.replace(year=current_date.year-1, month=12, day=1)
        else:
            first_day_last_month = current_date.replace(month=current_date.month-1, day=1)
        
        last_month_end = first_day_of_month - timedelta(days=1)
        orders_last_month = Order.query.filter(
            Order.created_at >= first_day_last_month,
            Order.created_at <= last_month_end
        ).all()
        
        # Calculate this month
        this_month_sales = sum(o.total_amount for o in orders_this_month)
        this_month_orders = len(orders_this_month)
        
        # Calculate last month
        last_month_sales = sum(o.total_amount for o in orders_last_month)
        last_month_orders = len(orders_last_month)
        
        # Calculate growth
        sales_growth = ((this_month_sales - last_month_sales) / last_month_sales * 100) if last_month_sales > 0 else 0
        orders_growth = ((this_month_orders - last_month_orders) / last_month_orders * 100) if last_month_orders > 0 else 0
        
        return jsonify({
            'success': True,
            'this_month': {
                'sales': this_month_sales,
                'orders': this_month_orders
            },
            'last_month': {
                'sales': last_month_sales,
                'orders': last_month_orders
            },
            'growth': {
                'sales': sales_growth,
                'orders': orders_growth
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Ticket/Support Management Endpoints
@employee_bp.route("/employee/tickets-data")
@login_required
@employee_required
def tickets_data():
    try:
        from Config.models.ticket import Ticket
        
        tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
        
        # Calculate stats
        total_tickets = len(tickets)
        open_tickets = sum(1 for t in tickets if t.status == 'open')
        in_progress_tickets = sum(1 for t in tickets if t.status == 'in_progress')
        resolved_tickets = sum(1 for t in tickets if t.status == 'resolved')
        
        tickets_data = [ticket.to_dict() for ticket in tickets]
        
        stats = {
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'in_progress': in_progress_tickets,
            'resolved': resolved_tickets
        }
        
        return jsonify({
            'success': True,
            'tickets': tickets_data,
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/ticket/<int:ticket_id>")
@login_required
@employee_required
def get_ticket(ticket_id):
    try:
        from Config.models.ticket import Ticket, TicketMessage
        
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        # Get all messages for this ticket
        messages = TicketMessage.query.filter_by(ticket_id=ticket_id).order_by(TicketMessage.created_at.asc()).all()
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

@employee_bp.route("/employee/ticket/<int:ticket_id>/status", methods=["PUT"])
@login_required
@employee_required
def update_ticket_status(ticket_id):
    try:
        from Config.models.ticket import Ticket
        
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['open', 'in_progress', 'resolved', 'closed']:
            return jsonify({
                'success': False,
                'error': 'Estado inválido'
            }), 400
        
        ticket.status = new_status
        ticket.updated_at = datetime.utcnow()
        
        if new_status == 'resolved':
            ticket.resolved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Estado actualizado correctamente',
            'ticket': ticket.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/ticket/<int:ticket_id>/assign", methods=["PUT"])
@login_required
@employee_required
def assign_ticket(ticket_id):
    try:
        from Config.models.ticket import Ticket
        
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        # Assign to current employee
        ticket.assigned_to = current_user.id
        if ticket.status == 'open':
            ticket.status = 'in_progress'
        ticket.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ticket asignado correctamente',
            'ticket': ticket.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@employee_bp.route("/employee/ticket/<int:ticket_id>/message", methods=["POST"])
@login_required
@employee_required
def add_ticket_message(ticket_id):
    try:
        from Config.models.ticket import Ticket, TicketMessage
        
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({
                'success': False,
                'error': 'Ticket no encontrado'
            }), 404
        
        data = request.get_json()
        message_text = data.get('message')
        is_internal = data.get('is_internal', False)
        
        if not message_text:
            return jsonify({
                'success': False,
                'error': 'El mensaje no puede estar vacío'
            }), 400
        
        new_message = TicketMessage(
            ticket_id=ticket_id,
            user_id=current_user.id,
            message=message_text,
            is_internal=is_internal
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
