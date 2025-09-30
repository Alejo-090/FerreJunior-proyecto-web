import os
import sqlite3
from werkzeug.security import generate_password_hash

def fix_database():
    """Solución definitiva: Recrear la base de datos completamente"""
    
    db_path = os.path.join('Config', 'ferrejunior.db')
    
    print("🔧 Iniciando reparación de la base de datos...")
    
    # Paso 1: Eliminar base de datos problemática
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print("✅ Base de datos anterior eliminada")
        except Exception as e:
            print(f"⚠️ No se pudo eliminar la BD anterior: {e}")
    
    # Paso 2: Crear directorio si no existe
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    print("✅ Directorio de base de datos verificado")
    
    # Paso 3: Crear nueva base de datos con estructura correcta
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Crear tabla user con TODA la estructura necesaria
        cursor.execute("""
            CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'cliente' NOT NULL,
                active BOOLEAN DEFAULT 1 NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Tabla 'user' creada con estructura completa")
        
        # Paso 4: Insertar usuarios de prueba con roles correctos
        test_users = [
            ('Administrador Sistema', 'admin@ferrejunior.com', 'admin123', 'admin'),
            ('Empleado Ventas', 'empleado@ferrejunior.com', 'empleado123', 'empleado'),
            ('Cliente Prueba', 'cliente@ferrejunior.com', 'cliente123', 'cliente')
        ]
        
        for name, email, password, role in test_users:
            hashed_password = generate_password_hash(password)
            cursor.execute("""
                INSERT INTO user (name, email, password, role, active) 
                VALUES (?, ?, ?, ?, 1)
            """, (name, email, hashed_password, role))
            print(f"✅ Usuario {role} creado: {email}")
        
        # Paso 5: Confirmar cambios
        conn.commit()
        
        # Paso 6: Verificar que todo esté correcto
        cursor.execute("SELECT id, name, email, role FROM user")
        users = cursor.fetchall()
        
        print("\n🎉 ¡BASE DE DATOS REPARADA EXITOSAMENTE!")
        print("=" * 50)
        print("📋 Usuarios creados:")
        for user in users:
            print(f"  🔹 ID: {user[0]} | {user[1]} ({user[3]}) | {user[2]}")
        
        print("\n🔑 Credenciales para probar:")
        print("  👑 Admin:    admin@ferrejunior.com    / admin123")
        print("  👔 Empleado: empleado@ferrejunior.com / empleado123")
        print("  👤 Cliente:  cliente@ferrejunior.com  / cliente123")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error al crear la base de datos: {e}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == '__main__':
    success = fix_database()
    if success:
        print("\n🚀 ¡Ya puedes iniciar tu aplicación con 'python app.py'!")
    else:
        print("\n💥 Hubo un problema. Revisa los errores anteriores.")