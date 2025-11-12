# migrate_to_mysql.py
import sqlite3
import mysql.connector
from mysql.connector import Error

def get_table_creation_order():
    """Devuelve el orden correcto para crear las tablas basado en sus dependencias"""
    return [
        'categories',    # Sin dependencias
        'users',         # Sin dependencias
        'products',      # Depende de categories
        'addresses',     # Depende de users
        'tickets',       # Depende de users
        'carts',         # Depende de users
        'orders',        # Depende de users y addresses
        'order_items',   # Depende de orders y products
        'cart_items',    # Depende de carts y products
        'ticket_messages',     # Depende de tickets
        'order_status_history',  # Depende de orders
        'delivery_tracking',     # Depende de orders
        'order_notifications',   # Depende de orders
        'tasks'          # Sin dependencias
    ]

def migrate_sqlite_to_mysql():
    # Conectar a SQLite
    sqlite_conn = sqlite3.connect('Config/ferrejunior.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Configuración de MySQL
    mysql_config = {
        'host': 'localhost',
        'port': 3388,
        'user': 'root',
        'password': '12345',
        'database': 'mysql',
        'raise_on_warnings': True
    }
    
    try:
        # Conectar a MySQL
        mysql_conn = mysql.connector.connect(**mysql_config)
        mysql_cursor = mysql_conn.cursor()
        
        # Intentar crear la base de datos
        try:
            mysql_cursor.execute("CREATE DATABASE ferrejunior")
            print("Base de datos ferrejunior creada exitosamente")
        except mysql.connector.Error as err:
            if err.errno == 1007:  # Error de base de datos ya existe
                print("La base de datos ferrejunior ya existe, continuando...")
            else:
                raise  # Relanzar el error si es otro tipo de error
        
        # Seleccionar la base de datos
        mysql_cursor.execute("USE ferrejunior")
        
        # Obtener lista de tablas
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        all_tables = [table[0] for table in sqlite_cursor.fetchall() if table[0] != 'sqlite_sequence']
        
        # Obtener el orden de migración
        migration_order = [t for t in get_table_creation_order() if t in all_tables]
        
        # Agregar cualquier tabla que no esté en la lista ordenada
        for table in all_tables:
            if table not in migration_order:
                print(f"  - Advertencia: Tabla {table} no está en el orden de migración, se agregará al final")
                migration_order.append(table)
        
        # Primero deshabilitar las restricciones de clave foránea
        mysql_cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        # Eliminar tablas en orden inverso para evitar problemas de dependencias
        for table in reversed(migration_order):
            try:
                mysql_cursor.execute(f"DROP TABLE IF EXISTS {table}")
            except Error as e:
                print(f"  - No se pudo eliminar la tabla {table}: {e}")
        
        # Crear tablas en el orden correcto
        for table in migration_order:
            print(f"\nMigrando tabla: {table}")
            
            # Obtener estructura de la tabla
            sqlite_cursor.execute(f"PRAGMA table_info({table});")
            columns_info = sqlite_cursor.fetchall()
            
            # Crear tabla en MySQL
            create_table_sql = f"CREATE TABLE IF NOT EXISTS {table} ("
            columns = []
            for col in columns_info:
                col_name = col[1]
                col_type = col[2].upper()
                if 'INT' in col_type:
                    col_type = 'INT'
                elif 'VARCHAR' in col_type:
                    col_type = 'VARCHAR(255)'
                elif 'TEXT' in col_type:
                    col_type = 'TEXT'
                elif 'DATETIME' in col_type:
                    col_type = 'DATETIME'
                elif 'FLOAT' in col_type:
                    col_type = 'FLOAT'
                elif 'BOOLEAN' in col_type:
                    col_type = 'BOOLEAN'
                
                columns.append(f"`{col_name}` {col_type}")
            
            create_table_sql += ", ".join(columns) + ")"
            
            try:
                mysql_cursor.execute(create_table_sql)
                print(f"  - Tabla {table} creada en MySQL")
                
                # Obtener datos de SQLite
                sqlite_cursor.execute(f"SELECT * FROM {table};")
                rows = sqlite_cursor.fetchall()
                
                if not rows:
                    print(f"  - Tabla {table} está vacía, saltando...")
                    continue
                
                # Insertar datos en MySQL
                columns_str = ", ".join([f"`{col[1]}`" for col in columns_info])
                placeholders = ", ".join(['%s'] * len(columns_info))
                insert_query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
                
                mysql_cursor.executemany(insert_query, rows)
                mysql_conn.commit()
                print(f"  - {len(rows)} registros migrados a {table}")
                
            except Error as e:
                print(f"  - Error al migrar {table}: {e}")
                mysql_conn.rollback()
        
        # Volver a habilitar las restricciones de clave foránea
        mysql_cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        print("\nMigración completada con éxito!")
        
    except Error as e:
        print(f"Error de conexión a MySQL: {e}")
    finally:
        if 'mysql_conn' in locals() and mysql_conn.is_connected():
            mysql_cursor.close()
            mysql_conn.close()
        sqlite_cursor.close()
        sqlite_conn.close()

if __name__ == "__main__":
    migrate_sqlite_to_mysql()