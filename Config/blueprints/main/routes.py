from flask import redirect, url_for, render_template, request, jsonify
from flask_login import login_required, current_user
from . import main_bp
from Config.models.product import Product

@main_bp.route("/")
def index():
    """Página principal pública de e-commerce"""
    return render_template("views/main/ecommerce_home.html")

@main_bp.route("/public/products")
def public_products():
    """API pública para obtener productos activos"""
    try:
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
        print(f"Error en public_products: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@main_bp.route("/public/product/<int:product_id>")
def public_product_detail(product_id):
    """Página pública de detalle de producto"""
    product = Product.query.get_or_404(product_id)
    
    if not product.active:
        return redirect(url_for('main.index'))
    
    # Productos relacionados por categoría (máx 4)
    related_q = Product.query.filter(
        Product.category_id == product.category_id,
        Product.id != product.id,
        Product.active == True
    ).limit(4).all()
    related_products = [p.to_dict() for p in related_q]
    
    # Construir un dict compatible con la plantilla
    product_data = product.to_dict()
    product_data['in_stock'] = (product.stock_quantity > 0)
    product_data['rating'] = getattr(product, 'rating', 4.5) or 4.5
    product_data['reviews'] = getattr(product, 'reviews', 0) or 0
    product_data['special_price'] = getattr(product, 'special_price', None)
    product_data['features'] = getattr(product, 'features', []) or []
    product_data['specifications'] = getattr(product, 'specifications', {}) or {}
    product_data['image'] = getattr(product, 'image', None)
    
    return render_template("views/client/product_detail.html", product=product_data, related_products=related_products, is_public=True)

@main_bp.route("/main")
@login_required
def main():
    """Dashboard principal - redirige según el rol"""
    if current_user.is_admin():
        return redirect(url_for('admin.admin_dashboard'))
    elif current_user.is_employee():
        return redirect(url_for('employee.employee_dashboard'))
    else:
        return redirect(url_for('client.client_dashboard'))

@main_bp.route("/profile")
@login_required
def profile():
    """Página de perfil del usuario - redirige según el rol"""
    if current_user.is_admin():
        return redirect(url_for('admin.admin_profile'))
    elif current_user.is_employee():
        return redirect(url_for('employee.employee_profile'))
    else:
        return redirect(url_for('client.client_profile'))

@main_bp.route("/tablas")
def tablas():
    empleados = [
        {"name": "Tiger Nixon", "position": "System Architect", "office": "Edinburgh", "age": 61, "start_date": "2011/04/25", "salary": "$320,800"},
        {"name": "Garrett Winters", "position": "Accountant", "office": "Tokyo", "age": 63, "start_date": "2011/07/25", "salary": "$170,750"},
        {"name": "Ashton Cox", "position": "Junior Technical Author", "office": "San Francisco", "age": 66, "start_date": "2009/01/12", "salary": "$86,000"},
        {"name": "Cedric Kelly", "position": "Senior Javascript Developer", "office": "Edinburgh", "age": 22, "start_date": "2012/03/29", "salary": "$433,060"},
        {"name": "Airi Satou", "position": "Accountant", "office": "Tokyo", "age": 33, "start_date": "2008/11/28", "salary": "$162,700"},
        {"name": "Brielle Williamson", "position": "Integration Specialist", "office": "New York", "age": 61, "start_date": "2012/12/02", "salary": "$372,000"},
        {"name": "Herrod Chandler", "position": "Sales Assistant", "office": "San Francisco", "age": 59, "start_date": "2012/08/06", "salary": "$137,500"}
    ]
    return render_template("views/main/tables.html", empleados=empleados)

@main_bp.route("/cargarTabla")
def cargarTabla():
    empleados = [
        {"name": "Tiger Nixon", "position": "System Architect", "office": "Edinburgh", "age": 61, "start_date": "2011/04/25", "salary": "$320,800"},
        {"name": "Garrett Winters", "position": "Accountant", "office": "Tokyo", "age": 63, "start_date": "2011/07/25", "salary": "$170,750"},
        {"name": "Ashton Cox", "position": "Junior Technical Author", "office": "San Francisco", "age": 66, "start_date": "2009/01/12", "salary": "$86,000"},
        {"name": "Cedric Kelly", "position": "Senior Javascript Developer", "office": "Edinburgh", "age": 22, "start_date": "2012/03/29", "salary": "$433,060"},
        {"name": "Airi Satou", "position": "Accountant", "office": "Tokyo", "age": 33, "start_date": "2008/11/28", "salary": "$162,700"},
        {"name": "Brielle Williamson", "position": "Integration Specialist", "office": "New York", "age": 61, "start_date": "2012/12/02", "salary": "$372,000"},
        {"name": "Herrod Chandler", "position": "Sales Assistant", "office": "San Francisco", "age": 59, "start_date": "2012/08/06", "salary": "$137,500"}
    ]
    return empleados