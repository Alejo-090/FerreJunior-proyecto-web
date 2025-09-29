from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from Config.db import db

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(100))

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    @staticmethod
    def get_by_email(email):
        return User.query.filter_by(email=email).first()