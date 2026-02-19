# Firebase Analytics

Аналитика реализована на Firebase Analytics v10+ (модульный SDK).

## Архитектура

```
plugins/firebase.client.ts    → инициализация Firebase
composables/useAnalytics.ts   → основной composable
src/renderer/router.ts        → переходы между страницами
types/analytics.ts            → типы событий и свойств
```

## Конфигурация

Firebase проект: `distypepro-android`
Measurement ID: `G-RM812X3EM4`

Значения берутся из Vite env и переопределяются через:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Отслеживаемые события

### Основные действия
| Событие | Параметры | Описание |
|---------|-----------|----------|
| `page_view` | page_path, page_title | Автоматически при переходах |
| `say` | text_length, has_text, download | Озвучивание текста |
| `predicator_use` | word, position | Выбор слова из предиктора |
| `quickes_say` | phrase, index | Клик по быстрой фразе |
| `spotlight` | action (open/close) | Открытие/закрытие spotlight |

### Банк фраз
| Событие | Параметры | Описание |
|---------|-----------|----------|
| `bank_cselect` | category_id | Выбор категории |
| `bank_sselect` | statement_id, is_paste | Выбор фразы |
| `category_cache_started` | category_id, phrase_count | Начало кэширования |
| `category_cache_completed` | category_id, phrase_count | Конец кэширования |

### Авторизация
| Событие | Параметры | Описание |
|---------|-----------|----------|
| `login` | method | Вход в систему |
| `logout` | — | Выход |
| `register` | method | Регистрация |

### PWA и промпты
| Событие | Параметры | Описание |
|---------|-----------|----------|
| `update_prompt_shown` | — | Показан промпт обновления |
| `update_accepted` | — | Пользователь принял обновление |
| `mobile_app_prompt_shown` | platform | Показан промпт нативного приложения |
| `mobile_app_link_clicked` | platform | Клик по ссылке на приложение |
| `pwa_install_prompt` | — | Показан промпт установки PWA |
| `pwa_installed` | — | PWA установлено |

### Настройки
| Событие | Параметры | Описание |
|---------|-----------|----------|
| `settings_changed` | setting, value | Изменение любой настройки |

## User Properties

Синхронизируются автоматически при:
- Загрузке настроек пользователя
- Изменении настроек

| Свойство | Тип | Описание |
|----------|-----|----------|
| `voice_engine` | browser/yandex | Используемый TTS |
| `voice_uri` | string | ID голоса браузера |
| `yandex_voice` | string | ID голоса Яндекса |
| `show_predictor` | boolean | Показывать предиктор |
| `show_quickes` | boolean | Показывать быстрые фразы |
| `show_bank` | boolean | Показывать банк |
| `speak_last_word` | boolean | Озвучивать последнее слово |
| `save_on_say` | boolean | Сохранять при озвучивании |
| `type_sound` | boolean | Звук набора |
| `dark_theme` | boolean | Тёмная тема |
| `locale` | ru/en | Язык интерфейса |
| `volume` | number | Громкость |
| `rate` | number | Скорость речи |
| `pitch` | number | Высота голоса |
| `is_pwa` | boolean | Запущено как PWA |
| `platform` | web/ios/android | Платформа |

## Использование

### В компонентах

```typescript
const { trackSay, trackSpotlight } = useAnalytics()

// Трекинг события
trackSay(text.length, false)
trackSpotlight('open')
```

### В stores

```typescript
import { useAnalytics } from '~/composables/useAnalytics'

// В action
if (import.meta.client) {
  const { trackLogin, setAnalyticsUserId } = useAnalytics()
  setAnalyticsUserId(user.id)
  trackLogin()
}
```

### Добавление нового события

1. Добавить тип в `types/analytics.ts`:
```typescript
export type AnalyticsEventName =
  | ...existing...
  | 'new_event'

export interface AnalyticsEventParams {
  ...existing...
  new_event: { param1: string; param2: number }
}
```

2. Добавить метод в `composables/useAnalytics.ts`:
```typescript
const trackNewEvent = (param1: string, param2: number) => {
  trackEvent('new_event', { param1, param2 })
}

return {
  ...existing...,
  trackNewEvent,
}
```

3. Вызвать в компоненте:
```typescript
const { trackNewEvent } = useAnalytics()
trackNewEvent('value', 42)
```

## Отладка

### Development режим
- События логируются в консоль с префиксом `[Analytics]`
- Если Firebase недоступен — `[Analytics Debug]`

### Firebase DebugView
1. Добавить `?debug_mode=true` к URL
2. Открыть Firebase Console → Analytics → DebugView
3. События появятся в реальном времени

### Chrome Extension
Установить "Google Analytics Debugger" для детального логирования.

## Offline

Firebase Analytics автоматически:
- Кэширует события в IndexedDB при офлайне
- Отправляет накопленные события при восстановлении связи
- Хранит до ~100k событий

Дополнительная настройка не требуется.

## Consent

Реализовано базовое управление согласием:

```typescript
const { setConsent, getConsent } = useAnalytics()

// Проверить статус
const status = getConsent() // 'granted' | 'denied' | 'unknown'

// Установить согласие
setConsent(false) // отключить сбор
setConsent(true)  // включить сбор
```

Статус сохраняется в `localStorage` под ключом `analytics_consent`.
