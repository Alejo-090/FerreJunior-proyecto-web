# check_db.py
import sqlite3
from pprint import pprint

def check_database():
    # Ruta a la base de datos
    db_path = r"Config/ferrejunior.db"
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Obtener la lista de tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("\n=== TABLAS EN LA BASE DE DATOS ===")
        for table in tables:
            table_name = table[0]
            print(f"\nTabla: {table_name}")
            print("-" * 50)
            
            # Obtener la estructura de la tabla
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            print("Columnas:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            
            # Mostrar algunos registros de ejemplo
            try:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
                rows = cursor.fetchall()
                
                if rows:
                    print("\nPrimeros registros:")
                    for row in rows:
                        print(f"  {row}")
                else:
                    print("\nLa tabla está vacía.")
                    
            except sqlite3.Error as e:
                print(f"  No se pudieron leer los datos: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")

if __name__ == "__main__":
    print("=== INSPECCIONANDO BASE DE DATOS EXISTENTE ===")
    check_database()
    print("\n=== FIN DE LA INSPECCIÓN ===")