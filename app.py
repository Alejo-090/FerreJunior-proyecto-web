from flask import Flask, request, jsonify, redirect, render_template, url_for, flash
from Config.db import app, db
from flask_login import LoginManager, login_required, logout_user, current_user
# Import all models to ensure proper table creation order
from Config.models import User, Product, Order, Category, Task
from Config.decorators import admin_required, employee_required, client_access
from flask_marshmallow import Marshmallow
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_wtf.csrf import CSRFError

# Importar blueprints
from Config.blueprints.auth import auth_bp
from Config.blueprints.admin import admin_bp
from Config.blueprints.employee import employee_bp
from Config.blueprints.client import client_bp
from Config.blueprints.main import main_bp

# Registrar blueprints
app.register_blueprint(main_bp)  # Main primero para las rutas generales
app.register_blueprint(auth_bp)  # Auth después
app.register_blueprint(admin_bp)
app.register_blueprint(employee_bp)
app.register_blueprint(client_bp)

# Configuración de Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

# CSRF Protection for forms and AJAX
csrf = CSRFProtect()
csrf.init_app(app)

# Return JSON for AJAX requests when CSRF validation fails so client-side JS can handle it
@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    # If the client expects JSON (AJAX/fetch), return a JSON error
    accept = request.headers.get('Accept', '')
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json
    if is_ajax or 'application/json' in accept:
        return jsonify({'success': False, 'error': 'CSRF token missing or inválido.'}), 400
    # Otherwise, fallback to a friendly redirect/flash so users see the login page
    flash('Su sesión expiró o ocurrió un problema de seguridad. Por favor inicie sesión de nuevo.')
    return redirect(url_for('auth.login'))

# Exempt the login view from CSRF verification to avoid blocking the initial login POST when
# custom templates or session/token timing cause validation failures. This is a pragmatic
# short-term fix so users can log in; we still keep CSRF enabled for other routes.
try:
    login_view = app.view_functions.get('auth.login')
    if login_view:
        csrf.exempt(login_view)
        print('DEBUG: Exempted auth.login from CSRF checks')
except Exception as e:
    print('DEBUG: Could not exempt auth.login from CSRF checks:', e)

# make generate_csrf available in templates as csrf_token()
app.jinja_env.globals['csrf_token'] = generate_csrf

# Jinja filter to format numbers as Colombian pesos (no decimals, dot as thousands separator)
def format_cop(value):
    try:
        if value is None:
            return '$0'
        # value may be float or int; round to nearest peso
        v = int(round(float(value)))
        # use Python's thousands separator then replace comma with dot for Colombian style
        s = f"{v:,}".replace(',', '.')
        return f"${s}"
    except Exception:
        return '$0'

app.jinja_env.filters['cop'] = format_cop

# Deshabilitar cache de templates para desarrollo
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Forzar recarga de templates
app.jinja_env.cache = {}

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def init_db():
    """Inicializa la base de datos con usuarios y datos de prueba"""
    with app.app_context():
        # Crear las tablas si no existen
        db.create_all()
        
        # Verificar si ya existen usuarios
        if User.query.count() == 0:
            # Crear usuario administrador
            admin = User()
            admin.name = "Administrador FerreJunior"
            admin.email = "admin@ferrejunior.com"
            admin.role = "admin"
            admin.set_password("admin123")
            
            # Crear usuario empleado
            employee = User()
            employee.name = "Empleado FerreJunior"
            employee.email = "empleado@ferrejunior.com"
            employee.role = "empleado"
            employee.set_password("empleado123")
            
            # Crear usuario cliente
            client = User()
            client.name = "Cliente Prueba"
            client.email = "cliente@ferrejunior.com"
            client.role = "cliente"
            client.set_password("cliente123")
            
            # Agregar a la base de datos
            try:
                db.session.add(admin)
                db.session.add(employee)
                db.session.add(client)
                db.session.commit()
                print("Usuarios de prueba creados:")
                print("- Admin: admin@ferrejunior.com / admin123")
                print("- Empleado: empleado@ferrejunior.com / empleado123")
                print("- Cliente: cliente@ferrejunior.com / cliente123")
            except Exception as e:
                print(f"Error al crear usuarios: {e}")
                db.session.rollback()

        # Verificar si ya existen productos (siempre crear datos de prueba)
        if Product.query.count() == 0:
            # Crear categorías primero
            categories = [
                Category(name="Herramientas Manuales", description="Herramientas que no requieren energía eléctrica"),
                Category(name="Herramientas Eléctricas", description="Herramientas que funcionan con energía eléctrica"),
                Category(name="Medición", description="Herramientas de medición y nivelación"),
                Category(name="Seguridad", description="Equipos de protección personal"),
                Category(name="Pinturas", description="Pinturas, barnices y accesorios"),
                Category(name="Electricidad", description="Materiales y herramientas eléctricas"),
                Category(name="Plomería", description="Herramientas y materiales para plomería"),
                Category(name="Jardinería", description="Herramientas para jardín y exteriores")
            ]

            try:
                for category in categories:
                    db.session.add(category)
                db.session.commit()
                print("Categorías de prueba creadas")
            except Exception as e:
                print(f"Error al crear categorías: {e}")
                db.session.rollback()
                return

            # Obtener categorías creadas
            cat_manuales = Category.query.filter_by(name="Herramientas Manuales").first()
            cat_electricas = Category.query.filter_by(name="Herramientas Eléctricas").first()
            cat_medicion = Category.query.filter_by(name="Medición").first()
            cat_seguridad = Category.query.filter_by(name="Seguridad").first()

            # Crear productos de prueba
            products = [
                Product(
                    name="Martillo de Carpintero",
                    description="Martillo profesional para carpintería",
                    sku="MAR001",
                    price=25.50,
                    stock_quantity=15,
                    min_stock_level=5,
                    category_id=cat_manuales.id if cat_manuales else None,
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
                    category_id=cat_manuales.id if cat_manuales else None,
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
                    category_id=cat_electricas.id if cat_electricas else None,
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
                    category_id=cat_medicion.id if cat_medicion else None,
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
                    category_id=cat_seguridad.id if cat_seguridad else None,
                    brand="FerreJunior",
                    active=True
                )
            ]

            try:
                for product in products:
                    db.session.add(product)
                db.session.commit()
                print("Productos de prueba creados")
            except Exception as e:
                print(f"Error al crear productos: {e}")
                db.session.rollback()

        # Verificar si ya existen pedidos (siempre crear datos de prueba)
        if Order.query.count() == 0:
            users = User.query.all()
            if len(users) >= 2:
                client_user = User.query.filter_by(role='cliente').first()
                admin_user = User.query.filter_by(role='admin').first()

                if client_user and admin_user:
                    # Crear pedidos de prueba
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

                    try:
                        for order in orders:
                            db.session.add(order)
                        db.session.commit()
                        print("Pedidos de prueba creados")
                    except Exception as e:
                        print(f"Error al crear pedidos: {e}")
                        db.session.rollback()

        # Verificar si ya existen tareas (siempre crear datos de prueba)
        if Task.query.count() == 0:
            users = User.query.all()
            if len(users) >= 2:
                employee_user = User.query.filter_by(role='empleado').first()
                admin_user = User.query.filter_by(role='admin').first()

                if employee_user and admin_user:
                    from datetime import timedelta, datetime

                    # Crear tareas de prueba
                    tasks = [
                        Task(
                            title="Procesar pedido #ORD001",
                            description="Cliente: María González - Pedido urgente de herramientas",
                            priority="high",
                            status="pending",
                            assigned_to=employee_user.id,
                            created_by=admin_user.id,
                            due_date=datetime.utcnow() + timedelta(hours=2)
                        ),
                        Task(
                            title="Actualizar inventario de herramientas",
                            description="Revisar stock disponible y actualizar cantidades",
                            priority="medium",
                            status="in_progress",
                            assigned_to=employee_user.id,
                            created_by=admin_user.id,
                            due_date=datetime.utcnow() + timedelta(days=1)
                        ),
                        Task(
                            title="Responder consulta técnica sobre taladros",
                            description="Cliente pregunta sobre modelos disponibles y precios",
                            priority="low",
                            status="pending",
                            assigned_to=employee_user.id,
                            created_by=admin_user.id,
                            due_date=datetime.utcnow() + timedelta(days=2)
                        ),
                        Task(
                            title="Preparar pedido #ORD002 para envío",
                            description="Empaquetar productos y coordinar entrega",
                            priority="high",
                            status="pending",
                            assigned_to=employee_user.id,
                            created_by=admin_user.id,
                            due_date=datetime.utcnow() + timedelta(hours=4)
                        ),
                        Task(
                            title="Generar reporte semanal de ventas",
                            description="Compilar estadísticas de ventas de la semana",
                            priority="medium",
                            status="completed",
                            assigned_to=employee_user.id,
                            created_by=admin_user.id,
                            due_date=datetime.utcnow() - timedelta(days=1),
                            completed_at=datetime.utcnow() - timedelta(hours=2)
                        ),
                        Task(
                            title="Organizar taller de herramientas",
                            description="Reorganizar productos en el almacén por categorías",
                            priority="low",
                            status="pending",
                            assigned_to=employee_user.id,
                            created_by=admin_user.id,
                            due_date=datetime.utcnow() + timedelta(days=3)
                        )
                    ]

                    try:
                        for task in tasks:
                            db.session.add(task)
                        db.session.commit()
                        print("Tareas de prueba creadas")
                    except Exception as e:
                        print(f"Error al crear tareas: {e}")
                        db.session.rollback()

if __name__ == "__main__":
    # Inicializar base de datos al arrancar
    init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')