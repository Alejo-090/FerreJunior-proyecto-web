from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from Config.db import db
from datetime import datetime, timedelta
import secrets

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
    
    # Password reset fields
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # OAuth fields
    google_id = db.Column(db.String(100), nullable=True, unique=True)
    facebook_id = db.Column(db.String(100), nullable=True, unique=True)
    oauth_provider = db.Column(db.String(50), nullable=True)  # 'google' or 'facebook'

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
    
    def generate_reset_token(self):
        """Generar token para reset de contraseña"""
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token
    
    def verify_reset_token(self, token):
        """Verificar si el token de reset es válido"""
        if not self.reset_token or not self.reset_token_expires:
            return False
        if datetime.utcnow() > self.reset_token_expires:
            return False
        return self.reset_token == token
    
    def clear_reset_token(self):
        """Limpiar token de reset"""
        self.reset_token = None
        self.reset_token_expires = None
    
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