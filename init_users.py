from flask import Flask
from Config.db import app, db
from Config.models.user import User

def init_test_users():
    """Inicializa usuarios de prueba en la base de datos"""
    
    with app.app_context():
        # Crear las tablas si no existen
        db.create_all()
        
        # Verificar si ya existen usuarios
        if User.query.count() > 0:
            print("Los usuarios ya existen en la base de datos.")
            return
        
        # Crear usuario administrador
        admin = User()
        admin.name = "Administrador FerreJunior"
        admin.email = "admin@ferrejunior.com"
        admin.set_password("admin123")
        
        # Crear usuario cliente
        client = User()
        client.name = "Cliente Prueba"
        client.email = "cliente@ferrejunior.com" 
        client.set_password("cliente123")
        
        # Agregar a la base de datos
        try:
            db.session.add(admin)
            db.session.add(client)
            db.session.commit()
            print("Usuarios de prueba creados exitosamente:")
            print("- Admin: admin@ferrejunior.com / admin123")
            print("- Cliente: cliente@ferrejunior.com / cliente123")
        except Exception as e:
            print(f"Error al crear usuarios: {e}")
            db.session.rollback()

if __name__ == '__main__':
    init_test_users()