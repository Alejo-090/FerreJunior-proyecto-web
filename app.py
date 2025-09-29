from flask import Flask, request, jsonify, redirect, render_template, url_for, flash
from Config.db import app, db
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from Config.models.user import User
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
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main'))
        else:
            flash('Credenciales inválidas. Por favor intente de nuevo.', 'danger')
    
    return render_template("views/login.html")

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route("/main")
@login_required
def main():
    return render_template("views/dashboard.html")

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

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')