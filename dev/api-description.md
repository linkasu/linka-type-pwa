ОПИСАНИЕ API НОВОЙ ВЕРСИИ И ПЛАН МИГРАЦИИ

ОБЗОР НОВОГО API

Базовый URL: https://backend.linka.su

Новый API предоставляет RESTful интерфейс с поддержкой realtime обновлений через long polling и WebSocket.
Отход от Firebase Realtime Database к независимому backend на Go с PostgreSQL.


АУТЕНТИФИКАЦИЯ

Старая версия:
- Firebase Authentication
- onAuthStateChanged для проверки состояния
- fireapp.auth().currentUser для получения пользователя
- Токены управляются Firebase SDK

Новая версия:
- Custom JWT токены через POST /v1/auth
- Email + password аутентификация
- Bearer токен в заголовке Authorization

Эндпоинт аутентификации:
POST /v1/auth
Request:
  {
    "email": "user@example.com",
    "password": "secret"
  }
Response:
  {
    "token": "eyJhbGc...",
    "user": {
      "id": "user123",
      "email": "user@example.com"
    }
  }

Миграция:
1. Заменить Firebase Auth на axios POST /v1/auth
2. Сохранять токен в localStorage
3. Добавлять токен в каждый запрос через axios interceptor
4. Реализовать refresh token механизм (если поддерживается)


КАТЕГОРИИ

Старая версия:
GET:
  fireapp.database().ref('/users/{uid}/Category')
    .on('child_added', callback)
  
CREATE:
  fireapp.database().ref('/users/{uid}/Category/{id}')
    .set({label, created, id, statements: {}})

UPDATE:
  fireapp.database().ref('/users/{uid}/Category/{id}/label')
    .set(newLabel)

DELETE:
  fireapp.database().ref('/users/{uid}/Category/{id}')
    .remove()

Новая версия:
GET /v1/categories
Response:
  [
    {
      "id": "cat123",
      "label": "Мои фразы",
      "created": 1735689600000,
      "default": false,
      "statements_count": 5
    }
  ]

POST /v1/categories
Request:
  {
    "label": "Новая категория",
    "created": 1735689600000
  }
Response:
  {
    "id": "cat456",
    "label": "Новая категория",
    "created": 1735689600000
  }

PATCH /v1/categories/{id}
Request:
  {
    "label": "Обновленная категория"
  }

DELETE /v1/categories/{id}
Response:
  {"success": true}

Миграция:
1. Создать composable useCategories() для работы с категориями
2. Заменить Firebase listeners на REST запросы
3. Использовать Pinia store для кеширования категорий
4. Подписаться на realtime обновления через /v1/changes или WebSocket


ВЫСКАЗЫВАНИЯ (STATEMENTS)

Старая версия:
GET:
  fireapp.database().ref('/users/{uid}/Category/{categoryId}/statements')
    .on('child_added', callback)

CREATE:
  fireapp.database().ref('/users/{uid}/Category/{categoryId}/statements/{id}')
    .set({text, categoryId, created, id})

UPDATE:
  fireapp.database().ref('/users/{uid}/Category/{categoryId}/statements/{id}/text')
    .set(newText)

DELETE:
  fireapp.database().ref('/users/{uid}/Category/{categoryId}/statements/{id}')
    .remove()

Новая версия:
GET /v1/categories/{id}/statements
Response:
  [
    {
      "id": "stmt123",
      "category_id": "cat123",
      "text": "Здравствуйте!",
      "created": 1735689600000
    }
  ]

POST /v1/statements
Request:
  {
    "categoryId": "cat123",
    "text": "Новая фраза",
    "created": 1735689600000
  }
Response:
  {
    "id": "stmt456",
    "category_id": "cat123",
    "text": "Новая фраза",
    "created": 1735689600000
  }

PATCH /v1/statements/{id}
Request:
  {
    "text": "Обновленная фраза"
  }

DELETE /v1/statements/{id}

Миграция:
1. Создать composable useStatements(categoryId) 
2. Заменить Firebase listeners на REST запросы
3. Кешировать statements в Pinia по категориям
4. Оптимистичные обновления для лучшего UX


БЫСТРЫЕ ФРАЗЫ (QUICKES)

Старая версия:
GET:
  fireapp.database().ref('/users/{uid}/quickes')
    .on('value', callback)

UPDATE:
  fireapp.database().ref('/users/{uid}/quickes')
    .set(['Привет', 'Как дела?', ...])

Новая версия:
GET /v1/quickes
Response:
  {
    "quickes": ["Да", "Нет", "Спасибо", "Помогите"]
  }

PUT /v1/quickes
Request:
  {
    "quickes": ["Привет", "Пока", "Да", "Нет", "Спасибо", "Помогите"]
  }

Миграция:
1. Создать composable useQuickes()
2. Заменить Firebase на REST
3. Хранить в Pinia store
4. Валидация: ровно 6 фраз


СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ

Старая версия:
GET:
  fireapp.database().ref('/users/{uid}/inited')
    .on('value', callback)

UPDATE:
  fireapp.database().ref('/users/{uid}/inited')
    .set(true)

Новая версия:
GET /v1/user/state
Response:
  {
    "inited": true,
    "preferences": {
      "darkTheme": false,
      "yandex": true,
      ...
    }
  }

PUT /v1/user/state
Request:
  {
    "inited": true,
    "preferences": {
      "darkTheme": true
    }
  }

Миграция:
1. Перенести состояние из Firebase в новый API
2. Синхронизировать preferences с сервером
3. Кешировать локально в Pinia
4. Fallback на localStorage если нет сети


ГЛОБАЛЬНЫЕ КАТЕГОРИИ

Старая версия:
GET:
  fireapp.database().ref('/global/Category')
    .once('value')

IMPORT:
  Нет прямого API, копирование вручную в клиенте

Новая версия:
GET /v1/global/categories?include_statements=true
Response:
  [
    {
      "id": "global_cat1",
      "label": "Приветствия",
      "created": 1735689600000,
      "statements": [
        {
          "id": "stmt1",
          "text": "Здравствуйте",
          "created": 1735689600000
        }
      ]
    }
  ]

GET /v1/global/categories/{id}/statements
Response: список statements

POST /v1/global/import
Request:
  {
    "category_id": "global_cat1",
    "force": false
  }
Response:
  {
    "id": "new_cat123",
    "label": "Приветствия",
    "statements_count": 10
  }

Миграция:
1. Заменить чтение из /global на GET /v1/global/categories
2. Использовать POST /v1/global/import вместо клиентского копирования
3. force=true для перезаписи существующей категории


ОНБОРДИНГ И ГЕНЕРАЦИЯ ФРАЗ

Старая версия:
GET QUESTIONS:
  fireapp.database().ref('/factory/questions')
    .once('value')

GENERATE PHRASES:
  axios.post('https://functions.firebase.com/.../chatbot', {phrase})

Новая версия:
GET /v1/factory/questions
Response:
  {
    "questions": [
      {
        "id": "q1",
        "text": "Как вас зовут?",
        "type": "text"
      }
    ]
  }

POST /v1/onboarding/phrases
Request:
  {
    "answers": {
      "q1": "Иван",
      "q2": "30",
      ...
    }
  }
Response:
  {
    "categories": [
      {
        "label": "Обо мне",
        "statements": [
          "Меня зовут Иван",
          "Мне 30 лет"
        ]
      }
    ]
  }

Миграция:
1. Заменить чтение вопросов на GET /v1/factory/questions
2. Собрать ответы пользователя
3. Отправить на POST /v1/onboarding/phrases
4. Автоматически создать категории и фразы из ответа


TTS И ГОЛОСА

Старая версия:
VOICES:
  axios.get('https://tts.linka.su/voices')

TTS:
  axios.post('https://tts.linka.su/tts', {text, voice}, {responseType: 'arraybuffer'})

Новая версия:
GET /v1/voices
Response:
  [
    {
      "id": "zahar",
      "name": "Захар",
      "lang": "ru-RU",
      "gender": "male",
      "engine": "yandex"
    }
  ]

POST /v1/tts
Request:
  {
    "text": "Привет мир",
    "voice": "zahar"
  }
Response:
  arraybuffer (audio/mp3)

Миграция:
1. Заменить URL с tts.linka.su на backend.linka.su/v1
2. Добавить Authorization токен
3. Обновить TTS.ts для работы с новым API


REALTIME ОБНОВЛЕНИЯ

Старая версия:
  Firebase Realtime Database listeners:
  - on('child_added')
  - on('child_changed')
  - on('child_removed')

Новая версия:

LONG POLLING:
GET /v1/changes?cursor={cursor}&timeout=25s&limit=100
Response:
  {
    "type": "changes",
    "cursor": "new_cursor_value",
    "changes": [
      {
        "type": "category_added",
        "data": {...}
      },
      {
        "type": "statement_updated",
        "data": {...}
      }
    ]
  }

WEBSOCKET:
WS /v1/stream?cursor={cursor}
Messages:
  {
    "type": "changes",
    "cursor": "...",
    "changes": [...]
  }
  {
    "type": "heartbeat"
  }

Типы изменений:
- category_added
- category_updated
- category_deleted
- statement_added
- statement_updated
- statement_deleted
- quickes_updated
- user_state_updated

Миграция:
1. Создать composable useRealtime()
2. Реализовать long polling как fallback
3. Использовать WebSocket для основного режима
4. Хранить cursor в localStorage
5. При получении изменения обновлять Pinia store
6. Reconnect логика при разрыве соединения


УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ

Старая версия:
  Нет API, только через Firebase Console

Новая версия:
POST /v1/user/delete
Request:
  {
    "delete_firebase": false
  }
Response:
  {"success": true}

Миграция:
1. Добавить функцию удаления аккаунта в настройках
2. Диалог подтверждения
3. Очистка локальных данных после успешного удаления


ЗДОРОВЬЕ СЕРВИСА

Новая возможность:
GET /healthz
Response:
  {"status": "ok"}

Использование:
1. Проверка доступности API при старте
2. Индикация offline/online статуса
3. Мониторинг в production


ФОРМАТ ОШИБОК

Старая версия:
  Firebase ошибки различных форматов

Новая версия:
  Единый формат:
  Status: 4xx или 5xx
  Body:
  {
    "error": {
      "code": "unauthorized",
      "message": "Invalid token"
    }
  }

Коды ошибок:
- unauthorized - нет или невалидный токен
- not_found - ресурс не найден
- validation_error - невалидные данные
- conflict - конфликт (например, дубликат)
- internal_error - ошибка сервера

Миграция:
1. Единый error handler в axios interceptor
2. Показ toast/dialog для ошибок
3. Автоматический refresh token при 401
4. Retry логика для 5xx


ПЛАН МИГРАЦИИ С FIREBASE НА НОВЫЙ API

ШАГ 1: ПОДГОТОВКА

1. Создать новый Nuxt 4 проект
2. Установить зависимости:
   - axios для HTTP запросов
   - pinia для state management
   - @vueuse/core для composables
   - vite-pwa для PWA
3. Настроить TypeScript типы для API
4. Создать axios instance с базовым URL и interceptors

ШАГ 2: АУТЕНТИФИКАЦИЯ

1. Создать composable useAuth():
   - login(email, password)
   - logout()
   - isAuthenticated
   - currentUser
   - token
2. Создать auth store в Pinia
3. Сохранять токен в localStorage
4. Добавить axios interceptor для токена
5. Реализовать route guards

ШАГ 3: API СЛОЙ

1. Создать api/client.ts с axios instance
2. Создать api типы (types/api.ts):
   - Category
   - Statement
   - User
   - QuickPhrase
3. Создать API методы:
   - api/categories.ts
   - api/statements.ts
   - api/quickes.ts
   - api/user.ts
   - api/global.ts
   - api/tts.ts
4. Обернуть все в composables

ШАГ 4: STATE MANAGEMENT

1. Создать Pinia stores:
   - useAuthStore
   - useCategoriesStore
   - useStatementsStore
   - useQuickesStore
   - useUserStore
   - useSettingsStore
2. Реализовать кеширование
3. Оптимистичные обновления
4. Нормализация данных (optional)

ШАГ 5: REALTIME

1. Создать composable useRealtime():
   - connect()
   - disconnect()
   - on(type, handler)
2. Реализовать WebSocket подключение
3. Fallback на long polling
4. Reconnect логика
5. Обновление stores при получении изменений
6. Индикация sync статуса

ШАГ 6: КОМПОНЕНТЫ

1. Портировать компоненты из старой версии
2. Использовать Composition API вместо Class Components
3. Заменить Firebase вызовы на composables
4. Добавить loading и error states
5. Улучшить accessibility

ШАГ 7: OFFLINE SUPPORT

1. Настроить Workbox в vite-pwa
2. Кеширование API ответов
3. Background sync для изменений
4. Индикация offline режима
5. Conflict resolution стратегия

ШАГ 8: МИГРАЦИЯ ДАННЫХ

1. Экспорт данных из Firebase:
   - Скрипт export всех пользователей
   - Конвертация в формат нового API
2. Импорт в PostgreSQL:
   - Через POST /v1/admin/import (если есть)
   - Или напрямую в БД
3. Тестирование миграции на dev окружении
4. Постепенный переход пользователей

ШАГ 9: ТЕСТИРОВАНИЕ

1. Unit тесты для composables
2. Integration тесты для API
3. E2E тесты для критичных флоу
4. Тестирование offline режима
5. Тестирование на разных устройствах

ШАГ 10: ДЕПЛОЙ

1. Настроить CI/CD
2. Staging окружение
3. Beta тестирование с пользователями
4. Мониторинг и логирование
5. Постепенный rollout
6. Поддержка старой версии параллельно


СРАВНЕНИЕ СТРУКТУР ДАННЫХ

Firebase Realtime Database:
/users/
  {uid}/
    inited: boolean
    quickes: string[]
    Category/
      {categoryId}/
        id: string
        label: string
        created: number
        default: boolean
        statements/
          {statementId}/
            id: string
            text: string
            categoryId: string
            created: number

Новый API (PostgreSQL):
users
  id: uuid
  email: string
  created_at: timestamp

categories
  id: uuid
  user_id: uuid FK
  label: string
  created: bigint
  is_default: boolean

statements
  id: uuid
  category_id: uuid FK
  text: string
  created: bigint

user_state
  user_id: uuid FK (PK)
  inited: boolean
  quickes: jsonb
  preferences: jsonb

Преимущества новой структуры:
- Нормализация данных
- Foreign keys и constraints
- Индексы для быстрых запросов
- Транзакции
- Мощные SQL запросы


CHECKLIST МИГРАЦИИ

Аутентификация:
  - [ ] Заменить Firebase Auth на POST /v1/auth
  - [ ] Сохранение токена
  - [ ] Refresh token механизм
  - [ ] Logout

Категории:
  - [ ] GET /v1/categories
  - [ ] POST /v1/categories
  - [ ] PATCH /v1/categories/{id}
  - [ ] DELETE /v1/categories/{id}
  - [ ] Realtime обновления

Высказывания:
  - [ ] GET /v1/categories/{id}/statements
  - [ ] POST /v1/statements
  - [ ] PATCH /v1/statements/{id}
  - [ ] DELETE /v1/statements/{id}
  - [ ] Realtime обновления

Быстрые фразы:
  - [ ] GET /v1/quickes
  - [ ] PUT /v1/quickes

Состояние:
  - [ ] GET /v1/user/state
  - [ ] PUT /v1/user/state

Глобальные категории:
  - [ ] GET /v1/global/categories
  - [ ] POST /v1/global/import

Онбординг:
  - [ ] GET /v1/factory/questions
  - [ ] POST /v1/onboarding/phrases

TTS:
  - [ ] GET /v1/voices
  - [ ] POST /v1/tts

Realtime:
  - [ ] WebSocket подключение
  - [ ] Long polling fallback
  - [ ] Обработка изменений

Прочее:
  - [ ] POST /v1/user/delete
  - [ ] GET /healthz
  - [ ] Error handling
  - [ ] Offline support
  - [ ] Миграция данных


