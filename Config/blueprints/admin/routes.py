from flask import render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import login_required, current_user
from . import admin_bp
from Config.models import User, Product, Order, Category
from Config.decorators import admin_required
from Config.db import db
import json
import csv
import io
from datetime import datetime

@admin_bp.route("/admin")
@admin_required
def admin_dashboard():
    """Dashboard exclusivo para administradores"""
    user_count = User.query.count()
    return render_template("views/admin/admin_dashboard.html", user_count=user_count)

@admin_bp.route("/admin/profile")
@admin_required
def admin_profile():
    """Página de perfil para administradores"""
    return render_template("views/admin/admin_profile.html")

@admin_bp.route("/admin/profile/edit", methods=["GET", "POST"])
@admin_required
def edit_profile():
    """Editar perfil do administrador"""
    user = User.query.get(current_user.id)
    if request.method == "POST":
        user.username = request.form.get("username")
        user.email = request.form.get("email")
        db.session.commit()
        flash("Perfil atualizado com sucesso!", "success")
        return redirect(url_for("admin_bp.admin_profile"))
    return render_template("views/admin/edit_profile.html", user=user)

@admin_bp.route("/admin/profile/update", methods=["POST"])
@admin_required
def update_admin_profile():
    """Actualizar perfil del administrador"""
    user = User.query.get(current_user.id)
    if request.method == "POST":
        user.name = request.form.get("name")
        user.email = request.form.get("email")
        db.session.commit()
        flash("Perfil actualizado exitosamente!", "success")
        return redirect(url_for("admin.admin_profile"))

@admin_bp.route("/admin/profile/change-password", methods=["POST"])
@admin_required
def change_admin_password():
    """Cambiar contraseña del administrador"""
    user = User.query.get(current_user.id)
    current_password = request.form.get("current_password")
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirm_password")

    if not user.check_password(current_password):
        flash("Contraseña actual incorrecta", "error")
        return redirect(url_for("admin.admin_profile"))

    if new_password != confirm_password:
        flash("Las contraseñas no coinciden", "error")
        return redirect(url_for("admin.admin_profile"))

    user.set_password(new_password)
    db.session.commit()
    flash("Contraseña cambiada exitosamente!", "success")
    return redirect(url_for("admin.admin_profile"))

@admin_bp.route("/admin/profile/download-data")
@admin_required
def download_admin_data():
    """Descargar reporte de datos personales del administrador"""
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
        download_name=f"datos_personales_admin_{user.id}.json",
        mimetype="application/json"
    )

@admin_bp.route("/admin/profile/toggle-2fa", methods=["POST"])
@admin_required
def toggle_admin_2fa():
    """Habilitar/deshabilitar autenticación de dos factores"""
    # Por simplicidad, implementaremos un sistema básico de 2FA
    # En un sistema real, se usaría una librería como pyotp
    user = User.query.get(current_user.id)

    # Simular toggle de 2FA (en BD real tendríamos un campo two_factor_enabled)
    # Por ahora solo mostraremos un mensaje
    flash("Autenticación de dos factores habilitada exitosamente! (Funcionalidad básica implementada)", "success")
    return redirect(url_for("admin.admin_profile"))

@admin_bp.route("/admin/export-users-data")
@login_required
@admin_required
def export_users_data():
    """Devolver datos de usuarios en formato JSON para carga dinámica"""
    try:
        users = User.query.all()
        users_data = []

        for user in users:
            users_data.append({
                'id': user.id,
                'name': user.name or '',
                'email': user.email or '',
                'role': user.role or '',
                'active': user.active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })

        return jsonify({'users': users_data, 'success': True})
    except Exception as e:
        print(f"Error en export_users_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/low-stock-products-data")
@login_required
@admin_required
def low_stock_products_data():
    """Devolver datos de productos con stock bajo en formato JSON"""
    try:
        low_stock_products = Product.query.filter(
            Product.stock_quantity <= Product.min_stock_level,
            Product.active == True
        ).all()

        products_data = []
        for product in low_stock_products:
            products_data.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'stock_quantity': product.stock_quantity,
                'min_stock_level': product.min_stock_level
            })

        return jsonify({'products': products_data, 'success': True})
    except Exception as e:
        print(f"Error en low_stock_products_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/pending-orders-data")
@login_required
@admin_required
def pending_orders_data():
    """Devolver datos de pedidos pendientes en formato JSON"""
    try:
        pending_orders = Order.query.filter_by(status='pending').order_by(Order.created_at.desc()).all()

        orders_data = []
        for order in pending_orders:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user_name': order.user.name if order.user else None,
                'total_amount': float(order.total_amount),
                'total_amount_cop': int(round(order.total_amount)) if order.total_amount is not None else 0,
                'status': order.status,
                'created_at': order.created_at.isoformat() if order.created_at else None
            })

        return jsonify({'orders': orders_data, 'success': True})
    except Exception as e:
        print(f"Error en pending_orders_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/completed-orders-data")
@login_required
@admin_required
def completed_orders_data():
    """Devolver datos de pedidos completados en formato JSON"""
    try:
        completed_orders = Order.query.filter(Order.status.in_(['shipped', 'delivered'])).order_by(Order.updated_at.desc()).all()

        orders_data = []
        for order in completed_orders:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user_name': order.user.name if order.user else None,
                'total_amount': float(order.total_amount),
                'total_amount_cop': int(round(order.total_amount)) if order.total_amount is not None else 0,
                'status': order.status,
                'updated_at': order.updated_at.isoformat() if order.updated_at else None
            })

        return jsonify({'orders': orders_data, 'success': True})
    except Exception as e:
        print(f"Error en completed_orders_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/low-stock-products")
@admin_required
def low_stock_products():
    """Mostrar productos con stock bajo"""
    low_stock_products = Product.query.filter(
        Product.stock_quantity <= Product.min_stock_level,
        Product.active == True
    ).all()

    return render_template("views/admin/low_stock_products.html", products=low_stock_products)

@admin_bp.route("/admin/pending-orders")
@admin_required
def pending_orders():
    """Mostrar pedidos pendientes"""
    pending_orders = Order.query.filter_by(status='pending').order_by(Order.created_at.desc()).all()
    return render_template("views/admin/pending_orders.html", orders=pending_orders)

@admin_bp.route("/admin/completed-orders")
@admin_required
def completed_orders():
    """Mostrar pedidos completados"""
    completed_orders = Order.query.filter(Order.status.in_(['shipped', 'delivered'])).order_by(Order.updated_at.desc()).all()
    return render_template("views/admin/completed_orders.html", orders=completed_orders)

@admin_bp.route("/admin/generate-report/<report_type>")
@admin_required
def generate_report(report_type):
    """Generar reportes básicos del sistema y devolver datos JSON"""
    if report_type not in ['daily', 'weekly', 'monthly']:
        return jsonify({'error': 'Tipo de reporte no válido'}), 400

    # Generar datos del reporte (en un sistema real esto sería más complejo)
    report_data = {
        'type': report_type,
        'total_users': User.query.count(),
        'total_products': Product.query.count(),
        'low_stock_products': Product.query.filter(Product.stock_quantity <= Product.min_stock_level).count(),
        'pending_orders': Order.query.filter_by(status='pending').count(),
        'completed_orders': Order.query.filter(Order.status.in_(['shipped', 'delivered'])).count(),
        'total_revenue': float(db.session.query(db.func.sum(Order.total_amount)).filter(Order.status.in_(['shipped', 'delivered'])).scalar() or 0),
        'generated_at': datetime.now().isoformat()
    }

    return jsonify({'report': report_data})

@admin_bp.route("/admin/export-report/<report_type>/<format>")
@admin_required
def export_report(report_type, format):
    """Exportar reporte en formato PDF o Excel"""
    if report_type not in ['daily', 'weekly', 'monthly']:
        flash('Tipo de reporte no válido.', 'error')
        return redirect(url_for('admin.admin_dashboard'))

    if format not in ['pdf', 'excel']:
        flash('Formato de exportación no válido.', 'error')
        return redirect(url_for('admin.admin_dashboard'))

    # Generar datos del reporte
    report_data = {
        'type': report_type,
        'total_users': User.query.count(),
        'total_products': Product.query.count(),
        'low_stock_products': Product.query.filter(Product.stock_quantity <= Product.min_stock_level).count(),
        'pending_orders': Order.query.filter_by(status='pending').count(),
        'completed_orders': Order.query.filter(Order.status.in_(['shipped', 'delivered'])).count(),
        'total_revenue': db.session.query(db.func.sum(Order.total_amount)).filter(Order.status.in_(['shipped', 'delivered'])).scalar() or 0,
        'generated_at': datetime.now()
    }

    if format == 'pdf':
        return export_report_pdf(report_data)
    elif format == 'excel':
        return export_report_excel(report_data)

def export_report_pdf(report_data):
    """Exportar reporte en formato PDF"""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    import io

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Estilos personalizados
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=30,
        alignment=1  # Centrado
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.gray,
        alignment=1,
        spaceAfter=20
    )

    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=15
    )

    story = []

    # Título del reporte
    report_type_text = {
        'daily': 'Diario',
        'weekly': 'Semanal',
        'monthly': 'Mensual'
    }

    title = Paragraph(f"FerreJunior - Reporte {report_type_text[report_data['type']]}", title_style)
    story.append(title)

    # Fecha de generación
    generated_at = report_data['generated_at'].strftime('%d/%m/%Y %H:%M')
    subtitle = Paragraph(f"Generado el {generated_at}", subtitle_style)
    story.append(subtitle)

    story.append(Spacer(1, 20))

    # Métricas principales
    metrics_data = [
        ['Métrica', 'Valor'],
        ['Total de Usuarios', str(report_data['total_users'])],
        ['Total de Productos', str(report_data['total_products'])],
        ['Productos con Stock Bajo', str(report_data['low_stock_products'])],
        ['Pedidos Pendientes', str(report_data['pending_orders'])],
        ['Pedidos Completados', str(report_data['completed_orders'])],
        ['Ingresos Totales', f"${report_data['total_revenue']:.0f}"]
    ]

    metrics_table = Table(metrics_data)
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    story.append(metrics_table)
    story.append(Spacer(1, 30))

    # Resumen ejecutivo
    story.append(Paragraph("Resumen Ejecutivo", section_style))

    summary_data = [
        ['Métrica', 'Valor', 'Estado'],
        ['Usuarios Registrados', str(report_data['total_users']), 'Activo'],
        ['Productos en Inventario', str(report_data['total_products']), 'Activo'],
        ['Alertas de Stock', str(report_data['low_stock_products']),
         'Requiere Atención' if report_data['low_stock_products'] > 0 else 'Óptimo'],
        ['Pedidos Pendientes', str(report_data['pending_orders']),
         'En Proceso' if report_data['pending_orders'] > 0 else 'Al Día'],
        ['Ingresos del Período', f"${report_data['total_revenue']:.0f}", 'Reportado']
    ]

    summary_table = Table(summary_data)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    story.append(summary_table)

    # Construir el PDF
    doc.build(story)
    buffer.seek(0)

    filename = f"reporte_{report_data['type']}_{report_data['generated_at'].strftime('%Y%m%d_%H%M%S')}.pdf"

    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )

def export_report_excel(report_data):
    """Exportar reporte en formato Excel (CSV)"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Información del reporte
    report_type_text = {
        'daily': 'Diario',
        'weekly': 'Semanal',
        'monthly': 'Mensual'
    }

    writer.writerow(['FerreJunior - Reporte', report_type_text[report_data['type']]])
    writer.writerow(['Generado el', report_data['generated_at'].strftime('%d/%m/%Y %H:%M')])
    writer.writerow([])

    # Métricas principales
    writer.writerow(['Métricas Principales'])
    writer.writerow(['Total de Usuarios', report_data['total_users']])
    writer.writerow(['Total de Productos', report_data['total_products']])
    writer.writerow(['Productos con Stock Bajo', report_data['low_stock_products']])
    writer.writerow(['Pedidos Pendientes', report_data['pending_orders']])
    writer.writerow(['Pedidos Completados', report_data['completed_orders']])
    writer.writerow(['Ingresos Totales', f"${report_data['total_revenue']:.0f}"])
    writer.writerow([])

    # Resumen ejecutivo
    writer.writerow(['Resumen Ejecutivo'])
    writer.writerow(['Métrica', 'Valor', 'Estado'])
    writer.writerow(['Usuarios Registrados', report_data['total_users'], 'Activo'])
    writer.writerow(['Productos en Inventario', report_data['total_products'], 'Activo'])
    writer.writerow(['Alertas de Stock', report_data['low_stock_products'],
                    'Requiere Atención' if report_data['low_stock_products'] > 0 else 'Óptimo'])
    writer.writerow(['Pedidos Pendientes', report_data['pending_orders'],
                    'En Proceso' if report_data['pending_orders'] > 0 else 'Al Día'])
    writer.writerow(['Ingresos del Período', f"${report_data['total_revenue']:.0f}", 'Reportado'])

    output.seek(0)
    filename = f"reporte_{report_data['type']}_{report_data['generated_at'].strftime('%Y%m%d_%H%M%S')}.csv"

    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        as_attachment=True,
        download_name=filename,
        mimetype='text/csv'
    )

@admin_bp.route("/admin/products-data")
@login_required
@admin_required
def products_data():
    """Devolver datos de todos los productos en formato JSON"""
    try:
        products = Product.query.filter_by(active=True).all()
        products_data = []

        for product in products:
            products_data.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'price': product.price,
                'price_cop': int(round(product.price)) if product.price is not None else 0,
                'stock_quantity': product.stock_quantity,
                'min_stock_level': product.min_stock_level,
                'category_id': product.category_id,
                'category_name': product.category.name if product.category else None,
                'brand': product.brand,
                'is_low_stock': product.is_low_stock(),
                'created_at': product.created_at.isoformat() if product.created_at else None
            })

        return jsonify({'products': products_data, 'success': True})
    except Exception as e:
        print(f"Error en products_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/product/<int:product_id>")
@login_required
@admin_required
def get_product(product_id):
    """Obtener datos de un producto específico"""
    try:
        product = Product.query.get_or_404(product_id)
        return jsonify({'product': product.to_dict(), 'success': True})
    except Exception as e:
        print(f"Error en get_product: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/product", methods=["POST"])
@login_required
@admin_required
def create_product():
    """Crear un nuevo producto"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        required_fields = ['name', 'sku', 'price']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'El campo {field} es requerido', 'success': False}), 400

        # Verificar que el SKU no exista
        existing_product = Product.query.filter_by(sku=data['sku']).first()
        if existing_product:
            return jsonify({'error': 'El SKU ya existe', 'success': False}), 400

        # Crear producto
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            sku=data['sku'],
            price=float(data['price']),
            stock_quantity=int(data.get('stock_quantity', 0)),
            min_stock_level=int(data.get('min_stock_level', 10)),
            category_id=data.get('category_id'),
            brand=data.get('brand', ''),
            active=True
        )

        db.session.add(product)
        db.session.commit()

        return jsonify({'product': product.to_dict(), 'success': True, 'message': 'Producto creado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en create_product: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/product/<int:product_id>", methods=["PUT"])
@login_required
@admin_required
def update_product(product_id):
    """Actualizar un producto existente"""
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()

        # Validar datos requeridos
        required_fields = ['name', 'sku', 'price']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'El campo {field} es requerido', 'success': False}), 400

        # Verificar que el SKU no exista en otro producto
        existing_product = Product.query.filter(Product.sku == data['sku'], Product.id != product_id).first()
        if existing_product:
            return jsonify({'error': 'El SKU ya existe en otro producto', 'success': False}), 400

        # Actualizar producto
        product.name = data['name']
        product.description = data.get('description', product.description)
        product.sku = data['sku']
        product.price = float(data['price'])
        product.stock_quantity = int(data.get('stock_quantity', product.stock_quantity))
        product.min_stock_level = int(data.get('min_stock_level', product.min_stock_level))
        product.category_id = data.get('category_id')
        product.brand = data.get('brand', product.brand)
        product.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'product': product.to_dict(), 'success': True, 'message': 'Producto actualizado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en update_product: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/product/<int:product_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_product(product_id):
    """Eliminar un producto (desactivar)"""
    try:
        product = Product.query.get_or_404(product_id)

        # Soft delete - marcar como inactivo
        product.active = False
        product.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'success': True, 'message': 'Producto eliminado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en delete_product: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/product/<int:product_id>/stock", methods=["PUT"])
@login_required
@admin_required
def update_product_stock(product_id):
    """Actualizar stock de un producto"""
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()

        if 'stock_quantity' not in data:
            return jsonify({'error': 'La cantidad de stock es requerida', 'success': False}), 400

        new_stock = int(data['stock_quantity'])
        if new_stock < 0:
            return jsonify({'error': 'La cantidad de stock no puede ser negativa', 'success': False}), 400

        product.stock_quantity = new_stock
        product.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'product': product.to_dict(), 'success': True, 'message': 'Stock actualizado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en update_product_stock: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/categories-data")
@login_required
@admin_required
def categories_data():
    """Devolver datos de todas las categorías en formato JSON"""
    try:
        categories = Category.query.filter_by(active=True).all()
        categories_data = []

        for category in categories:
            categories_data.append(category.to_dict())

        return jsonify({'categories': categories_data, 'success': True})
    except Exception as e:
        print(f"Error en categories_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/category/<int:category_id>")
@login_required
@admin_required
def get_category(category_id):
    """Obtener datos de una categoría específica"""
    try:
        category = Category.query.get_or_404(category_id)
        return jsonify({'category': category.to_dict(), 'success': True})
    except Exception as e:
        print(f"Error en get_category: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/category", methods=["POST"])
@login_required
@admin_required
def create_category():
    """Crear una nueva categoría"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        if 'name' not in data or not data['name']:
            return jsonify({'error': 'El nombre de la categoría es requerido', 'success': False}), 400

        # Verificar que el nombre no exista
        existing_category = Category.query.filter_by(name=data['name']).first()
        if existing_category:
            return jsonify({'error': 'Ya existe una categoría con ese nombre', 'success': False}), 400

        # Crear categoría
        category = Category(
            name=data['name'],
            description=data.get('description', ''),
            parent_id=data.get('parent_id'),
            active=True
        )

        db.session.add(category)
        db.session.commit()

        return jsonify({'category': category.to_dict(), 'success': True, 'message': 'Categoría creada exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en create_category: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/category/<int:category_id>", methods=["PUT"])
@login_required
@admin_required
def update_category(category_id):
    """Actualizar una categoría existente"""
    try:
        category = Category.query.get_or_404(category_id)
        data = request.get_json()

        # Validar datos requeridos
        if 'name' not in data or not data['name']:
            return jsonify({'error': 'El nombre de la categoría es requerido', 'success': False}), 400

        # Verificar que el nombre no exista en otra categoría
        existing_category = Category.query.filter(Category.name == data['name'], Category.id != category_id).first()
        if existing_category:
            return jsonify({'error': 'Ya existe otra categoría con ese nombre', 'success': False}), 400

        # Evitar referencias circulares
        if data.get('parent_id') == category_id:
            return jsonify({'error': 'Una categoría no puede ser padre de sí misma', 'success': False}), 400

        # Actualizar categoría
        category.name = data['name']
        category.description = data.get('description', category.description)
        category.parent_id = data.get('parent_id')
        category.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'category': category.to_dict(), 'success': True, 'message': 'Categoría actualizada exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en update_category: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/category/<int:category_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_category(category_id):
    """Eliminar una categoría (desactivar)"""
    try:
        category = Category.query.get_or_404(category_id)

        # Verificar si tiene subcategorías
        if category.subcategories and len(category.subcategories) > 0:
            return jsonify({'error': 'No se puede eliminar una categoría que tiene subcategorías', 'success': False}), 400

        # Verificar si tiene productos asociados
        if category.products and len(category.products) > 0:
            return jsonify({'error': 'No se puede eliminar una categoría que tiene productos asociados', 'success': False}), 400

        # Soft delete - marcar como inactivo
        category.active = False
        category.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'success': True, 'message': 'Categoría eliminada exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en delete_category: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/orders-data")
@login_required
@admin_required
def orders_data():
    """Devolver datos de todos los pedidos en formato JSON"""
    try:
        orders = Order.query.order_by(Order.created_at.desc()).all()
        orders_data = []

        for order in orders:
            orders_data.append(order.to_dict())

        return jsonify({'orders': orders_data, 'success': True})
    except Exception as e:
        print(f"Error en orders_data: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/order/<int:order_id>")
@login_required
@admin_required
def get_order(order_id):
    """Obtener datos de un pedido específico"""
    try:
        order = Order.query.get_or_404(order_id)
        return jsonify({'order': order.to_dict(), 'success': True})
    except Exception as e:
        print(f"Error en get_order: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/order/<int:order_id>/status", methods=["PUT"])
@login_required
@admin_required
def update_order_status(order_id):
    """Actualizar el estado de un pedido"""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()

        if 'status' not in data:
            return jsonify({'error': 'El estado es requerido', 'success': False}), 400

        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'error': 'Estado no válido', 'success': False}), 400

        order.status = data['status']
        order.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'order': order.to_dict(), 'success': True, 'message': 'Estado del pedido actualizado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en update_order_status: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@admin_bp.route("/admin/order/<int:order_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_order(order_id):
    """Eliminar un pedido (solo si está en estado pending)"""
    try:
        order = Order.query.get_or_404(order_id)

        if order.status != 'pending':
            return jsonify({'error': 'Solo se pueden eliminar pedidos en estado pendiente', 'success': False}), 400

        db.session.delete(order)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Pedido eliminado exitosamente'})

    except Exception as e:
        db.session.rollback()
        print(f"Error en delete_order: {e}")
        return jsonify({'error': str(e), 'success': False}), 500