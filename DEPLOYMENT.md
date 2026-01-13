# Deployment Guide

## Yandex Cloud Serverless Container

### Deployed Resources

- **Container Name**: `linka-type-pwa`
- **Container ID**: `bbak2usvd9decvtc8sfm`
- **Public URL**: https://bbak2usvd9decvtc8sfm.containers.yandexcloud.net/
- **Folder ID**: `b1g2rq5eoov899k6tje5`
- **Registry ID**: `crps8rf7rt377mdescnr`
- **Service Account**: `linka-type-sa` (`aje5mol7phn3quv189jc`)

### Container Configuration

- **CPU**: 1 core
- **Memory**: 512 MB
- **Execution Timeout**: 60 seconds
- **Concurrency**: 4 requests
- **Public Access**: Enabled (unauthenticated invocations allowed)

### Environment Variables

- `API_BASE_URL`: `https://backend.linka.su`
- `PORT`: Автоматически передается Yandex Cloud

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

## Notes

- Образы собираются для `linux/amd64` платформы (required для Mac с Apple Silicon)
- Контейнер автоматически масштабируется от 0 до N экземпляров
- При первом запросе после простоя возможна "холодная" загрузка (~2-5 секунд)
- PORT передается через переменную окружения от Yandex Cloud
