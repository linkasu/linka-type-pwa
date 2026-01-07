#!/bin/bash

set -e

CERT_DIR="./certs"
DAYS=365

mkdir -p "$CERT_DIR"

if [ -f "$CERT_DIR/localhost.key" ] && [ -f "$CERT_DIR/localhost.crt" ]; then
    echo "SSL сертификаты уже существуют в $CERT_DIR"
    exit 0
fi

echo "Генерация самоподписанного SSL сертификата для localhost..."

openssl req -x509 -nodes -days $DAYS -newkey rsa:2048 \
    -keyout "$CERT_DIR/localhost.key" \
    -out "$CERT_DIR/localhost.crt" \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=LINKa Dev/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 644 "$CERT_DIR/localhost.crt"
chmod 600 "$CERT_DIR/localhost.key"

echo "SSL сертификаты созданы:"
echo "  - $CERT_DIR/localhost.crt"
echo "  - $CERT_DIR/localhost.key"
echo ""
echo "Для доверия сертификату в macOS:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_DIR/localhost.crt"

