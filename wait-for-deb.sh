#!/bin/bash
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

echo "Intentando conectar a MySQL en $host:$port..."
until mysqladmin ping -h "$host" -P "$port" -u root -p12345 --silent; do
  >&2 echo "MySQL no está disponible - esperando..."
  sleep 1
done

>&2 echo "¡MySQL está listo! Ejecutando: $cmd"
exec $cmd