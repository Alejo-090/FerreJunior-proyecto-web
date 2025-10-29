from flask import request, redirect, render_template, url_for, flash, session
from flask_wtf.csrf import generate_csrf
from flask_login import login_user, logout_user, current_user
from . import auth_bp
from Config.models.user import User

@auth_bp.route("/login", methods=['GET', 'POST'])
def login():
    print("Login function called - using FerreJunior template")  # Debug print
    if current_user.is_authenticated:
        return redirect(url_for('main.main'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False

        # Validaciones básicas
        if not email or not password:
            flash('Por favor complete todos los campos.', 'danger')
            return render_template("views/auth/login.html")

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
                    return redirect(url_for('admin.admin_dashboard'))
                elif user.is_employee():
                    return redirect(url_for('employee.employee_dashboard'))
                else:
                    return redirect(url_for('client.client_dashboard'))
            else:
                flash('Correo electrónico o contraseña incorrectos.', 'danger')
        except Exception as e:
            flash('Error interno del servidor. Intente más tarde.', 'danger')
            print(f"Error en login: {e}")

    # ensure a CSRF token exists in the session (so the form hidden input matches server-side)
    try:
        token = generate_csrf()
        # debug: print session keys and token so you can verify the server set the token
        try:
            print('DEBUG: session keys at login GET ->', list(session.keys()))
            print('DEBUG: generated csrf token ->', token)
        except Exception:
            pass
    except Exception as e:
        # if for any reason token generation fails, continue to render the page
        print('DEBUG: generate_csrf() failed:', e)

    return render_template("views/auth/login.html")

@auth_bp.route('/logout')
def logout():
    logout_user()
    flash('Has cerrado sesión exitosamente.', 'success')
    return redirect(url_for('auth.login'))