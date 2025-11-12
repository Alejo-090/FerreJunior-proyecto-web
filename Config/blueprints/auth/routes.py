from flask import request, redirect, render_template, url_for, flash, session
from flask_wtf.csrf import generate_csrf
from flask_login import login_user, logout_user, current_user
from . import auth_bp
from Config.models.user import User
from Config.db import db
from datetime import datetime
import secrets
import requests
import os

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

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Registro de nuevos usuarios"""
    if current_user.is_authenticated:
        return redirect(url_for('main.main'))
    
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        phone = request.form.get('phone', '').strip()
        
        # Validaciones
        if not name or not email or not password:
            flash('Por favor complete todos los campos requeridos.', 'danger')
            return render_template("views/auth/register.html")
        
        if password != confirm_password:
            flash('Las contraseñas no coinciden.', 'danger')
            return render_template("views/auth/register.html")
        
        if len(password) < 6:
            flash('La contraseña debe tener al menos 6 caracteres.', 'danger')
            return render_template("views/auth/register.html")
        
        # Verificar si el email ya existe
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Este correo electrónico ya está registrado.', 'danger')
            return render_template("views/auth/register.html")
        
        try:
            # Crear nuevo usuario
            new_user = User()
            new_user.name = name
            new_user.email = email
            new_user.set_password(password)
            new_user.phone = phone if phone else None
            new_user.role = 'cliente'  # Por defecto todos son clientes
            new_user.active = True
            
            db.session.add(new_user)
            db.session.commit()
            
            flash('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash('Error al crear la cuenta. Intente más tarde.', 'danger')
            print(f"Error en registro: {e}")
    
    return render_template("views/auth/register.html")

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Solicitar recuperación de contraseña"""
    if current_user.is_authenticated:
        return redirect(url_for('main.main'))
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        
        if not email:
            flash('Por favor ingrese su correo electrónico.', 'danger')
            return render_template("views/auth/forgot_password.html")
        
        user = User.query.filter_by(email=email).first()
        
        # Por seguridad, siempre mostrar el mismo mensaje
        if user:
            # Generar token de reset
            token = user.generate_reset_token()
            db.session.commit()
            
            # En producción, aquí enviarías un email con el link
            # Por ahora, mostramos el token en la consola para desarrollo
            reset_url = url_for('auth.reset_password', token=token, _external=True)
            print(f"Reset URL for {email}: {reset_url}")
            
            # En producción, usar Flask-Mail o servicio de email
            # send_reset_email(user.email, reset_url)
        
        flash('Si el correo existe, se ha enviado un enlace para restablecer tu contraseña.', 'info')
        return redirect(url_for('auth.login'))
    
    return render_template("views/auth/forgot_password.html")

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Restablecer contraseña con token"""
    if current_user.is_authenticated:
        return redirect(url_for('main.main'))
    
    # Buscar usuario con el token válido
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or not user.verify_reset_token(token):
        flash('El enlace de recuperación es inválido o ha expirado.', 'danger')
        return redirect(url_for('auth.forgot_password'))
    
    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not password:
            flash('Por favor ingrese una nueva contraseña.', 'danger')
            return render_template("views/auth/reset_password.html", token=token)
        
        if password != confirm_password:
            flash('Las contraseñas no coinciden.', 'danger')
            return render_template("views/auth/reset_password.html", token=token)
        
        if len(password) < 6:
            flash('La contraseña debe tener al menos 6 caracteres.', 'danger')
            return render_template("views/auth/reset_password.html", token=token)
        
        try:
            user.set_password(password)
            user.clear_reset_token()
            db.session.commit()
            
            flash('Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash('Error al restablecer la contraseña. Intente más tarde.', 'danger')
            print(f"Error en reset_password: {e}")
    
    return render_template("views/auth/reset_password.html", token=token)

@auth_bp.route('/login/google')
def login_google():
    """Iniciar sesión con Google OAuth"""
    # Obtener credenciales de Google desde variables de entorno
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    google_redirect_uri = url_for('auth.google_callback', _external=True)
    
    if not google_client_id or not google_client_secret:
        flash('La autenticación con Google no está configurada.', 'warning')
        return redirect(url_for('auth.login'))
    
    # URL de autorización de Google
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={google_client_id}&"
        f"redirect_uri={google_redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline"
    )
    
    return redirect(auth_url)

@auth_bp.route('/login/google/callback')
def google_callback():
    """Callback de Google OAuth"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        flash('Error al autenticar con Google.', 'danger')
        return redirect(url_for('auth.login'))
    
    if not code:
        flash('Código de autorización no recibido.', 'danger')
        return redirect(url_for('auth.login'))
    
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    google_redirect_uri = url_for('auth.google_callback', _external=True)
    
    try:
        # Intercambiar código por token
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'code': code,
            'client_id': google_client_id,
            'client_secret': google_client_secret,
            'redirect_uri': google_redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'access_token' not in token_json:
            flash('Error al obtener token de Google.', 'danger')
            return redirect(url_for('auth.login'))
        
        access_token = token_json['access_token']
        
        # Obtener información del usuario
        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        user_info_response = requests.get(user_info_url, headers={'Authorization': f'Bearer {access_token}'})
        user_info = user_info_response.json()
        
        if 'email' not in user_info:
            flash('No se pudo obtener información del usuario de Google.', 'danger')
            return redirect(url_for('auth.login'))
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        google_id = user_info.get('id')
        
        # Buscar o crear usuario
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User.query.filter_by(email=email).first()
            if user:
                # Usuario existe pero sin Google ID, actualizar
                user.google_id = google_id
                user.oauth_provider = 'google'
            else:
                # Crear nuevo usuario
                user = User()
                user.email = email
                user.name = name
                user.google_id = google_id
                user.oauth_provider = 'google'
                user.role = 'cliente'
                user.active = True
                db.session.add(user)
        
        db.session.commit()
        login_user(user, remember=True)
        flash(f'¡Bienvenido {user.name}!', 'success')
        
        # Redirigir según rol
        if user.is_admin():
            return redirect(url_for('admin.admin_dashboard'))
        elif user.is_employee():
            return redirect(url_for('employee.employee_dashboard'))
        else:
            return redirect(url_for('client.client_dashboard'))
            
    except Exception as e:
        db.session.rollback()
        flash('Error al autenticar con Google.', 'danger')
        print(f"Error en google_callback: {e}")
        return redirect(url_for('auth.login'))

@auth_bp.route('/login/facebook')
def login_facebook():
    """Iniciar sesión con Facebook OAuth"""
    facebook_app_id = os.environ.get('FACEBOOK_APP_ID')
    facebook_redirect_uri = url_for('auth.facebook_callback', _external=True)
    
    if not facebook_app_id:
        flash('La autenticación con Facebook no está configurada.', 'warning')
        return redirect(url_for('auth.login'))
    
    # URL de autorización de Facebook
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={facebook_app_id}&"
        f"redirect_uri={facebook_redirect_uri}&"
        f"scope=email,public_profile&"
        f"response_type=code"
    )
    
    return redirect(auth_url)

@auth_bp.route('/login/facebook/callback')
def facebook_callback():
    """Callback de Facebook OAuth"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        flash('Error al autenticar con Facebook.', 'danger')
        return redirect(url_for('auth.login'))
    
    if not code:
        flash('Código de autorización no recibido.', 'danger')
        return redirect(url_for('auth.login'))
    
    facebook_app_id = os.environ.get('FACEBOOK_APP_ID')
    facebook_app_secret = os.environ.get('FACEBOOK_APP_SECRET')
    facebook_redirect_uri = url_for('auth.facebook_callback', _external=True)
    
    try:
        # Intercambiar código por token
        token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
        token_params = {
            'client_id': facebook_app_id,
            'client_secret': facebook_app_secret,
            'redirect_uri': facebook_redirect_uri,
            'code': code
        }
        
        token_response = requests.get(token_url, params=token_params)
        token_json = token_response.json()
        
        if 'access_token' not in token_json:
            flash('Error al obtener token de Facebook.', 'danger')
            return redirect(url_for('auth.login'))
        
        access_token = token_json['access_token']
        
        # Obtener información del usuario
        user_info_url = 'https://graph.facebook.com/v18.0/me'
        user_info_params = {
            'fields': 'id,name,email',
            'access_token': access_token
        }
        
        user_info_response = requests.get(user_info_url, params=user_info_params)
        user_info = user_info_response.json()
        
        if 'id' not in user_info:
            flash('No se pudo obtener información del usuario de Facebook.', 'danger')
            return redirect(url_for('auth.login'))
        
        facebook_id = user_info.get('id')
        name = user_info.get('name', 'Usuario Facebook')
        email = user_info.get('email')
        
        if not email:
            flash('Facebook no proporcionó un correo electrónico. Por favor regístrate manualmente.', 'warning')
            return redirect(url_for('auth.register'))
        
        # Buscar o crear usuario
        user = User.query.filter_by(facebook_id=facebook_id).first()
        if not user:
            user = User.query.filter_by(email=email).first()
            if user:
                # Usuario existe pero sin Facebook ID, actualizar
                user.facebook_id = facebook_id
                user.oauth_provider = 'facebook'
            else:
                # Crear nuevo usuario
                user = User()
                user.email = email
                user.name = name
                user.facebook_id = facebook_id
                user.oauth_provider = 'facebook'
                user.role = 'cliente'
                user.active = True
                db.session.add(user)
        
        db.session.commit()
        login_user(user, remember=True)
        flash(f'¡Bienvenido {user.name}!', 'success')
        
        # Redirigir según rol
        if user.is_admin():
            return redirect(url_for('admin.admin_dashboard'))
        elif user.is_employee():
            return redirect(url_for('employee.employee_dashboard'))
        else:
            return redirect(url_for('client.client_dashboard'))
            
    except Exception as e:
        db.session.rollback()
        flash('Error al autenticar con Facebook.', 'danger')
        print(f"Error en facebook_callback: {e}")
        return redirect(url_for('auth.login'))