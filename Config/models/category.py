from Config.db import db
from datetime import datetime

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referencing relationship for parent-child categories
    parent = db.relationship('Category', remote_side=[id], backref='subcategories')
    products = db.relationship('Product', back_populates='category', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parent_id': self.parent_id,
            'parent_name': self.parent.name if self.parent else None,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'subcategories_count': len(self.subcategories) if self.subcategories else 0,
            'products_count': len(self.products) if self.products else 0
        }

    def get_full_path(self):
        """Get the full category path (e.g., 'Electronics > Smartphones > iPhone')"""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name