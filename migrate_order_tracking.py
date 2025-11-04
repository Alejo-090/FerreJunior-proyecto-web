"""
Migration script for Order Tracking tables
Executes SQL migration to create order tracking tables with geolocation support
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from Config.db import db
from app import app

def run_migration():
    """Execute the SQL migration script"""
    
    print("=" * 60)
    print("ORDEN DE RASTREO - MIGRACIÓN DE BASE DE DATOS")
    print("=" * 60)
    print()
    
    # Read SQL file
    migration_file = project_root / 'migrations' / 'create_order_tracking_tables.sql'
    
    if not migration_file.exists():
        print(f"❌ ERROR: No se encuentra el archivo de migración: {migration_file}")
        return False
    
    print(f"📄 Leyendo archivo de migración: {migration_file.name}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Split into individual statements
    statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
    
    print(f"📝 Encontradas {len(statements)} declaraciones SQL")
    print()
    
    with app.app_context():
        try:
            print("🔌 Conectando a la base de datos...")
            
            # Execute each statement
            for i, statement in enumerate(statements, 1):
                if statement.startswith('--') or not statement:
                    continue
                
                # Get table name from statement
                table_name = "desconocida"
                if 'CREATE TABLE' in statement:
                    try:
                        table_name = statement.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
                    except:
                        pass
                
                print(f"  [{i}/{len(statements)}] Ejecutando: {table_name}...")
                db.session.execute(db.text(statement))
            
            db.session.commit()
            print()
            print("✅ Migración ejecutada exitosamente")
            print()
            
            # Verify tables were created
            print("🔍 Verificando tablas creadas...")
            tables_to_check = [
                'order_status_history',
                'delivery_tracking',
                'order_notifications'
            ]
            
            for table in tables_to_check:
                # SQLite syntax for checking table existence
                result = db.session.execute(db.text(
                    f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'"
                ))
                if result.fetchone():
                    print(f"  ✓ {table}")
                else:
                    print(f"  ✗ {table} - NO ENCONTRADA")
            
            print()
            print("=" * 60)
            print("MIGRACIÓN COMPLETADA")
            print("=" * 60)
            print()
            print("Próximos pasos:")
            print("1. Reiniciar el contenedor de Docker: docker-compose restart app")
            print("2. Verificar la API de Google Maps: python verify_google_maps.py")
            print("3. Proceder a FASE 2: Implementar endpoints del backend")
            print()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print()
            print(f"❌ ERROR durante la migración: {str(e)}")
            print()
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
