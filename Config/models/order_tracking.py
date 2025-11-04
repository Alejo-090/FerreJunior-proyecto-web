from Config.db import db
from datetime import datetime

class OrderStatusHistory(db.Model):
    """Historial de cambios de estado de pedidos con geolocalización"""
    __tablename__ = 'order_status_history'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    # Estados: pending, confirmed, processing, shipped, in_transit, out_for_delivery, delivered, cancelled
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    
    # Geolocalización
    latitude = db.Column(db.Float)  # Latitud actual
    longitude = db.Column(db.Float)  # Longitud actual
    address = db.Column(db.String(300))  # Dirección legible
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    order = db.relationship('Order', backref=db.backref('status_history', lazy='dynamic', order_by='OrderStatusHistory.created_at'))
    user = db.relationship('User', backref='order_changes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'status': self.status,
            'status_label': self.get_status_label(),
            'changed_by': self.user.name if self.user else 'Sistema',
            'notes': self.notes,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def get_status_label(self):
        labels = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmado',
            'processing': 'En Preparación',
            'shipped': 'Enviado',
            'in_transit': 'En Tránsito',
            'out_for_delivery': 'En Reparto',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        }
        return labels.get(self.status, self.status)


class DeliveryTracking(db.Model):
    """Tracking en tiempo real del pedido con Google Maps"""
    __tablename__ = 'delivery_tracking'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, unique=True)
    
    # Ubicación actual del repartidor/pedido
    current_latitude = db.Column(db.Float)
    current_longitude = db.Column(db.Float)
    current_address = db.Column(db.String(300))
    
    # Ubicación de destino (desde address del pedido)
    destination_latitude = db.Column(db.Float)
    destination_longitude = db.Column(db.Float)
    destination_address = db.Column(db.String(300))
    
    # Información de entrega
    driver_name = db.Column(db.String(100))
    driver_phone = db.Column(db.String(20))
    vehicle_info = db.Column(db.String(100))  # Ej: "Moto - ABC123"
    
    # Estimaciones
    estimated_distance_km = db.Column(db.Float)  # Distancia en kilómetros
    estimated_time_minutes = db.Column(db.Integer)  # Tiempo estimado en minutos
    eta = db.Column(db.DateTime)  # Estimated Time of Arrival
    
    # Estado
    is_active = db.Column(db.Boolean, default=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación
    order = db.relationship('Order', backref=db.backref('delivery_tracking', uselist=False))
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'current_location': {
                'latitude': self.current_latitude,
                'longitude': self.current_longitude,
                'address': self.current_address
            },
            'destination': {
                'latitude': self.destination_latitude,
                'longitude': self.destination_longitude,
                'address': self.destination_address
            },
            'driver': {
                'name': self.driver_name,
                'phone': self.driver_phone,
                'vehicle': self.vehicle_info
            },
            'estimates': {
                'distance_km': self.estimated_distance_km,
                'time_minutes': self.estimated_time_minutes,
                'eta': self.eta.isoformat() if self.eta else None
            },
            'is_active': self.is_active,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }


class OrderNotification(db.Model):
    """Notificaciones de pedidos para usuarios"""
    __tablename__ = 'order_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(50))  # status_change, location_update, near_delivery, delivered
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    user = db.relationship('User', backref='order_notifications')
    order = db.relationship('Order', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
