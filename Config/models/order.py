from Config.db import db
from datetime import datetime

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, shipped, delivered, cancelled
    total_amount = db.Column(db.Float, nullable=False)
    shipping_address = db.Column(db.Text)
    payment_method = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('orders', lazy=True))

    def __repr__(self):
        return f'<Order {self.order_number}>'

    def is_pending(self):
        return self.status == 'pending'

    def is_processing(self):
        return self.status == 'processing'

    def is_completed(self):
        return self.status in ['shipped', 'delivered']

    def to_dict(self):
        # Calculate items count
        items_count = len(self.items) if hasattr(self, 'items') else 0
        
        # Include items if they are loaded
        items_data = []
        if hasattr(self, 'items') and self.items:
            items_data = [item.to_dict() for item in self.items]
        
        # Calculate totals
        subtotal = sum(item.total_price for item in self.items) if hasattr(self, 'items') and self.items else 0
        shipping_cost = 15000 if subtotal < 200000 else 0  # Example shipping logic (already integer COP)
        tax_amount = int(subtotal * 0.19)  # 19% IVA (integer)
        # Canonical integer representations in COP (pesos)
        subtotal_cop = int(round(subtotal)) if subtotal is not None else 0
        shipping_cost_cop = int(round(shipping_cost)) if shipping_cost is not None else 0
        tax_amount_cop = int(round(tax_amount)) if tax_amount is not None else 0
        total_amount_cop = int(round(self.total_amount)) if self.total_amount is not None else int(round(subtotal + shipping_cost + tax_amount))
        
        # Status display mapping
        status_display_map = {
            'pending': 'Pendiente',
            'processing': 'En Proceso',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        }
        status_display = status_display_map.get(self.status, self.status.title())
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'order_number': self.order_number,
            'status': self.status,
            'status_display': status_display,
            'total_amount': self.total_amount,
            'total_amount_cop': total_amount_cop,
            'subtotal': subtotal,
            'subtotal_cop': subtotal_cop,
            'shipping_cost': shipping_cost,
            'shipping_cost_cop': shipping_cost_cop,
            'tax_amount': tax_amount,
            'tax_amount_cop': tax_amount_cop,
            'shipping_address': self.shipping_address,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'items_count': items_count,
            'items': items_data
        }