#!/bin/bash

set -e

echo "Запуск dev окружения LINKa..."

if [ ! -f "./certs/localhost.crt" ]; then
    echo "SSL сертификаты не найдены. Генерация..."
    ./scripts/generate-ssl-cert.sh
fi

if command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_CMD="docker compose"
else
    echo "Docker Compose не установлен"
    exit 1
fi

echo "Остановка старых контейнеров..."
$DOCKER_CMD -f docker-compose.dev.yml down 2>/dev/null || true

echo "Запуск контейнеров..."
$DOCKER_CMD -f docker-compose.dev.yml up --build

echo ""
echo "Dev сервер запущен на https://localhost:3000"
echo "Для доверия SSL сертификату:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./certs/localhost.crt"

