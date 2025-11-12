# Config/db.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# Configuración de la aplicación
app.config['SECRET_KEY'] = '12345'

# Configuración de MySQL desde variables de entorno
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'mysql://root:12345@localhost:3306/ferrejunior')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurar carpetas estáticas y templates
app.static_folder = 'static'
app.template_folder = 'templates'

# Crear los objetos de bd
db = SQLAlchemy(app)
ma = Marshmallow(app)