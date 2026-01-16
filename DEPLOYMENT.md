# Deployment Guide

## API Gateway + Domain

API Gateway используется как публичная точка входа и проксирует трафик на Serverless Container.
Создан отдельный gateway для фронтенда `linka-type-frontend` (ID `d5dnfh7ftbjjvhanudei`).
Домен `type.linka.su` должен быть привязан к этому gateway (DNS уже настроен).

### Проверка текущего состояния

```bash
# Список шлюзов
yc serverless api-gateway list --folder-id b1g2rq5eoov899k6tje5

# Детали шлюза (вставьте имя или ID)
yc serverless api-gateway get linka-type-frontend

# Экспорт текущей спецификации (опционально)
yc serverless api-gateway get-spec linka-type-frontend > docs/apigw-frontend.yaml
```

### Привязка домена (если нужно повторить)

1. Убедитесь, что `type.linka.su` CNAME указывает на домен API Gateway.
2. Проверьте сертификат в YC Certificate Manager:

```bash
yc certificate-manager certificate list --folder-id b1g2rq5eoov899k6tje5
```

3. Привяжите домен к API Gateway (после выпуска сертификата):

```bash
yc serverless api-gateway add-domain linka-type-frontend \
  --domain type.linka.su \
  --certificate-id fpqh8k0u6iiq5faa9hru
```

## Yandex Cloud Serverless Container

### Deployed Resources

- **Container Name**: `linka-type-pwa`
- **Container ID**: `bbak2usvd9decvtc8sfm`
- **Public URL**: https://bbak2usvd9decvtc8sfm.containers.yandexcloud.net/
- **Folder ID**: `b1g2rq5eoov899k6tje5`
- **Registry ID**: `crps8rf7rt377mdescnr`
- **Service Account**: `linka-type-sa` (`aje5mol7phn3quv189jc`)

### Public Entry

- **API Gateway domain**: `type.linka.su` (ожидает валидного сертификата)
- **API Gateway default domain**: https://d5dnfh7ftbjjvhanudei.y1haggxy.apigw.yandexcloud.net
- **Direct container URL** (fallback): https://bbak2usvd9decvtc8sfm.containers.yandexcloud.net/

### Container Configuration

- **CPU**: 1 core
- **Memory**: 512 MB
- **Execution Timeout**: 60 seconds
- **Concurrency**: 4 requests
- **Public Access**: Enabled (unauthenticated invocations allowed)

### Environment Variables

- `API_BASE_URL`: `https://backend.linka.su`
- `PORT`: Автоматически передается Yandex Cloud

## CI/CD (GitHub Actions)

Деплой выполняется GitHub Actions workflow `deploy-yc.yml` на каждый push в `main`.

### Required GitHub Secrets

- `YC_SA_KEY_JSON` — JSON ключ сервисного аккаунта
- `YC_FOLDER_ID` — `b1g2rq5eoov899k6tje5`
- `YC_REGISTRY_ID` — `crps8rf7rt377mdescnr`
- `YC_CONTAINER_NAME` — `linka-type-pwa`
- `YC_SERVICE_ACCOUNT_ID` — `aje5mol7phn3quv189jc`
- `API_BASE_URL` — `https://backend.linka.su`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

### Optional GitHub Variables

- `YC_IMAGE_NAME` — по умолчанию `linka-type-pwa-v2`

### Notes

- Workflow использует `yc` CLI для логина в Container Registry и деплоя ревизии.
- Для изменения API Gateway можно хранить `docs/apigw.yaml` и обновлять вручную по `yc serverless api-gateway update`.

## Git Branching

Целевая ветка деплоя: `main`.

```bash
# Установить default branch в GitHub
gh repo edit --default-branch main

# Создать PR из v2 в main (если нужно повторить)
gh pr create --base main --head v2 --title "Merge v2" --body "Release v2"
```

## Quick Deploy

Для обновления контейнера выполните:

```bash
./deploy.sh
```

Скрипт автоматически:
1. Соберет Docker образ для linux/amd64
2. Загрузит образ в Container Registry
3. Развернет новую ревизию контейнера

## Manual Deployment

### 1. Build Image

```bash
docker build --platform linux/amd64 \
  -t cr.yandex/crps8rf7rt377mdescnr/linka-type-pwa-v2:latest \
  .
```

### 2. Push to Registry

```bash
# Configure Docker authentication
yc container registry configure-docker

# Push image
docker push cr.yandex/crps8rf7rt377mdescnr/linka-type-pwa-v2:latest
```

### 3. Deploy New Revision

```bash
yc serverless container revision deploy \
  --container-name linka-type-pwa \
  --image cr.yandex/crps8rf7rt377mdescnr/linka-type-pwa-v2:latest \
  --cores 1 \
  --memory 512M \
  --execution-timeout 60s \
  --concurrency 4 \
  --service-account-id aje5mol7phn3quv189jc \
  --environment API_BASE_URL=https://backend.linka.su \
  --folder-id b1g2rq5eoov899k6tje5
```

## Monitoring

### View Logs

```bash
yc serverless container revision logs \
  --container-name linka-type-pwa \
  --folder-id b1g2rq5eoov899k6tje5 \
  --follow
```

### List Revisions

```bash
yc serverless container revision list \
  --container-name linka-type-pwa \
  --folder-id b1g2rq5eoov899k6tje5
```

### Get Container Info

```bash
yc serverless container get \
  --name linka-type-pwa \
  --folder-id b1g2rq5eoov899k6tje5
```

## Rollback

Для отката к предыдущей ревизии:

```bash
# Получить список ревизий
yc serverless container revision list \
  --container-name linka-type-pwa \
  --folder-id b1g2rq5eoov899k6tje5

# Развернуть конкретную ревизию (замените REVISION_ID)
yc serverless container rollback \
  --name linka-type-pwa \
  --revision-id REVISION_ID \
  --folder-id b1g2rq5eoov899k6tje5
```

## Validation Checklist

- `https://type.linka.su/` открывается и редиректит на `/login` или `/main`
- `/login` логинится и сохраняет refresh cookie
- `/main` доступна и воспроизводит TTS
- Оффлайн: создание/редактирование фраз работает и синхронизируется после онлайн
- Логи без 5xx при первых запросах

## Notes

- Образы собираются для `linux/amd64` платформы (required для Mac с Apple Silicon)
- Контейнер автоматически масштабируется от 0 до N экземпляров
- При первом запросе после простоя возможна "холодная" загрузка (~2-5 секунд)
- PORT передается через переменную окружения от Yandex Cloud
