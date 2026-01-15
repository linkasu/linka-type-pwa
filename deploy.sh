#!/bin/bash
set -e

# Yandex Cloud configuration
FOLDER_ID="b1g2rq5eoov899k6tje5"
REGISTRY_ID="crps8rf7rt377mdescnr"
CONTAINER_NAME="linka-type-pwa"
SERVICE_ACCOUNT_ID="aje5mol7phn3quv189jc"
IMAGE_NAME="linka-type-pwa-v2"

# Build timestamp tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="${TIMESTAMP}"

echo "🏗️  Building Docker image for linux/amd64..."
docker build --platform linux/amd64 \
  -t cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:${IMAGE_TAG} \
  -t cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:latest \
  .

echo "📤 Pushing image to Container Registry..."
docker push cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:${IMAGE_TAG}
docker push cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:latest

echo "🚀 Deploying new revision to Serverless Container..."
yc serverless container revision deploy \
  --container-name ${CONTAINER_NAME} \
  --image cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:${IMAGE_TAG} \
  --cores 1 \
  --memory 512M \
  --execution-timeout 60s \
  --concurrency 4 \
  --service-account-id ${SERVICE_ACCOUNT_ID} \
  --environment API_BASE_URL=https://backend.linka.su \
  --environment FIREBASE_API_KEY=AIzaSyBHwz_IGbuPDX6CUCnc-tj2wPdimgmoGZc \
  --environment FIREBASE_AUTH_DOMAIN=distypepro-android.firebaseapp.com \
  --environment FIREBASE_PROJECT_ID=distypepro-android \
  --environment FIREBASE_STORAGE_BUCKET=distypepro-android.appspot.com \
  --environment FIREBASE_MESSAGING_SENDER_ID=800888317067 \
  --environment FIREBASE_APP_ID=1:800888317067:web:a8594b3e24f430cf \
  --environment FIREBASE_MEASUREMENT_ID=G-RM812X3EM4 \
  --folder-id ${FOLDER_ID}

echo "✅ Deployment completed!"
echo "🌐 URL: https://bbak2usvd9decvtc8sfm.containers.yandexcloud.net/"
