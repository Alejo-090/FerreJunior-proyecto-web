# Usar una imagen base de Python 3.11
FROM python:3.11-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
    python3-dev \
    default-mysql-client \
    libmariadb-dev-compat \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos de la app al contenedor
COPY . .

# Exponer el puerto que usará Flask
EXPOSE 5000

# Comando por defecto para iniciar la aplicación
CMD ["python", "app.py"]
