#!/bin/bash
set -e  # corta la ejecución si falla algo

APP_DIR="/home/ec2-user/app-backend"

echo ">>> 🚀 Deploy iniciado..."

# 1. Entrar a la carpeta del repo
cd "$APP_DIR"

# 2. Actualizar desde GitHub
echo ">>> 📥 Actualizando código..."
git fetch --all
git reset --hard origin/main   # o la rama que uses

# 3. Instalar dependencias con pnpm
echo ">>> 📦 Instalando dependencias..."
pnpm install --frozen-lockfile --prod

# 4. Compilar (TypeScript u otro build)
echo ">>> 🔨 Compilando proyecto..."
pnpm run build

# 5. Reiniciar aplicación
echo ">>> 🔄 Reiniciando servicio..."
pm2 restart app-backend || pm2 start dist/main.js --name app-backend

echo ">>> ✅ Deploy finalizado correctamente!"
