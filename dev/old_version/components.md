КОМПОНЕНТЫ СТАРОЙ ВЕРСИИ LINKA TYPE PWA

БЛОКИ (BLOCKS)

App.vue
Название: Корневой компонент приложения
Описание: Управляет глобальным состоянием аутентификации и инициализации. Переключает между экранами Auth, Setup и MainUI.
Использование: Корневой компонент, монтируется в #app
Связи: Auth.vue, Setup.vue, MainUI.vue, MobileAppPrompt.vue
Состояние:
- auth: boolean | null - статус авторизации
- inited: boolean | null - статус инициализации
- loading: boolean - индикатор загрузки
События:
- Слушает Firebase onAuthStateChanged
- Слушает Service Worker updated событие
- Подключается к Store root/inited

Auth.vue
Название: Форма аутентификации
Описание: Экран входа, регистрации и восстановления пароля через Firebase Authentication.
Использование: Отображается когда auth === false
Связи: fireapp.ts (Firebase Auth)
События:
- @login - эмитится при успешной авторизации

Setup.vue
Название: Мастер первичной настройки
Описание: Многошаговый визард для новых пользователей с приветствием, проверкой голоса и заполнением вопросника.
Использование: Отображается когда inited === false
Связи: PhraseMaker.vue, VoiceSettings.vue, Store.ts
События:
- @inited - эмитится после завершения настройки

MainUI.vue
Название: Основной интерфейс приложения
Описание: Контейнер главного экрана, объединяющий header, input, quickes и bank. Управляет состоянием воспроизведения TTS и режимами отображения.
Использование: Отображается после авторизации и инициализации
Связи: LHeader.vue, Settings.vue, Tutorial.vue, MainInput.vue, Quickes.vue, Bank.vue
Состояние:
- textForSpeak: string[] - массив из 3 строк для разных чатов
- showMode: boolean - режим отображения
- settingsMode: boolean - режим настроек
- chat: number - активный чат 0-2
- playing: boolean - статус воспроизведения TTS
- tutorialMode: boolean - отображение туториала
- isQuickes: boolean - отображение быстрых фраз
- isBank: boolean - отображение банка
Методы:
- say(download: boolean) - озвучить текущий чат
- paste(text: string) - вставить текст в активный чат
- windowInput(event: KeyboardEvent) - обработка Ctrl+Up/Down для переключения чатов

LHeader.vue
Название: Верхняя панель инструментов
Описание: Toolbar с кнопками туториала, предиктора, шпаргалки сокращений, переключателя чатов и настроек.
Использование: Постоянно отображается в MainUI
Связи: ShortcutList.vue
События:
- @show - переключение showMode
- @settings - переключение settingsMode
- @chat - переключение активного чата
- @tutorial - открытие туториала

Bank.vue
Название: Банк фраз
Описание: Иерархическое хранилище категорий и высказываний с CRUD операциями, клавиатурными сокращениями и режимами вставки/чтения.
Использование: <bank @paste="paste" />
Связи: LList.vue, Store.ts, TTS.ts
Состояние:
- categories: Category[] - список категорий
- statements: Statement[] - список высказываний текущей категории
- cid: string | null - ID выбранной категории
- isPaste: boolean - режим вставки
- globalEdit: boolean - режим редактирования глобальных категорий для админов
Методы:
- cselect(category) - выбор категории
- sselect(statement) - выбор высказывания
- cadd() - создание категории
- sadd() - создание высказывания
- deleteItem(what, item) - удаление элемента
- editItem(what, item) - редактирование элемента
- refillCategory(rows) - пакетная замена высказываний
- srandom() - случайное высказывание
События:
- @paste - эмитит текст высказывания для вставки
Клавиатурные сокращения:
- 1-9, A-Z - выбор элемента
- R - случайное высказывание
- V - переключение режима вставки
- Esc - назад
- Ctrl+; - фокус

Quickes.vue
Название: Быстрые фразы
Описание: Блок из 6 наиболее используемых фраз с быстрым доступом.
Использование: <quickes />
Связи: ButtonRow.vue, Store.ts, TTS.ts
Состояние:
- phrases: string[6] - массив быстрых фраз
Методы:
- say(phrase) - озвучить фразу
- load() - загрузить фразы из Store
- create(ref) - создать дефолтные фразы
Клавиатурные сокращения:
- 1-6 - озвучить фразу по номеру
- Ctrl+0 - фокус

Settings.vue
Название: Экран настроек
Описание: Табовая панель с настройками голоса, адаптивного интерфейса и импорта глобальных категорий.
Использование: <settings />
Связи: VoiceSettings.vue, AdaptiveSettings.vue, ImportGlobal.vue
Табы:
- Голос - VoiceSettings
- Адаптивность - AdaptiveSettings
- Импорт - ImportGlobal

Tutorial.vue
Название: Обучающий оверлей
Описание: Простой оверлей с встроенным YouTube видео для ознакомления с приложением.
Использование: <tutorial @close="tutorialMode=false" />
События:
- @close - закрытие туториала

ShortcutList.vue
Название: Список клавиатурных сокращений
Описание: Оверлей со списком всех доступных горячих клавиш, сгруппированных по функциям.
Использование: <shortcut-list @quit="close" />
События:
- @quit - закрытие списка


КОМПОНЕНТЫ (COMPONENTS)

MainInput.vue
Название: Основное поле ввода
Описание: Текстовое поле с опциональным полноэкранным режимом, интеграцией предиктора и звуковым фидбеком.
Использование: <main-input v-model="text" @say="say" :showMode="showMode" />
Props:
- value: string - текст
- showMode: boolean - полноэкранный режим
Связи: Predicator.vue
Функции:
- Озвучивание последнего слова при настройке
- Звук печати при настройке
- Интеграция с предиктором
События:
- @input - изменение текста
- @say - нажатие Enter
- @showMode - переключение полноэкранного режима

Predicator.vue
Название: Предиктор слов
Описание: Виджет предсказания слов через Яндекс Predictor API с выбором через клавиши 1-5.
Использование: <predicator v-model="text" :register="register" />
Props:
- value: string - текущий текст
- register: boolean | null - регистр для цветовой индикации
Связи: ButtonRow.vue, Яндекс Predictor API
Состояние:
- words: string[] - варианты продолжения
- pos: number - позиция вставки
Методы:
- onText(value) - запрос к API при изменении текста
- shortcut(index) - выбор варианта
API:
- GET https://predictor.yandex.net/api/v1/predict.json/complete?key={key}&q={text}&lang=ru&limit=5

ButtonRow.vue
Название: Ряд кнопок с номерами
Описание: Flex контейнер для рендеринга массива BadgeButton компонентов в одну строку.
Использование: <button-row :items="items" @buttonclick="handler" />
Props:
- items: string[] - массив текстов для кнопок
- color: string - цвет кнопок
- focus: boolean - автофокус на первой кнопке
События:
- @buttonclick(text, index) - клик по кнопке

BadgeButton.vue
Название: Кнопка с номером
Описание: Обертка Vuetify кнопки с числовым бейджем для отображения порядкового номера.
Использование: <badge-button :number="1" :text="text" @click="handler" />
Props:
- number: number - номер для бейджа
- text: string - текст кнопки
- color: string - цвет кнопки

LList.vue
Название: Универсальный список
Описание: Переиспользуемый компонент для отображения категорий или высказываний с возможностью редактирования, удаления и специальных режимов.
Использование: <l-list :items="items" type="category" :dkey="label" @select="onSelect" />
Props:
- items: (Category | Statement)[] - элементы списка
- type: "category" | "statement" - тип элементов
- dkey: string - ключ для отображения
- title: string - заголовок списка
- isPaste: boolean - режим вставки
Связи: Reader.vue, TextCategoryEditor.vue
События:
- @select(item) - выбор элемента
- @delete(item) - удаление элемента
- @edit(item) - редактирование элемента
- @add - добавление нового элемента
- @back - возврат назад
- @save(rows) - сохранение через текстовый редактор
- @isPaste - переключение режима вставки
- @random - случайный выбор
Кнопки:
- Добавить
- Назад (только для statements)
- Вставка (только для statements)
- Читать (только для statements)
- Текстовый редактор (только для statements)
- Случайное (только для statements)

Reader.vue
Название: Полноэкранный режим чтения
Описание: Последовательное озвучивание высказываний из категории с навигацией и управлением воспроизведением.
Использование: <reader :statements="statements" @close="close" />
Props:
- statements: Statement[] - список высказываний
Состояние:
- currentIndex: number - текущее высказывание
- playing: boolean - статус воспроизведения
Методы:
- next() - следующее высказывание
- prev() - предыдущее высказывание
- play() - воспроизвести текущее
События:
- @close - закрытие reader
Клавиатурные сокращения:
- Space - play/pause
- ArrowRight - следующее
- ArrowLeft - предыдущее
- Esc - закрыть

TextCategoryEditor.vue
Название: Текстовый редактор категории
Описание: Textarea для быстрой замены всех высказываний в категории многострочным текстом.
Использование: <text-category-editor :statements="statements" @save="onSave" />
Props:
- statements: Statement[] - текущие высказывания
События:
- @save(rows: string[]) - сохранение новых высказываний

VoiceSettings.vue
Название: Настройки голоса
Описание: Контролы выбора голоса, регулировки громкости, скорости, высоты и переключения на Яндекс TTS.
Использование: <voice-settings />
Связи: TTS.ts
Контролы:
- Select голоса (offlineVoices или yandexVoices)
- Slider громкости (0-1)
- Slider скорости (0.1-2)
- Slider высоты (0-2)
- Switch Яндекс TTS
- Кнопка тестирования

AdaptiveSettings.vue
Название: Настройки адаптивности
Описание: Чекбоксы и радио-кнопки для конфигурации опциональных блоков интерфейса и поведения печати.
Использование: <adaptive-settings />
Связи: LocalMemory.ts
Настройки:
- Предиктор (boolean)
- Быстрые фразы (boolean)
- Банк фраз (boolean)
- Сохранять при озвучивании (boolean)
- Звук печати (boolean)
- Озвучивать последнее слово (boolean)

ImportGlobal.vue
Название: Импорт глобальных категорий
Описание: Загрузка готовых наборов фраз из общего хранилища с предварительным просмотром.
Использование: <import-global />
Связи: Store.ts, LList.vue
Состояние:
- globalCategories: Category[] - список глобальных категорий
- selectedCategory: Category | null - выбранная для просмотра
Методы:
- loadGlobalCategories() - загрузка из /global/Category
- import(categoryId) - копирование в /users/{uid}/Category

PhraseMaker.vue
Название: Генератор фраз по вопроснику
Описание: Форма с персональными вопросами для генерации стартовых фраз через backend функцию.
Использование: <phrase-maker @done="onDone" />
Связи: Store.factory, Cloud Function chatbot
Процесс:
1. Загрузка вопросов из /factory/questions
2. Заполнение ответов пользователем
3. Отправка на backend
4. Создание категорий и высказываний из ответа

Overlay.vue
Название: Базовый оверлей
Описание: Затемненный оверлей для модальных окон с событием закрытия по клику вне области.
Использование: <overlay @quit="close"><content/></overlay>
События:
- @quit - клик вне контента

MobileAppPrompt.vue
Название: Промо нативного приложения
Описание: Баннер предложения установить PWA как приложение на домашний экран.
Использование: <mobile-app-prompt />
Поведение:
- Отображается на мобильных устройствах
- Скрывается после установки или закрытия


БИБЛИОТЕКИ (LIB)

Store.ts
Название: Класс управления хранилищем
Описание: Инкапсуляция работы с Firebase Realtime Database для операций CRUD над категориями и высказываниями.
Использование: const store = new Store()
Методы:
- createCategory(title: string, globalEdit: boolean): Promise<string>
- createStatement(cid: string, text: string, globalEdit: boolean): Promise<string>
- editCategory(item: Category, newText: string, globalEdit: boolean): Promise<void>
- editStatement(item: Statement, newText: string, globalEdit: boolean): Promise<void>
- deleteItem(what: "category" | "statement", cid: string | null, id: string, globalEdit: boolean)
- getCategory(id: string, globalEdit: boolean): firebase.database.Reference
- getStatements(cid: string, globalEdit: boolean): firebase.database.Reference
- isAdmin(): Promise<boolean>
- static sortItems<T>(items: T[]): T[]
Свойства:
- root: firebase.database.Reference - /users/{uid}
- global: firebase.database.Reference - /global
- factory: firebase.database.Reference - /factory

TTS.ts
Название: Singleton Text-to-Speech
Описание: Глобальный сервис синтеза речи с поддержкой Web Speech API и Яндекс TTS.
Использование: TTS.instance.say("текст")
Методы:
- say(text: string, download: boolean): void
- stop(): void
- setVoice(uri: string): void
- yandexSay(text: string, params: {speaker, speed}, download: boolean): Promise<void>
Свойства:
- offlineVoices: SpeechSynthesisVoice[]
- yandexVoices: YandexVoice[]
- selectedVoice: SpeechSynthesisVoice | YandexVoice
- volume: number
- rate: number
- pitch: number
- yandex: boolean
- events: EventEmitter - emit: start, end, yandex-voices-updated
API:
- POST https://backend.linka.su/tts {text, voice} -> audio/mp3
- GET https://backend.linka.su/voices -> YandexVoice[]

LocalMemory.ts
Название: Обертка localStorage
Описание: Типобезопасный доступ к localStorage с методами для разных типов данных.
Использование: LocalMemory.instance.getBoolean("key", defaultValue)
Методы:
- getBoolean(key: string, defaultValue: boolean): boolean
- setBoolean(key: string, value: boolean): void
- getNumber(key: string, defaultValue: number): number
- setNumber(key: string, value: number): void
- getString(key: string, defaultValue: string): string
- setString(key: string, value: string): void

fireapp.ts
Название: Конфигурация Firebase
Описание: Инициализация Firebase приложения с конфигурацией проекта.
Использование: import fireapp from "./lib/fireapp"
Экспорт: firebase.app.App

Category.ts
Название: Интерфейс Category
Описание: Тип данных для категории фраз.
Поля:
- id: string
- label: string
- created: number
- default: boolean

Statement.ts
Название: Интерфейс Statement
Описание: Тип данных для высказывания.
Поля:
- id: string
- text: string
- categoryId: string
- created: number

StoreItem.ts
Название: Базовый интерфейс элемента хранилища
Описание: Общие поля для Category и Statement.
Поля:
- id: string
- created: number


ПЛАГИНЫ (PLUGINS)

vuetify.ts
Название: Конфигурация Vuetify
Описание: Инициализация Vuetify с цветовой темой проекта.
Тема:
- primary: #197377
- secondary: #bed64f
- accent: #fbcc30

webfontloader.ts
Название: Загрузчик шрифтов
Описание: Ленивая загрузка Roboto шрифтов через WebFont Loader.


КОНСТАНТЫ

constants.ts
Название: Глобальные константы
Описание: Статические значения используемые в приложении.
Константы:
- QWERTY: string[] - раскладка для маппинга клавиш на номера


ГЛОБАЛЬНЫЕ ОБЪЕКТЫ

Vue.prototype.$tts: TTS
Глобальный доступ к TTS сервису из любого компонента.

Vue.prototype.$dialog: VuetifyDialog
Глобальный доступ к диалогам через vuetify-dialog плагин.
Методы:
- confirm(options): Promise<boolean>
- prompt(options): Promise<string | undefined>
- error(options): Promise<void>


СВЯЗИ МЕЖДУ КОМПОНЕНТАМИ

App.vue
  └─> Auth.vue
  └─> Setup.vue
      └─> PhraseMaker.vue
      └─> VoiceSettings.vue
  └─> MainUI.vue
      ├─> LHeader.vue
      │   └─> ShortcutList.vue
      ├─> Tutorial.vue
      ├─> Settings.vue
      │   ├─> VoiceSettings.vue
      │   ├─> AdaptiveSettings.vue
      │   └─> ImportGlobal.vue
      │       └─> LList.vue
      ├─> MainInput.vue
      │   └─> Predicator.vue
      │       └─> ButtonRow.vue
      │           └─> BadgeButton.vue
      ├─> Quickes.vue
      │   └─> ButtonRow.vue
      └─> Bank.vue
          └─> LList.vue
              ├─> Reader.vue
              └─> TextCategoryEditor.vue
  └─> MobileAppPrompt.vue

Все компоненты взаимодействуют с:
- Store.ts для работы с данными
- TTS.ts для озвучивания
- LocalMemory.ts для настроек


