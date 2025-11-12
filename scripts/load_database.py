import os
import mysql.connector

# Configuración de conexión (ajusta según tu docker-compose.yaml)
DB_HOST = os.environ.get('DB_HOST', 'db')  # 'db' si usas el nombre del servicio en docker-compose
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '12345')
DB_NAME = os.environ.get('DB_NAME', 'ferrejunior')

# Ruta al archivo SQL con la estructura y datos
SQL_FILE = os.environ.get('SQL_FILE', 'scripts/ferrejunior_full_dump.sql')

def load_sql_file(cursor, sql_file):
    with open(sql_file, encoding='utf-8') as f:
        sql = f.read()
        # Divide por ';' para ejecutar cada sentencia
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        for stmt in statements:
            try:
                cursor.execute(stmt)
            except Exception as e:
                print(f"Error ejecutando sentencia: {stmt[:100]}... \n{e}")

def main():
    print("Conectando a la base de datos...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True
    )
    cursor = conn.cursor()
    print(f"Cargando archivo SQL: {SQL_FILE}")
    load_sql_file(cursor, SQL_FILE)
    cursor.close()
    conn.close()
    print("✅ Base de datos cargada correctamente.")

if __name__ == "__main__":
    main()