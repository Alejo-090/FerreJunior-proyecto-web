from flask import redirect, url_for, render_template
from flask_login import login_required, current_user
from . import main_bp

@main_bp.route("/")
def index():
    return redirect(url_for('auth.login'))

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