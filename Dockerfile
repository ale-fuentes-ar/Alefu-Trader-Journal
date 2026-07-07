# 1. Fase de Construcción (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo las de desarrollo para compilar)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Ejecutar el build (Vite + esbuild)
RUN npm run build

# 2. Fase de Producción
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar SOLO las dependencias de producción (más ligero)
RUN npm install --omit=dev

# Copiar la carpeta compilada (dist) desde la fase anterior
COPY --from=builder /app/dist ./dist

# Establecer la variable de entorno para producción
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
