#!/bin/bash
# Получаем токен через API аутентификацию
source .env 2>/dev/null || true

EMAIL="${PREDICTOR_EMAIL:-ivan@aacidov.ru}"
PASSWORD="${PREDICTOR_PASSWORD:-nhjkkm1998}"

TOKEN=$(curl -s -X POST "https://backend.linka.su/v1/auth" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Error: Failed to get token"
  exit 1
fi

# Тестируем predictor с разными запросами
QUERY="${1:-прив}"
LANG="${2:-ru}"
LIMIT="${3:-5}"

echo "Testing predictor with query: $QUERY, lang: $LANG, limit: $LIMIT"
curl -s -G "https://backend.linka.su/v1/predictor" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "q=$QUERY" \
  --data-urlencode "lang=$LANG" \
  --data-urlencode "limit=$LIMIT" | jq .
