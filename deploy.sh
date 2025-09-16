#!/bin/bash
set -e  # corta la ejecución si falla algo

APP_DIR="/home/ec2-user/app-backend"
DIST_DIR="$APP_DIR/dist/notifications"
SERVICE_KEY="/home/ec2-user/serviceAccountkey.json"

echo ">>> 🚀 Deploy iniciado..."

# 1. Entrar a la carpeta del repo
cd "$APP_DIR"

# 2. Actualizar desde GitHub
echo ">>> 📥 Actualizando código..."
git fetch --all
git reset --hard origin/main   # o la rama que uses

# 3. Instalar dependencias
echo ">>> 📦 Instalando dependencias..."
npm install --production

# 4. Compilar
echo ">>> 🔨 Compilando proyecto..."
npm run build

# 5. Copiar el serviceAccountkey.json al dist
echo ">>> 📂 Copiando credenciales Firebase al dist..."
cp "$SERVICE_KEY" "$DIST_DIR/serviceAccountkey.json"

# 6. Reiniciar aplicación
echo ">>> 🔄 Reiniciando servicio..."
pm2 restart app-backend || pm2 start dist/main.js --name app-backend

echo ">>> ✅ Deploy finalizado correctamente!"
