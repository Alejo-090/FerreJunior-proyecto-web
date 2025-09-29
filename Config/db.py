from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

app = Flask(__name__)

#creamos las credenciales para conectarnos a la bd
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/mysql'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.secret_key = "web"

#creamos los objetos de bd

db = SQLAlchemy(app)
ma = Marshmallow(app)