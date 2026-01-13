# Multi-stage build для Nuxt 4 PWA
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости (включая dev для билда)
RUN npm install --ignore-scripts

# Копируем исходники
COPY . .

# Билдим приложение
RUN npm run build

# Production образ
FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm install --omit=dev --ignore-scripts

# Копируем собранное приложение из builder
COPY --from=builder /app/.output ./.output

# Создаем пользователя без прав root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose порт (YC передаст PORT через env)
EXPOSE 3000

# Запускаем приложение
# YC передает переменную PORT, поэтому используем её
CMD ["sh", "-c", "PORT=${PORT:-3000} node .output/server/index.mjs"]
