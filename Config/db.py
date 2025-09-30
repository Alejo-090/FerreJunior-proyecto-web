from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os

app = Flask(__name__)

# Configuración de la aplicación
app.config['SECRET_KEY'] = 'tu_clave_secreta_muy_segura_aqui'  # Cambiar por una clave más segura

# Configuración de la base de datos
# Para desarrollo, usaremos SQLite (más fácil de configurar)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "ferrejunior.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Si quieres usar MySQL más tarde, descomenta la siguiente línea y comenta la de SQLite:
# app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/ferrejunior'

# Configurar carpetas estáticas y templates
app.static_folder = 'static'
app.template_folder = 'templates'

# Crear los objetos de bd
db = SQLAlchemy(app)
ma = Marshmallow(app)