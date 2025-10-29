from Config.db import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'in_progress', 'completed', 'cancelled'
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_tasks')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_tasks')

    def __repr__(self):
        return f'<Task {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'assigned_to_name': self.assignee.name if self.assignee else None,
            'created_by': self.created_by,
            'created_by_name': self.creator.name if self.creator else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_overdue(self):
        """Verificar si la tarea está vencida"""
        if self.due_date and self.status != 'completed':
            return self.due_date < datetime.utcnow()
        return False

    def get_priority_color(self):
        """Obtener color CSS según prioridad"""
        colors = {
            'low': '#dcfce7',  # green-100
            'medium': '#fef3c7',  # yellow-100
            'high': '#fee2e2'  # red-100
        }
        return colors.get(self.priority, '#f3f4f6')

    def get_status_color(self):
        """Obtener color CSS según estado"""
        colors = {
            'pending': '#fef3c7',  # yellow-100
            'in_progress': '#dbeafe',  # blue-100
            'completed': '#dcfce7',  # green-100
            'cancelled': '#fee2e2'  # red-100
        }
        return colors.get(self.status, '#f3f4f6')