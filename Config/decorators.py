from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user

def admin_required(f):
    """Decorador que requiere rol de administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Debes iniciar sesión para acceder a esta página.', 'danger')
            return redirect(url_for('auth.login'))
        if not current_user.is_admin():
            flash('No tienes permisos de administrador para acceder a esta página.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

def employee_required(f):
    """Decorador que requiere rol de empleado o superior (admin/empleado)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Debes iniciar sesión para acceder a esta página.', 'danger')
            return redirect(url_for('auth.login'))
        if not current_user.is_employee():
            flash('No tienes permisos de empleado para acceder a esta página.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

def client_access(f):
    """Decorador para páginas accesibles a cualquier usuario autenticado"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Debes iniciar sesión para acceder a esta página.', 'danger')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function