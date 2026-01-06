ПЛАН ОБНОВЛЕНИЯ ПРОЕКТА LINKA TYPE PWA V2

ЦЕЛЬ ПРОЕКТА

Создать современное PWA приложение на базе Nuxt 4, Vuetify 3, TypeScript с полным переходом на новый backend API и внедрением современных стандартов разработки.


ТЕХНИЧЕСКИЙ СТЕК

Frontend:
- Nuxt 4 (latest)
- Vue 3 Composition API
- Vuetify 3
- TypeScript 5.x
- Pinia (state management)
- VueUse (composables)
- Axios (HTTP client)
- Vite PWA

Backend:
- backend.linka.su REST API
- WebSocket для realtime
- PostgreSQL (server-side)

Инструменты:
- Vitest (unit tests)
- Playwright (e2e tests)
- ESLint + Prettier
- Husky (git hooks)
- GitHub Actions (CI/CD)


ФАЗА 1: ИНИЦИАЛИЗАЦИЯ ПРОЕКТА

1.1 Создание базовой структуры

  - [ ] Инициализация Nuxt 4 проекта
    npx nuxi@latest init linka-type-pwa-v2 --package-manager yarn
  
  - [ ] Настройка TypeScript
    Создать tsconfig.json с strict режимом
  
  - [ ] Установка Vuetify 3
    yarn add vuetify @mdi/font
    Настроить nuxt.config.ts с vuetify модулем
  
  - [ ] Установка зависимостей
    yarn add pinia @pinia/nuxt
    yarn add @vueuse/core @vueuse/nuxt
    yarn add axios
    yarn add @vite-pwa/nuxt
    yarn add -D vitest @vitest/ui
    yarn add -D @playwright/test
    yarn add -D eslint prettier
    yarn add -D @nuxtjs/eslint-config-typescript

  - [ ] Структура каталогов
    /composables - composables для переиспользования
    /stores - Pinia stores
    /types - TypeScript типы
    /api - API клиент
    /components - Vue компоненты
    /pages - страницы (роутинг)
    /layouts - layout компоненты
    /middleware - route middleware
    /plugins - Nuxt плагины
    /public - статические файлы (иконки, манифест)
    /assets - стили, изображения
    /utils - утилиты
    /tests - тесты

  - [ ] Конфигурация nuxt.config.ts
    PWA настройки
    Vuetify настройки
    Pinia настройки
    TypeScript настройки
    Build оптимизация

  - [ ] Git инициализация
    git init
    Создать .gitignore
    Первый коммит

  - [ ] ESLint и Prettier конфигурация
    .eslintrc.js
    .prettierrc
    VSCode settings.json

  - [ ] Husky настройка
    yarn add -D husky lint-staged
    Pre-commit хуки


1.2 PWA конфигурация

  - [ ] Настроить @vite-pwa/nuxt
    Манифест
    Service Worker
    Иконки
    Offline стратегия

  - [ ] Создать иконки
    Конвертировать существующие иконки
    Добавить maskable иконки для Android
    Добавить SVG favicon

  - [ ] Manifest.json
    name: "LINKa: напиши"
    short_name: "linka-type"
    description: "Приложение для коммуникации"
    theme_color: #197377
    background_color: #fbcc30
    display: standalone
    shortcuts: [...]
    screenshots: [...]

  - [ ] Service Worker стратегия
    Workbox configuration
    Cache first для статики
    Network first для API
    Background sync для offline изменений


1.3 Базовые настройки

  - [ ] Цветовая схема Vuetify
    primary: #197377
    secondary: #bed64f
    accent: #fbcc30
    Темная тема

  - [ ] Шрифты
    Roboto локально (offline support)
    Material Design Icons

  - [ ] Глобальные стили
    assets/styles/main.scss
    Vuetify переменные
    Custom CSS

  - [ ] Мета теги и SEO
    app.head в nuxt.config.ts
    Социальные теги
    Описание


ФАЗА 2: API ИНТЕГРАЦИЯ

2.1 Типизация API

  - [ ] types/api.ts
    interface User
    interface Category
    interface Statement
    interface QuickPhrase
    interface AuthResponse
    interface ApiError
    interface RealtimeChange
    interface Voice

  - [ ] types/enums.ts
    ChangeType enum
    ErrorCode enum

  - [ ] types/state.ts
    Типы для Pinia stores


2.2 API клиент

  - [ ] api/client.ts
    Создать axios instance
    baseURL: https://backend.linka.su
    timeout: 30000
    
  - [ ] api/interceptors.ts
    Request interceptor: добавление токена
    Response interceptor: обработка ошибок
    Refresh token логика
    Retry логика для 5xx

  - [ ] api/auth.ts
    login(email, password): Promise<AuthResponse>
    logout(): Promise<void>
    refreshToken(): Promise<string>

  - [ ] api/categories.ts
    getCategories(): Promise<Category[]>
    createCategory(label: string): Promise<Category>
    updateCategory(id: string, label: string): Promise<Category>
    deleteCategory(id: string): Promise<void>

  - [ ] api/statements.ts
    getStatements(categoryId: string): Promise<Statement[]>
    createStatement(categoryId: string, text: string): Promise<Statement>
    updateStatement(id: string, text: string): Promise<Statement>
    deleteStatement(id: string): Promise<void>

  - [ ] api/quickes.ts
    getQuickes(): Promise<string[]>
    updateQuickes(quickes: string[]): Promise<void>

  - [ ] api/user.ts
    getState(): Promise<UserState>
    updateState(state: Partial<UserState>): Promise<void>
    deleteAccount(deleteFirebase: boolean): Promise<void>

  - [ ] api/global.ts
    getGlobalCategories(includeStatements: boolean): Promise<Category[]>
    importCategory(categoryId: string, force: boolean): Promise<Category>

  - [ ] api/onboarding.ts
    getQuestions(): Promise<Question[]>
    generatePhrases(answers: Record<string, string>): Promise<OnboardingResult>

  - [ ] api/tts.ts
    getVoices(): Promise<Voice[]>
    synthesize(text: string, voice: string): Promise<Blob>

  - [ ] api/realtime.ts
    connectWebSocket(cursor?: string): WebSocket
    longPoll(cursor?: string, timeout?: number): Promise<ChangesResponse>


2.3 Composables

  - [ ] composables/useAuth.ts
    login()
    logout()
    isAuthenticated
    currentUser
    token

  - [ ] composables/useCategories.ts
    categories
    loading
    error
    fetchCategories()
    createCategory()
    updateCategory()
    deleteCategory()

  - [ ] composables/useStatements.ts
    statements
    loading
    error
    fetchStatements(categoryId)
    createStatement()
    updateStatement()
    deleteStatement()

  - [ ] composables/useQuickes.ts
    quickes
    loading
    updateQuickes()

  - [ ] composables/useRealtime.ts
    connect()
    disconnect()
    on(type, handler)
    status

  - [ ] composables/useTTS.ts
    voices
    selectedVoice
    volume
    rate
    pitch
    say(text)
    stop()
    loading

  - [ ] composables/useOffline.ts
    isOnline
    pendingChanges
    sync()


ФАЗА 3: STATE MANAGEMENT

3.1 Pinia Stores

  - [ ] stores/auth.ts
    State: user, token, isAuthenticated
    Actions: login, logout, refreshToken
    Getters: isAdmin

  - [ ] stores/categories.ts
    State: categories, loading, error
    Actions: fetch, create, update, delete
    Getters: sortedCategories, defaultCategories

  - [ ] stores/statements.ts
    State: statements (Map по categoryId)
    Actions: fetch, create, update, delete
    Getters: getByCategory

  - [ ] stores/quickes.ts
    State: quickes, loading
    Actions: fetch, update
    Validation: ровно 6 фраз

  - [ ] stores/user.ts
    State: inited, preferences
    Actions: fetchState, updateState
    Preferences: darkTheme, yandex, voice, etc

  - [ ] stores/settings.ts
    State: voice, volume, rate, pitch, yandex
    Actions: update settings
    Persist в localStorage

  - [ ] stores/realtime.ts
    State: connected, cursor, changes
    Actions: connect, disconnect, handleChange
    Обновление других stores при изменениях


3.2 Оптимизация

  - [ ] Нормализация данных (optional)
    Использовать Map для O(1) доступа
    Избежать дублирования

  - [ ] Оптимистичные обновления
    Немедленное обновление UI
    Rollback при ошибке

  - [ ] Кеширование
    Кеш на 5 минут для categories
    Инвалидация при изменениях

  - [ ] Дебаунсинг
    Для поиска и фильтрации
    Для сохранения настроек


ФАЗА 4: ROUTING

4.1 Страницы

  - [ ] pages/index.vue
    Редирект на /app или /login
  
  - [ ] pages/login.vue
    Форма аутентификации
    Email/password поля
    Кнопки входа и регистрации
    Восстановление пароля (если поддерживается)

  - [ ] pages/setup.vue
    Онбординг для новых пользователей
    Шаги:
      1. Приветствие
      2. Настройка голоса
      3. Вопросник
    Навигация между шагами

  - [ ] pages/app.vue (или /app/index.vue)
    Главный экран приложения
    Layout с header
    Поля ввода (3 чата)
    Кнопка "Сказать"
    Quickes блок
    Bank блок

  - [ ] pages/settings/index.vue
    Табы: Голос, Адаптивность, Импорт

  - [ ] pages/settings/voice.vue
    Настройки TTS

  - [ ] pages/settings/adaptive.vue
    Настройки интерфейса

  - [ ] pages/settings/import.vue
    Импорт глобальных категорий

  - [ ] pages/settings/account.vue
    Информация об аккаунте
    Удаление аккаунта


4.2 Layouts

  - [ ] layouts/default.vue
    Базовый layout с v-app

  - [ ] layouts/app.vue
    Layout с header и navigation
    Для основного приложения

  - [ ] layouts/auth.vue
    Простой layout для login/signup

  - [ ] layouts/fullscreen.vue
    Для Tutorial и Reader


4.3 Middleware

  - [ ] middleware/auth.ts
    Проверка аутентификации
    Редирект на /login если не авторизован

  - [ ] middleware/setup.ts
    Проверка inited
    Редирект на /setup если не инициализирован

  - [ ] middleware/guest.ts
    Редирект на /app если уже авторизован


4.4 Навигация

  - [ ] Программатическая навигация
    navigateTo() из Nuxt
    Breadcrumbs компонент

  - [ ] Route transitions
    Плавные переходы между страницами


ФАЗА 5: КОМПОНЕНТЫ UI

5.1 Основные блоки

  - [ ] components/AppHeader.vue
    Аналог LHeader.vue
    Кнопки: Tutorial, Shortcuts, Settings
    Индикатор чата (1/2/3)
    Offline индикатор

  - [ ] components/MainInput.vue
    Textarea для ввода
    Predictor интеграция
    Полноэкранный режим
    Звук печати
    Озвучивание последнего слова

  - [ ] components/Predicator.vue
    Предсказание слов
    ButtonRow с вариантами
    Клавиатурные сокращения 1-5

  - [ ] components/Quickes.vue
    6 быстрых фраз
    ButtonRow
    Клавиши 1-6

  - [ ] components/Bank.vue
    Категории или Statements
    Навигация между уровнями
    Клавиатурные сокращения


5.2 Списки и элементы

  - [ ] components/CategoryList.vue
    Список категорий
    Кнопки: добавить, выбрать, редактировать, удалить

  - [ ] components/StatementList.vue
    Список высказываний
    Режим вставки
    Случайное высказывание
    Reader режим
    Текстовый редактор

  - [ ] components/CategoryItem.vue
    Элемент категории
    Badge с номером
    Контекстное меню

  - [ ] components/StatementItem.vue
    Элемент высказывания
    Badge с номером
    Контекстное меню


5.3 Модальные окна и overlays

  - [ ] components/Tutorial.vue
    Fullscreen overlay
    Видео или интерактивный гайд
    Кнопка закрытия

  - [ ] components/ShortcutList.vue
    Overlay со списком горячих клавиш
    Группировка по функциям

  - [ ] components/Reader.vue
    Fullscreen режим чтения
    Навигация по statements
    Play/Pause
    Клавиши: Space, Arrows, Esc

  - [ ] components/TextEditor.vue
    Textarea для пакетного редактирования
    Каждая строка = statement
    Сохранить/Отменить

  - [ ] components/ImportDialog.vue
    Диалог импорта глобальных категорий
    Превью statements
    Кнопка импорта


5.4 Настройки

  - [ ] components/VoiceSettings.vue
    Select голосов
    Sliders: volume, rate, pitch
    Switch Яндекс TTS
    Кнопка тестирования

  - [ ] components/AdaptiveSettings.vue
    Checkboxes для блоков
    Radio buttons для режимов

  - [ ] components/GlobalImport.vue
    Список глобальных категорий
    Кнопка импорта для каждой


5.5 Формы и inputs

  - [ ] components/LoginForm.vue
    Email и password поля
    Валидация
    Кнопки входа/регистрации

  - [ ] components/SetupWizard.vue
    Мультишаговая форма
    Индикатор прогресса
    Навигация шагов

  - [ ] components/PhraseMaker.vue
    Форма с вопросами
    Динамическая генерация полей
    Отправка ответов


5.6 Общие компоненты

  - [ ] components/ButtonRow.vue
    Ряд BadgeButton
    Responsive

  - [ ] components/BadgeButton.vue
    Кнопка с бейджем
    Номер для клавиатурных сокращений

  - [ ] components/LoadingSpinner.vue
    Индикатор загрузки

  - [ ] components/ErrorMessage.vue
    Отображение ошибок

  - [ ] components/Toast.vue
    Уведомления
    Автоскрытие

  - [ ] components/ConfirmDialog.vue
    Диалог подтверждения
    Да/Нет кнопки

  - [ ] components/OfflineIndicator.vue
    Индикатор offline режима


ФАЗА 6: ФУНКЦИОНАЛЬНОСТЬ

6.1 Аутентификация

  - [ ] Login страница
    Email + password
    Обработка ошибок
    Редирект после входа

  - [ ] Logout функция
    Очистка token
    Очистка stores
    Редирект на /login

  - [ ] Auth guard
    Проверка токена
    Редирект неавторизованных


6.2 Онбординг

  - [ ] Setup страница
    Приветствие
    Настройка голоса
    Вопросник

  - [ ] Генерация фраз
    POST /v1/onboarding/phrases
    Создание категорий
    Редирект на /app


6.3 Категории и Statements

  - [ ] CRUD операции категорий
    Создание с диалогом
    Редактирование inline
    Удаление с подтверждением

  - [ ] CRUD операции statements
    Создание через диалог
    Редактирование inline
    Удаление с подтверждением

  - [ ] Навигация категории → statements
    Breadcrumb
    Кнопка назад

  - [ ] Сортировка
    По created
    Default категории первыми

  - [ ] Клавиатурные сокращения
    1-9, A-Z для выбора
    Ctrl+; для фокуса на bank


6.4 Быстрые фразы

  - [ ] Отображение 6 фраз
    ButtonRow
    
  - [ ] Озвучивание по клику
    TTS.say()

  - [ ] Клавиши 1-6
    Быстрое озвучивание

  - [ ] Редактирование (optional)
    Диалог для изменения фраз


6.5 Ввод текста

  - [ ] Три поля ввода (чаты)
    Отдельное состояние для каждого

  - [ ] Переключение чатов
    Ctrl+Up/Down
    Индикатор в header

  - [ ] Кнопка "Сказать"
    Озвучить текущий чат
    Кнопка "Остановить" при воспроизведении

  - [ ] Кнопка "Скачать" (при Яндекс TTS)
    Скачать MP3

  - [ ] Enter для озвучивания
    Ctrl+Enter для новой строки


6.6 Предиктор

  - [ ] Интеграция Яндекс Predictor
    API запрос при вводе
    Дебаунс 300ms

  - [ ] Отображение вариантов
    ButtonRow с 5 вариантами

  - [ ] Выбор варианта
    Клик или клавиши 1-5
    Вставка в текст


6.7 TTS

  - [ ] Web Speech API
    speechSynthesis
    Выбор голоса
    volume, rate, pitch

  - [ ] Яндекс TTS
    POST /v1/tts
    Воспроизведение MP3
    Скачивание файла

  - [ ] Переключение режимов
    Switch в настройках

  - [ ] Загрузка голосов
    GET /v1/voices
    Кеширование

  - [ ] Тестирование голоса
    Кнопка "Тест" в настройках


6.8 Настройки

  - [ ] Голосовые настройки
    Выбор голоса
    Sliders для параметров
    Переключение Яндекс TTS

  - [ ] Адаптивные настройки
    Включение/выключение блоков
    Звук печати
    Озвучивание слова
    Сохранение при озвучивании

  - [ ] Темная тема
    Switch
    Применение к Vuetify
    Сохранение в preferences


6.9 Импорт глобальных категорий

  - [ ] Загрузка списка
    GET /v1/global/categories

  - [ ] Превью statements
    Раскрывающийся список

  - [ ] Импорт
    POST /v1/global/import
    Добавление в user categories


6.10 Realtime обновления

  - [ ] WebSocket подключение
    При авторизации
    Reconnect при разрыве

  - [ ] Обработка изменений
    category_added → добавить в store
    statement_updated → обновить в store
    И т.д.

  - [ ] Long polling fallback
    Если WebSocket недоступен

  - [ ] Индикатор синхронизации
    "Синхронизировано"
    "Синхронизация..."


6.11 Offline режим

  - [ ] Индикатор offline
    В header

  - [ ] Кеширование данных
    IndexedDB или localStorage

  - [ ] Queue изменений
    Сохранять в queue при offline

  - [ ] Background sync
    Отправка при восстановлении сети

  - [ ] Conflict resolution
    Last write wins или UI для разрешения


6.12 Специальные режимы

  - [ ] Reader режим
    Fullscreen
    Последовательное озвучивание
    Навигация

  - [ ] Paste режим в Bank
    Вставка statement в input вместо озвучивания

  - [ ] Show mode для input
    Увеличенный текст
    Минимум отвлекающих элементов

  - [ ] Текстовый редактор категории
    Пакетное редактирование statements


ФАЗА 7: ACCESSIBILITY

7.1 ARIA атрибуты

  - [ ] aria-label на всех кнопках
  
  - [ ] aria-live для TTS статуса
    "Воспроизведение..."
    "Остановлено"

  - [ ] role атрибуты
    role="list" для списков
    role="button" где нужно

  - [ ] aria-expanded для аккордеонов

  - [ ] aria-current для навигации


7.2 Клавиатурная навигация

  - [ ] Tab order оптимизация
    Логический порядок

  - [ ] Visible focus indicators
    Outline для всех интерактивных элементов

  - [ ] Skip navigation
    Ссылка "Перейти к контенту"

  - [ ] Escape для закрытия модалок

  - [ ] Все действия доступны с клавиатуры


7.3 Визуальная доступность

  - [ ] Контрастность WCAG AA
    Проверить все цвета

  - [ ] Размеры touch targets
    Минимум 44x44px

  - [ ] Адаптация под zoom
    До 200% без поломки layout

  - [ ] Высококонтрастный режим (optional)


7.4 Screen readers

  - [ ] Тестирование с NVDA/JAWS
  
  - [ ] Семантическая разметка
    header, main, nav, article

  - [ ] Альтернативный текст
    Для иконок и изображений

  - [ ] Объявления изменений
    aria-live для важных событий


ФАЗА 8: ТЕСТИРОВАНИЕ

8.1 Unit тесты

  - [ ] Тесты для composables
    useAuth
    useCategories
    useStatements
    useTTS

  - [ ] Тесты для stores
    Проверка actions
    Проверка getters

  - [ ] Тесты для utils
    Вспомогательные функции

  - [ ] Настроить Vitest
    vitest.config.ts
    Coverage репорты


8.2 Integration тесты

  - [ ] Тесты API клиента
    Mock axios
    Проверка запросов/ответов

  - [ ] Тесты realtime
    Mock WebSocket


8.3 E2E тесты

  - [ ] Критичные флоу:
    Авторизация
    Создание категории
    Создание statement
    Озвучивание фразы
    Импорт глобальной категории
    Настройка голоса

  - [ ] Настроить Playwright
    playwright.config.ts
    Тестовое окружение


8.4 Визуальные тесты (optional)

  - [ ] Snapshot тесты компонентов


8.5 Тестирование на устройствах

  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Desktop Chrome/Firefox/Safari


ФАЗА 9: ОПТИМИЗАЦИЯ И ПРОИЗВОДИТЕЛЬНОСТЬ

9.1 Bundle optimization

  - [ ] Code splitting
    Lazy loading страниц
    Lazy loading тяжелых компонентов

  - [ ] Tree shaking
    Импорт только нужных модулей Vuetify

  - [ ] Минификация
    Terser для production

  - [ ] Анализ бандла
    nuxt analyze


9.2 Runtime optimization

  - [ ] Виртуализация списков (optional)
    Если категорий/statements > 100

  - [ ] Дебаунсинг
    Predictor запросы
    Поиск

  - [ ] Мемоизация
    Тяжелые вычисления


9.3 Network optimization

  - [ ] HTTP/2 или HTTP/3
  
  - [ ] Сжатие gzip/brotli

  - [ ] CDN для статики (optional)


9.4 Image optimization

  - [ ] WebP формат
  
  - [ ] Lazy loading изображений

  - [ ] Responsive images


9.5 Мониторинг производительности

  - [ ] Lighthouse CI
  
  - [ ] Core Web Vitals
    LCP < 2.5s
    FID < 100ms
    CLS < 0.1


ФАЗА 10: БЕЗОПАСНОСТЬ

10.1 Аутентификация

  - [ ] Secure token storage
    httpOnly cookies (если поддерживается)
    Или encrypted localStorage

  - [ ] Token refresh
    Автоматическое обновление

  - [ ] CSRF защита (если нужно)


10.2 XSS защита

  - [ ] Санитизация пользовательского ввода
    DOMPurify для HTML (если есть)

  - [ ] Content Security Policy
    Заголовки CSP


10.3 Переменные окружения

  - [ ] .env файлы
    .env.local для секретов
    Не коммитить в git

  - [ ] Runtime config в Nuxt
    publicRuntimeConfig
    privateRuntimeConfig


10.4 Rate limiting

  - [ ] Client-side throttling
    Ограничение запросов к API


ФАЗА 11: ДОКУМЕНТАЦИЯ

11.1 Код документация

  - [ ] JSDoc для всех функций
  
  - [ ] README.md
    Описание проекта
    Установка
    Запуск dev
    Сборка production
    Тестирование

  - [ ] CONTRIBUTING.md
    Гайд для контрибьюторов
    Code style
    Pull request процесс

  - [ ] CHANGELOG.md
    История изменений


11.2 Архитектурная документация

  - [ ] Диаграммы
    Архитектура приложения
    Поток данных
    API интеграция

  - [ ] Технические решения
    Почему Nuxt
    Почему Pinia
    Offline стратегия


11.3 Пользовательская документация

  - [ ] Интерактивный туториал
    В приложении

  - [ ] FAQ


ФАЗА 12: CI/CD

12.1 GitHub Actions

  - [ ] Workflow для тестов
    Запуск на каждый PR
    Unit tests
    E2E tests
    Linting

  - [ ] Workflow для деплоя
    Staging на push в develop
    Production на push в main

  - [ ] Автоматический release
    Semantic versioning
    Changelog генерация


12.2 Environments

  - [ ] Development
    local dev server

  - [ ] Staging
    Для тестирования перед production

  - [ ] Production
    Финальная версия


12.3 Мониторинг

  - [ ] Error tracking
    Sentry (optional)

  - [ ] Analytics
    Какое-то решение для аналитики

  - [ ] Performance monitoring
    Lighthouse CI


ФАЗА 13: МИГРАЦИЯ ДАННЫХ

13.1 Экспорт из Firebase

  - [ ] Написать скрипт экспорта
    Экспорт всех пользователей
    Экспорт категорий
    Экспорт statements
    Экспорт quickes

  - [ ] Конвертация формата
    Firebase → новый формат API


13.2 Импорт в новый backend

  - [ ] Тестовая миграция
    На dev окружении

  - [ ] Валидация данных
    Проверка целостности

  - [ ] Production миграция
    Backup перед миграцией
    Постепенная миграция пользователей


13.3 Синхронизация

  - [ ] Dual write (optional)
    Запись в Firebase и новый API
    Для плавного перехода


ФАЗА 14: ДЕПЛОЙ И ЗАПУСК

14.1 Подготовка production

  - [ ] Build оптимизация
    nuxt build
    Проверка размера бандла

  - [ ] Environment variables
    Production значения
    API URLs

  - [ ] SSL сертификаты
    HTTPS обязателен для PWA


14.2 Деплой

  - [ ] Hosting выбор
    Vercel / Netlify / Cloudflare Pages
    Или свой сервер

  - [ ] DNS настройка
    Домен для приложения

  - [ ] Деплой на staging
    Тестирование

  - [ ] Деплой на production
    Постепенный rollout


14.3 Мониторинг после запуска

  - [ ] Отслеживание ошибок
  
  - [ ] Отслеживание производительности

  - [ ] Сбор отзывов пользователей


14.4 Поддержка старой версии

  - [ ] Параллельная работа
    Старая версия на linka-type-pwa
    Новая на linka-type-pwa-v2

  - [ ] Миграция пользователей
    Постепенный перевод

  - [ ] Sunset старой версии
    После полной миграции


ФАЗА 15: POST-LAUNCH

15.1 Мониторинг и фидбек

  - [ ] Сбор метрик
    DAU, MAU
    Retention
    Популярные фичи

  - [ ] Сбор отзывов
    In-app форма
    Email поддержка

  - [ ] Баг-фикс
    Приоритизация по критичности


15.2 Улучшения

  - [ ] A/B тестирование (optional)
    Для новых фич

  - [ ] Performance оптимизация
    На основе real user monitoring

  - [ ] Accessibility улучшения
    На основе фидбека пользователей


15.3 Новые фичи

  - [ ] Поиск по категориям и statements
  
  - [ ] Избранное
  
  - [ ] История использования фраз
  
  - [ ] Статистика использования
  
  - [ ] Экспорт/импорт данных
  
  - [ ] Мультиязычность (i18n)
  
  - [ ] Голосовой ввод
  
  - [ ] Кастомизация интерфейса


ПРИОРИТЕТЫ

P0 (Critical - блокируют запуск):
- Фаза 1: Инициализация
- Фаза 2: API интеграция
- Фаза 3: State management
- Фаза 4: Routing
- Фаза 5: UI компоненты
- Фаза 6: Основная функциональность

P1 (High - важны для MVP):
- Фаза 7: Accessibility
- Фаза 8: Тестирование (базовые)
- Фаза 9: Оптимизация (базовая)
- Фаза 13: Миграция данных
- Фаза 14: Деплой

P2 (Medium - улучшают качество):
- Фаза 10: Безопасность
- Фаза 11: Документация
- Фаза 12: CI/CD
- Фаза 8: Тестирование (полное)

P3 (Low - nice to have):
- Фаза 9: Оптимизация (продвинутая)
- Фаза 15: Новые фичи


ВРЕМЕННАЯ ОЦЕНКА

При работе одного разработчика полный рабочий день:

Фаза 1-2: 1 неделя
Фаза 3-4: 1 неделя
Фаза 5: 2 недели
Фаза 6: 2 недели
Фаза 7: 1 неделя
Фаза 8-9: 1 неделя
Фаза 10-12: 1 неделя
Фаза 13-14: 1 неделя

ИТОГО: ~10 недель (2.5 месяца) для MVP

Полная версия со всеми улучшениями: ~3-4 месяца


КРИТЕРИИ УСПЕХА

Технические:
- [ ] Все тесты проходят
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500kb gzipped
- [ ] Работает offline
- [ ] WCAG AA compliance

Функциональные:
- [ ] Все функции старой версии реализованы
- [ ] API полностью интегрирован
- [ ] Realtime обновления работают
- [ ] Миграция данных успешна

Пользовательские:
- [ ] Положительный фидбек от бета-тестеров
- [ ] Время загрузки < 3 секунд
- [ ] Интуитивный интерфейс
- [ ] Стабильная работа без критичных багов

