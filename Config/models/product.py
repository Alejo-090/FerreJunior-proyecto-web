from Config.db import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    min_stock_level = db.Column(db.Integer, default=10)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    brand = db.Column(db.String(50))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with Category
    category = db.relationship('Category', back_populates='products')

    def __repr__(self):
        return f'<Product {self.name}>'

    def is_low_stock(self):
        """Verificar si el producto tiene stock bajo"""
        return self.stock_quantity <= self.min_stock_level

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sku': self.sku,
            'price': self.price,
            # Price in integer COP (pesos) for front-end canonical use
            'price_cop': int(round(self.price)) if self.price is not None else 0,
            'stock_quantity': self.stock_quantity,
            'min_stock_level': self.min_stock_level,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'brand': self.brand,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Optional fields useful for frontend views. Use getattr to avoid breaking if not present in DB schema.
            'image': getattr(self, 'image', None),
            'features': getattr(self, 'features', []) or [],
            'specifications': getattr(self, 'specifications', {}) or {},
            'rating': float(getattr(self, 'rating', 4.5) or 4.5),
            'reviews': int(getattr(self, 'reviews', 0) or 0),
            'special_price': getattr(self, 'special_price', None)
        }