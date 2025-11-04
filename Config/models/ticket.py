from Config.db import db
from datetime import datetime

class Ticket(db.Model):
    __tablename__ = 'tickets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')  # open, in_progress, resolved, closed
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    category = db.Column(db.String(50))  # consulta, soporte_tecnico, reclamo, sugerencia
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='tickets_created')
    assigned_employee = db.relationship('User', foreign_keys=[assigned_to], backref='tickets_assigned')
    messages = db.relationship('TicketMessage', back_populates='ticket', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Ticket {self.id}: {self.subject}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'assigned_to': self.assigned_to,
            'assigned_employee_name': self.assigned_employee.name if self.assigned_employee else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'message_count': len(self.messages) if self.messages else 0
        }


class TicketMessage(db.Model):
    __tablename__ = 'ticket_messages'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False)  # Solo visible para empleados
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    ticket = db.relationship('Ticket', back_populates='messages')
    user = db.relationship('User', backref='ticket_messages')

    def __repr__(self):
        return f'<TicketMessage {self.id} for Ticket {self.ticket_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Usuario',
            'user_role': self.user.role if self.user else 'cliente',
            'message': self.message,
            'is_internal': self.is_internal,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
