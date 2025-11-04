from Config.db import db
from datetime import datetime

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    order = db.relationship('Order', backref=db.backref('items', lazy=True))
    product = db.relationship('Product', backref=db.backref('order_items', lazy=True))

    def __repr__(self):
        return f'<OrderItem {self.product.name if self.product else "Unknown"} x{self.quantity}>'

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Producto no encontrado',
            'product_image': getattr(self.product, 'image', None) if self.product else None,
            'quantity': self.quantity,
            'price': self.unit_price,  # Changed from unit_price to price for frontend compatibility
            'unit_price': self.unit_price,
            'unit_price_cop': int(round(self.unit_price)) if self.unit_price is not None else 0,
            'total_price': self.total_price,
            'total_price_cop': int(round(self.total_price)) if self.total_price is not None else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }