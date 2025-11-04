from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from Config.db import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(100))
    role = db.Column(db.String(50), default='cliente')  # 'admin', 'empleado', 'cliente'
    phone = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_employee(self):
        return self.role in ['admin', 'empleado']
    
    def is_client(self):
        return self.role == 'cliente'

    @staticmethod
    def get_by_email(email):
        return User.query.filter_by(email=email).first()
    
    def to_dict(self):
        """Convertir usuario a diccionario"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'is_active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }