# Imagen base ligera con Node 20
FROM node:20-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache bash libc6-compat

# Instalar pnpm
RUN npm install -g pnpm@8.6.11

# Crear y usar directorio de trabajo
WORKDIR /usr/src/app

# Copiar manifests primero para aprovechar cache en instalación
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias (no copiamos node_modules porque está en .dockerignore)
RUN pnpm install

# Copiar el código fuente
COPY . .

# Generar Prisma client (si usás Prisma)
RUN pnpm exec prisma generate

# Compilar NestJS
RUN pnpm build

# Exponer el puerto
EXPOSE 8000

# Comando de arranque
CMD ["node", "dist/main.js"]
