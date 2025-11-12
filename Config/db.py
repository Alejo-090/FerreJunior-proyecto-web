# Config/db.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os

app = Flask(__name__)

# Configuración de la aplicación
app.config['SECRET_KEY'] = '12345'

# Configuración de MySQL
# En la configuración de SQLAlchemy, agrega:
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?ssl_disabled=True"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurar carpetas estáticas y templates
app.static_folder = 'static'
app.template_folder = 'templates'

# Crear los objetos de bd
db = SQLAlchemy(app)
ma = Marshmallow(app)