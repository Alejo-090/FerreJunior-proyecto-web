from app import app, db
from Config.models.user import User
from werkzeug.security import generate_password_hash

def init_db():
    with app.app_context():
        # Crear tablas si no existen
        db.create_all()
        
        # Verificar si ya existen usuarios
        if not User.query.filter_by(email='admin@ferrejunior.com').first():
            # Crear usuario admin
            admin = User(
                email='admin@ferrejunior.com',
                name='Administrador',
                role='admin',
                phone='1234567890'
            )
            admin.password = generate_password_hash('admin123')
            db.session.add(admin)
            
        if not User.query.filter_by(email='empleado@ferrejunior.com').first():
            # Crear usuario empleado
            empleado = User(
                email='empleado@ferrejunior.com',
                name='Empleado',
                role='empleado',
                phone='0987654321'
            )
            empleado.password = generate_password_hash('empleado123')
            db.session.add(empleado)
            
        try:
            db.session.commit()
            print("✅ Usuarios iniciales creados exitosamente")
            print("   - Admin: admin@ferrejunior.com / admin123")
            print("   - Empleado: empleado@ferrejunior.com / empleado123")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al crear usuarios: {str(e)}")

if __name__ == '__main__':
    init_db()