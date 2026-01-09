ОПИСАНИЕ СТАРОЙ ВЕРСИИ ПРОЕКТА LINKA TYPE PWA

НАЗНАЧЕНИЕ

LINKa: напиши - PWA приложение для помощи в коммуникации людей с нарушениями речи и языка. Позволяет набирать текст и озвучивать его с помощью синтеза речи, создавать и хранить часто используемые фразы, получать предиктивные подсказки при вводе.

ЦЕЛЕВАЯ АУДИТОРИЯ

Люди с нарушениями речи, языка и коммуникации:
- афазия после инсульта
- БАС
- ДЦП
- другие состояния, ограничивающие устную речь

ОСНОВНАЯ ФУНКЦИОНАЛЬНОСТЬ

1. Голосовой вывод
   - Синтез речи через Web Speech API
   - Альтернативный вывод через Яндекс TTS API
   - Настройка голоса, скорости, высоты, громкости
   - Сохранение аудио в MP3 при использовании Яндекс TTS

2. Банк фраз
   - Двухуровневая иерархия: категории и высказывания
   - Создание, редактирование, удаление фраз
   - Быстрый доступ через клавиатурные сокращения
   - Режим вставки фраз в текущий ввод
   - Случайный выбор фразы из категории
   - Пакетное редактирование через текстовый редактор

3. Быстрые фразы
   - Шесть наиболее используемых фраз
   - Доступ клавишами 1-6
   - Мгновенное озвучивание

4. Предиктор слов
   - Интеграция с Яндекс Predictor API
   - Подсказка до 5 вариантов продолжения текста
   - Выбор предложенного варианта клавишами или кликом

5. Три независимых поля ввода
   - Переключение между тремя чатами Ctrl+Up/Down
   - Сохранение контекста каждого поля

6. Настройки адаптивности
   - Включение/выключение предиктора
   - Включение/выключение быстрых фраз
   - Включение/выключение банка фраз
   - Автосохранение сказанного в банк
   - Звук печати
   - Озвучивание последнего слова

7. Импорт глобальных категорий
   - Загрузка готовых наборов фраз из общего хранилища
   - Просмотр содержимого категории перед импортом

8. Генератор фраз на основе вопросника
   - Первичная настройка через серию вопросов
   - Автоматическое создание персонализированных фраз
   - Интеграция с backend функцией chatbot

9. Обучение
   - Встроенный видеоурок YouTube
   - Список клавиатурных сокращений
   - Режим первого запуска с туториалом

ТЕХНИЧЕСКИЙ СТЕК

Фронтенд:
- Vue 2.7.0
- Vuetify 2.6
- TypeScript 4.5.5
- Vue Class Component + Property Decorator
- Vue CLI 5.0

Backend:
- Firebase Authentication
- Firebase Realtime Database
- Firebase Cloud Functions
- Firebase Hosting

PWA:
- Service Worker через register-service-worker
- Manifest.json с иконками 72-512px
- Offline-first архитектура

Внешние API:
- Яндекс Predictor API для предиктивного ввода
- Яндекс TTS через proxy backend.linka.su
- Firebase Analytics

АРХИТЕКТУРА

Приложение построено как SPA с глобальным состоянием через Firebase Realtime Database:

/users/{uid}/
  inited: boolean
  quickes: string[]
  Category/
    {categoryId}/
      label: string
      created: number
      default: boolean
      statements/
        {statementId}/
          text: string
          categoryId: string
          created: number

/global/
  Category/
    {categoryId}/
      ... аналогичная структура для общих категорий

/factory/
  questions/
    ... данные вопросника

/admins/
  {uid}: boolean

Локальное хранилище (LocalStorage):
- darkTheme
- tutorial
- quickes
- bank
- saveOnSay
- voiceuri
- volume
- rate
- pitch
- yandex

КОМПОНЕНТНАЯ СТРУКТУРА

App.vue
├── Auth.vue (если не авторизован)
├── Setup.vue (если не inited)
│   └── PhraseMaker.vue
└── MainUI.vue (основной интерфейс)
    ├── LHeader.vue
    ├── Tutorial.vue (overlay)
    ├── Settings.vue
    │   ├── VoiceSettings.vue
    │   ├── AdaptiveSettings.vue
    │   └── ImportGlobal.vue
    ├── MainInput.vue
    │   └── Predicator.vue
    ├── Quickes.vue
    │   └── ButtonRow.vue
    └── Bank.vue
        └── LList.vue
            ├── TextCategoryEditor.vue
            └── Reader.vue

ПРОЦЕСС АУТЕНТИФИКАЦИИ И ИНИЦИАЛИЗАЦИИ

1. Загрузка приложения
2. Проверка Firebase Auth состояния
3. Если нет авторизации → Auth.vue
4. После авторизации → проверка /users/{uid}/inited
5. Если false → Setup.vue с вопросником
6. После инициализации → MainUI.vue

КЛАВИАТУРНЫЕ СОКРАЩЕНИЯ

Глобальные:
- Ctrl+Up/Down - переключение чатов
- Ctrl+0 - фокус на быстрых фразах
- Ctrl+; - фокус на банке фраз

В банке фраз:
- 1-9, A-Z - выбор элемента по номеру
- R - случайная фраза из категории
- V - переключение режима вставки
- Esc - назад к категориям

В быстрых фразах:
- 1-6 - озвучить фразу

ОСОБЕННОСТИ РЕАЛИЗАЦИИ

1. TTS Singleton
   - Глобальный экземпляр доступен через Vue.prototype.$tts
   - EventEmitter для событий start/end воспроизведения
   - Переключение между Web Speech API и Яндекс TTS

2. Store класс
   - Инкапсуляция работы с Firebase Realtime Database
   - Методы CRUD для категорий и высказываний
   - Поддержка режима редактирования глобальных категорий для админов

3. LocalMemory класс
   - Обертка над localStorage с типизацией
   - Методы get/set для boolean, number, string

4. Адаптивный UI
   - Поддержка темной темы
   - Оверскролл блокировка для предотвращения bounce эффекта
   - Fullscreen режимы для Reader и Tutorial

5. Обновления PWA
   - Service Worker регистрация через register-service-worker
   - EventEmitter для события updated
   - Диалог предложения перезагрузки при наличии обновления

ДЕПЛОЙ И СБОРКА

Скрипты:
- yarn serve - dev сервер Vue CLI
- yarn build - production сборка
- yarn dev - concurrently сборка + firebase serve
- yarn publish - сборка + firebase deploy hosting
- yarn deploy - полный deploy включая functions

Окружение:
- Firebase проект linka-type-pwa
- Hosting на Firebase Hosting
- Functions на Firebase Cloud Functions Node.js

ВЕРСИОНИРОВАНИЕ

Текущая версия: 0.1.0
Package manager: yarn 1.22.22
Node версия не указана явно

ИЗВЕСТНЫЕ ЗАВИСИМОСТИ

Критичные:
- firebase 7.13.2 (устаревшая версия)
- vue 2.7.0 (legacy)
- vuetify 2.6 (legacy)
- vue-class-component 7.0
- vue-property-decorator 9.1.2

Внешние сервисы:
- https://backend.linka.su/tts - Яндекс TTS proxy
- https://predictor.yandex.net/api/v1/predict.json - предиктор слов
- Firebase Auth/Database/Functions/Hosting


