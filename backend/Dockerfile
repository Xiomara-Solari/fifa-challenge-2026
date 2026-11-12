# ==========================================
# Etapa 1: Compilación de NestJS (TS -> JS)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Runtime mínimo de producción
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/main"]
