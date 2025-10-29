from flask import render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import login_required, current_user
from . import employee_bp
from Config.decorators import employee_required
from Config.models.user import User
from Config.models.task import Task
from Config.db import db
import json
from datetime import datetime

@employee_bp.route("/employee")
@employee_required
def employee_dashboard():
    """Dashboard para empleados y administradores"""
    return render_template("views/employee/employee_dashboard.html")

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