from Config.db import db
from datetime import datetime

class Cart(db.Model):
    __tablename__ = 'carts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    user = db.relationship('User', backref=db.backref('cart', uselist=False))
    items = db.relationship('CartItem', cascade='all, delete-orphan', backref='cart')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'items': [item.to_dict() for item in self.items]
        }

class CartItem(db.Model):
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    # Store the unit price at the time the item was added to the cart.
    # The DB currently enforces NOT NULL for this column, so we include it here
    # and ensure code sets it when creating a CartItem.
    unit_price = db.Column(db.Float, nullable=False, default=0.0)
    # Total price for this cart line (unit_price * quantity) stored at time of change
    total_price = db.Column(db.Float, nullable=False, default=0.0)

    # relationships
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'cart_id': self.cart_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price is not None else None,
            'unit_price_cop': int(round(self.unit_price)) if self.unit_price is not None else 0,
            'total_price': float(self.total_price) if self.total_price is not None else None,
            'total_price_cop': int(round(self.total_price)) if self.total_price is not None else 0,
            'product': self.product.to_dict() if self.product else None
        }
