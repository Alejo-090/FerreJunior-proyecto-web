from flask import Flask, request, jsonify, redirect, render_template, url_for, flash
from Config.db import app, db
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from Config.models.user import User
from Config.decorators import admin_required, employee_required, client_access
from flask_marshmallow import Marshmallow

# Configuración de Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/")
def index():
    return redirect(url_for('login'))

@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        # Validaciones básicas
        if not email or not password:
            flash('Por favor complete todos los campos.', 'danger')
            return render_template("views/login.html")
        
        try:
            user = User.query.filter_by(email=email).first()
            
            if user and user.check_password(password):
                login_user(user, remember=remember)
                flash(f'¡Bienvenido {user.name}!', 'success')
                next_page = request.args.get('next')
                
                # Redireccionar según el rol del usuario
                if next_page:
                    return redirect(next_page)
                elif user.is_admin():
                    return redirect(url_for('admin_dashboard'))
                elif user.is_employee():
                    return redirect(url_for('employee_dashboard'))
                else:
                    return redirect(url_for('client_dashboard'))
            else:
                flash('Correo electrónico o contraseña incorrectos.', 'danger')
        except Exception as e:
            flash('Error interno del servidor. Intente más tarde.', 'danger')
            print(f"Error en login: {e}")
    
    return render_template("views/login.html")

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Has cerrado sesión exitosamente.', 'success')
    return redirect(url_for('login'))

@app.route("/main")
@login_required
def main():
    """Dashboard principal - redirige según el rol"""
    if current_user.is_admin():
        return redirect(url_for('admin_dashboard'))
    elif current_user.is_employee():
        return redirect(url_for('employee_dashboard'))
    else:
        return redirect(url_for('client_dashboard'))

@app.route("/admin")
@admin_required
def admin_dashboard():
    """Dashboard exclusivo para administradores"""
    user_count = User.query.count()
    return render_template("views/admin_dashboard.html", user_count=user_count)

@app.route("/employee")
@employee_required
def employee_dashboard():
    """Dashboard para empleados y administradores"""
    return render_template("views/employee_dashboard.html")

@app.route("/client")
@client_access
def client_dashboard():
    """Dashboard para clientes"""
    return render_template("views/client_dashboard.html")

@app.route("/profile")
@login_required
def profile():
    """Página de perfil del usuario"""
    return render_template("views/profile.html")

@app.route("/catalog")
@client_access
def catalog():
    """Página del catálogo de productos"""
    return render_template("views/catalog.html")

@app.route("/checkout")
@client_access
def checkout():
    """Página de proceso de pago / carrito de compras"""
    # Datos del carrito (en una aplicación real esto vendría de la sesión/base de datos)
    cart_items = [
        {
            "id": 1,
            "name": "Taladro Eléctrico Bosch",
            "model": "Modelo: GSB 13 RE - 650W",
            "price": 89000,
            "quantity": 1,
            "image": "taladro-electrico.jpg"
        },
        {
            "id": 2,
            "name": "Set de Llaves Inglesas",
            "model": "12 piezas - Acero cromado",
            "price": 24000,
            "quantity": 2,
            "image": "set-llaves.jpg"
        },
        {
            "id": 3,
            "name": "Tornillos Galvanizados",
            "model": "Caja x100 unidades - 6mm x 40mm",
            "price": 12000,
            "quantity": 1,
            "image": "tornillos.jpg"
        }
    ]
    
    # Calcular totales
    subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
    shipping = 15000 if subtotal < 200000 else 0
    tax = int(subtotal * 0.19)  # IVA 19%
    total = subtotal + shipping + tax
    
    return render_template("views/checkout.html", 
                         cart_items=cart_items,
                         subtotal=subtotal,
                         shipping=shipping,
                         tax=tax,
                         total=total)

@app.route("/product/<int:product_id>")
@client_access
def product_detail(product_id):
    """Página de detalle de producto"""
    # Datos de productos (en una aplicación real esto vendría de la base de datos)
    products = {
        1: {
            "id": 1,
            "name": "Atornillador 12V",
            "brand": "PowerTech Pro",
            "rating": 4.5,
            "reviews": 127,
            "price": 60000,
            "special_price": "válido hasta fin de mes",
            "in_stock": True,
            "sku": "SKU-1705-14V-01",
            "shipping": "Envío Gratis en pedidos superiores a $80. Entrega en 2-3 días hábiles",
            "image": "atornillador-12v.jpg",
            "description": "El Taladro Percutor 18V PowerTech Pro es la herramienta perfecta para profesionales y entusiastas del bricolaje. Con su potente motor sin escobillas y batería de larga duración, ofrece un rendimiento excepcional en cualquier proyecto:",
            "features": [
                "Motor sin escobillas de alta eficiencia",
                "Batería de ion litio 18V 2.0Ah incluida",
                "13mm mandril metálico de sujeción rápida",
                "LED integrado para mayor visibilidad"
            ],
            "specifications": {
                "Voltaje": "12V",
                "Torque máximo": "25 Nm",
                "Velocidad": "0-350/1,400 RPM",
                "Peso": "1.2 kg",
                "Garantía": "2 años"
            },
            "category": "Herramientas",
            "subcategory": "Taladros Percutores"
        },
        2: {
            "id": 2,
            "name": "Taladro Percutor 18V",
            "brand": "ProDrill",
            "rating": 4.7,
            "reviews": 89,
            "price": 95000,
            "special_price": None,
            "in_stock": True,
            "sku": "SKU-1800-PD-02",
            "shipping": "Envío Gratis en pedidos superiores a $80. Entrega en 2-3 días hábiles",
            "image": "taladro-percutor-18v.jpg",
            "description": "Taladro percutor profesional de 18V con tecnología brushless para mayor durabilidad y eficiencia energética.",
            "features": [
                "Motor brushless de alta potencia",
                "Función percutor para mampostería",
                "Chuck metálico de 13mm",
                "Luz LED integrada"
            ],
            "specifications": {
                "Voltaje": "18V",
                "Torque máximo": "60 Nm",
                "Velocidad": "0-400/1,500 RPM",
                "Peso": "1.8 kg",
                "Garantía": "3 años"
            },
            "category": "Herramientas",
            "subcategory": "Taladros Percutores"
        },
        3: {
            "id": 3,
            "name": "Set de Brocas 20 pzs",
            "brand": "DrillMaster",
            "rating": 4.3,
            "reviews": 156,
            "price": 24999,
            "special_price": None,
            "in_stock": True,
            "sku": "SKU-BROCAS-20",
            "shipping": "Envío Gratis en pedidos superiores a $80. Entrega en 2-3 días hábiles",
            "image": "set-brocas-20pzs.jpg",
            "description": "Set completo de brocas para metal, madera y mampostería. Fabricadas en acero de alta velocidad.",
            "features": [
                "20 brocas de diferentes tamaños",
                "Acero de alta velocidad HSS",
                "Estuche organizador incluido",
                "Marcado de tamaños claro"
            ],
            "specifications": {
                "Material": "Acero HSS",
                "Tamaños": "1-10mm",
                "Cantidad": "20 piezas",
                "Peso": "0.8 kg",
                "Garantía": "1 año"
            },
            "category": "Accesorios",
            "subcategory": "Brocas"
        },
        4: {
            "id": 4,
            "name": "Caja de Herramientas",
            "brand": "ToolBox Pro",
            "rating": 4.6,
            "reviews": 203,
            "price": 35000,
            "special_price": None,
            "in_stock": True,
            "sku": "SKU-CAJA-TOOL",
            "shipping": "Envío Gratis en pedidos superiores a $80. Entrega en 2-3 días hábiles",
            "image": "caja-herramientas.jpg",
            "description": "Caja de herramientas resistente con múltiples compartimentos para organizar todas tus herramientas.",
            "features": [
                "Construcción resistente",
                "Múltiples compartimentos",
                "Cerradura de seguridad",
                "Asa reforzada"
            ],
            "specifications": {
                "Material": "Plástico ABS",
                "Dimensiones": "45x25x20 cm",
                "Peso": "2.1 kg",
                "Color": "Azul/Negro",
                "Garantía": "2 años"
            },
            "category": "Almacenamiento",
            "subcategory": "Cajas"
        },
        5: {
            "id": 5,
            "name": "Gafas de Seguridad",
            "brand": "SafeVision",
            "rating": 4.4,
            "reviews": 78,
            "price": 12500,
            "special_price": None,
            "in_stock": True,
            "sku": "SKU-GAFAS-SEG",
            "shipping": "Envío Gratis en pedidos superiores a $80. Entrega en 2-3 días hábiles",
            "image": "gafas-seguridad.jpg",
            "description": "Gafas de seguridad con protección UV y resistencia al impacto. Ideales para trabajos de construcción.",
            "features": [
                "Lentes anti-impacto",
                "Protección UV 400",
                "Marco ajustable",
                "Cumple normas de seguridad"
            ],
            "specifications": {
                "Material": "Policarbonato",
                "Color": "Transparente",
                "Peso": "0.1 kg",
                "Certificación": "ANSI Z87.1",
                "Garantía": "1 año"
            },
            "category": "Seguridad",
            "subcategory": "Protección Ocular"
        }
    }
    
    # Productos relacionados (simulados)
    related_products = [
        {"id": 2, "name": "Taladro percutor 18V", "price": 90000, "image": "taladro-percutor-18v.jpg"},
        {"id": 3, "name": "Set de Brocas 20 pzs", "price": 24999, "image": "set-brocas-20pzs.jpg"},
        {"id": 4, "name": "Caja de Herramientas", "price": 35000, "image": "caja-herramientas.jpg"},
        {"id": 5, "name": "Gafas de Seguridad", "price": 12500, "image": "gafas-seguridad.jpg"}
    ]
    
    product = products.get(product_id)
    if not product:
        flash('Producto no encontrado.', 'error')
        return redirect(url_for('catalog'))
    
    return render_template("views/product_detail.html", 
                         product=product, 
                         related_products=related_products)


@app.route("/tablas")
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
    return render_template("views/tables.html", empleados=empleados)

@app.route("/cargarTabla")
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

def init_db():
    """Inicializa la base de datos con usuarios de prueba"""
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

if __name__ == "__main__":
    # Inicializar base de datos al arrancar
    init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')