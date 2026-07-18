# Desktop Release + GitHub Pages

Этот документ фиксирует текущий процесс публикации desktop-релизов (macOS + Windows + Linux) и страницы загрузки через GitHub Pages.

## Что уже настроено в репозитории

- Workflow релиза: `.github/workflows/electron-release.yml`
- Workflow GitHub Pages: `.github/workflows/pages-download.yml`
- Страница загрузки: `pages-site/`
- `electron-builder` publish provider: GitHub (`linkasu/linka-type-pwa`)

## GitHub Secrets (macOS подпись + опционально notarization)

Для workflow `Desktop Release` добавьте в `Settings -> Secrets and variables -> Actions`:

- `APPLE_CERTIFICATE_P12_BASE64`: base64 содержимое `.p12` сертификата `Developer ID Application`
- `APPLE_CERTIFICATE_PASSWORD`: пароль от `.p12`
- `APPLE_CERTIFICATE_NAME` (опционально): явное имя сертификата

Дополнительно для notarization (опционально):

- `APPLE_ID`: Apple ID разработчика
- `APPLE_APP_SPECIFIC_PASSWORD`: app-specific password Apple ID
- `APPLE_TEAM_ID`: Team ID из Apple Developer

Минимальная подготовка сертификата (локально на macOS):

```bash
base64 -i DeveloperIDApplication.p12 | pbcopy
```

Вставьте результат в secret `APPLE_CERTIFICATE_P12_BASE64`.

## Как выпускать релиз

1. Обновите одинаковую версию в `package.json` и корне `package-lock.json`.
2. Убедитесь, что `main` содержит нужный код.
3. Создайте и отправьте тег:

```bash
git tag v2.0.1
git push origin main --tags
```

4. Workflow `Desktop Release`:
- проверит, что тег строго равен `v` + версии package (например, `v2.0.8`);
- выполнит typecheck, unit/main тесты, build и Electron E2E до сборки артефактов;
- соберет macOS (`dmg`, `zip`), Windows (`exe`) и Linux (`AppImage`, `deb`);
- подпишет macOS артефакты Developer ID сертификатом;
- выполнит notarization, если заданы `APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID`;
- прикрепит артефакты и update-метаданные (`*.yml`, `*.blockmap`) к GitHub Release.

## GitHub Pages для страницы загрузок

Workflow `Deploy Download Page` деплоит каталог `pages-site/` на GitHub Pages при push в `main`.

После первого запуска проверьте в `Settings -> Pages`, что источник: `GitHub Actions`.

## DNS через YC CLI (для custom domain GH Pages)

Ниже шаблон для `downloads.linka.su` как subdomain, который указывает на Pages хост `linkasu.github.io.`.

1. Проверить зону и текущие записи:

```bash
yc dns zone list
yc dns zone list-records --name <zone_name>
```

2. Добавить CNAME:

```bash
yc dns zone add-records --name <zone_name> \
  --record "downloads 600 CNAME linkasu.github.io."
```

3. Если нужно изменить запись:

```bash
yc dns zone replace-records --name <zone_name> \
  --record "downloads 600 CNAME linkasu.github.io."
```

4. Если нужен откат/удаление:

```bash
yc dns zone delete-records --name <zone_name> \
  --record "downloads 600 CNAME linkasu.github.io."
```

5. После обновления DNS задайте `downloads.linka.su` в `Settings -> Pages -> Custom domain` и включите `Enforce HTTPS`.

## Проверка после публикации

- GitHub Release создан и содержит `dmg`, `zip`, `exe`, `AppImage`, `deb`, `*.yml`, `*.blockmap`.
- Страница `https://<owner>.github.io/<repo>/` показывает актуальный тег и активные кнопки скачивания.
- (Если custom domain) `https://downloads.linka.su/` открывается по HTTPS.

## Источники

- Yandex Cloud DNS record create/update/delete (CLI examples):
  - https://yandex.cloud/en/docs/dns/operations/resource-record-create
  - https://yandex.cloud/en/docs/dns/operations/resource-record-update
  - https://yandex.cloud/en/docs/dns/operations/resource-record-delete
- GitHub Pages custom domain:
  - https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site
- GitHub Pages deployment action:
  - https://github.com/actions/deploy-pages
- electron-builder publish and config:
  - https://www.electron.build/publish.html
  - https://www.electron.build/configuration.html
- macOS signing/notarization (electron ecosystem):
  - https://www.electron.build/code-signing-mac.html
  - https://packages.electronjs.org/notarize/main/index.html
