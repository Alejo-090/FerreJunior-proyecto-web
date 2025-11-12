# Usar una imagen base ligera de Python 3.11
FROM python:3.11-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libmariadb-dev \
    default-mysql-client \
    mariadb-client\
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de requerimientos e instalar dependencias de Python
COPY wait-for-deb.sh /usr/local/bin/
COPY requirements.txt .
RUN chmod +x /usr/local/bin/wait-for-deb.sh
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos de la app al contenedor
COPY . .

# Exponer el puerto que usará Flask
EXPOSE 5000

# Comando por defecto para iniciar la aplicación
CMD ["/usr/local/bin/wait-for-deb.sh", "db", "3306", "python", "app.py"]
