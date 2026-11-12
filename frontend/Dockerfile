# ==========================================
# Etapa 1: Compilación de Angular
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos primero para aprovechar la caché de Docker en npm ci
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente y generar el bundle de producción
COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Servidor estático con Nginx
# ==========================================
FROM nginx:1.27-alpine

# Configuración SPA para soportar rutas directas y recargas (F5)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# @angular/build:application genera el sitio estático dentro de /dist/frontend/browser
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
