#!/bin/bash
# wait-for-deb.sh
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until mysqladmin ping -h "$host" -P "$port" --silent; do
  >&2 echo "MySQL is unavailable - sleeping"
  sleep 2
done

>&2 echo "MySQL is up - executing command"
exec $cmd