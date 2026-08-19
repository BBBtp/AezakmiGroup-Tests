# Архитектура автоматизации CRM

## Назначение

Проект автоматизирует ручные тест-кейсы из DoQA, запускает Playwright-проверки и возвращает результаты в DoQA. Связь ручного кейса с автотестом выполняется через Allure ID, равный ID кейса в DoQA.

## Слои

```mermaid
flowchart TD
  DoQA[DoQA: кейсы и статусы] --> MCP[MCP DoQA client]
  MCP --> Queue[Очередь кандидатов]
  Queue --> Tests[Business tests]
  Tests --> Fixtures[Fixtures]
  Tests --> Support[Domain lifecycle and integration flows]
  Tests --> Modules[Domain modules]
  Fixtures --> Modules
  Fixtures --> Support
  Modules --> Pages[Pages: domain flows]
  Pages --> Components[Components: local UI behavior]
  Pages --> UI[framework/ui]
  Components --> UI
  UI --> Locators[Domain locator catalogs]
  UI --> CRM[CRM web application]
  Fixtures --> Lifecycle[Cleanup registry, sessions and browser diagnostics]
  Tests --> Allure[Allure raw results]
  Allure --> Upload[POST /api/autotests/report]
  Upload --> DoQA
  DoQA --> Triage[Failed run triage]
  Triage -->|confirmed product| Draft[Read-only bug draft]
  Allure --> Evidence[Reviewed screenshot/video and sanitized context]
  Evidence --> Draft
  Draft --> Manual[Manual review and create]
  Manual --> Defect[DoQA defect]
  Defect --> Tracker[Yandex Tracker]
```

### `tests/`

Сценарии smoke/regression содержат бизнес-шаги и проверки, но не создают локаторы и не управляют
raw `Page`, BrowserContext, browser events или local storage напрямую. UI доступен только через
публичный API `@modules/*`, а технические сессии и диагностика — через fixtures. Каждый
автоматизированный тест содержит ровно один уникальный числовой
`allure.allureId('<DoQA case id>')`.

### `modules/`

Публичная граница домена. Только этот слой экспортирует страницы и публичные компоненты в тесты
и fixtures. Внутреннюю структуру `pages/` и `components/` можно менять без массового изменения
сценариев.

### `pages/` и `components/`

Page Objects собирают пользовательские и доменные потоки, компоненты владеют локальными
действиями и структурой своего блока. Они наследуют `UiObject` и получают единый API:
`locate`, `actions`, `expectations`. Вызов raw Playwright locator API и диагностического logger
за пределами `framework/ui` запрещён архитектурной проверкой.
Statistics period flow расположен в `StatisticsOverviewComponent`: компонент владеет typed
вкладками Week/Month/3 months, проверяет активное состояние и наблюдаемое изменение графика, а
`StatisticsPage` предоставляет тестам тонкий бизнес-API.
Subscriptions использует отдельный доменный модуль для `/subscriptions`:
`SubscriptionsFiltersComponent` владеет FilterPopover приложения, применением Select All,
переходом к частичному выбору и проверкой итогового чипа через устойчивые test ID, а
`SubscriptionsMetricsComponent` связывает карточки и таблицу с контролируемым API-контрактом.
Домен Niches разделён по фактическим маршрутам интерфейса: `NichesOverviewComponent` владеет
страницей `Niche list`, а `SortedAppsOverviewComponent` — страницей `Sorted by apps` и её
контролами. Создание ASO Mobile расположено в `AsoMobileCreateComponent`: компонент владеет
формой, loading/error/success состояниями и повторным открытием после отмены SSE.
Top-3000 следует той же границе: `TopKeywordsOverviewComponent` владеет фильтрами, региональными
вкладками, таблицей, пагинацией, переводом и модальным окном Top Apps, а `TopKeywordsPage`
экспортирует сценариям только бизнес-операции. Все статические и динамические `data-testid`
раздела собраны в едином контракте `topKeywordsTestIds`.
Push разделён на два компонента за единым `PushPage`: `PushBotsComponent` владеет списком,
периодами, карточкой кампании и защищёнными действиями, а `OutKeywordsComponent` — периодами,
фильтрами, настройками и состояниями списка исключённых ключей. API-контракты и безопасные
заглушки обоих экранов находятся в `tests/support/push`.
Reviews and ratings опубликован через `@modules/reviews`: `ReviewsOverviewComponent` владеет
вкладками Reviews/Ratings, периодами, таблицей, пагинацией и системными состояниями, а
`tests/support/reviews` хранит контракт списка отзывов.
Product опубликован через единый `ProductPage`: `AppsComponent` владеет периодами, представлениями,
архивом и карточкой приложения, а `AbTestsComponent` — фильтрами, списком A/B-тестов, пагинацией
и безопасным входом в Create test. Контролируемые ответы Apps и A/B tests находятся в
`tests/support/product`.
Settings/Staff-сценарии Parameters и списка Employees проходят через `AdministrationPage` и
`AdministrationComponent`; редактирование, удаление и добавление параметров проверяются через
отмену диалога и отсутствие незапланированной API-мутации.
Read-only smoke-проверки новых разделов используют `ReadOnlySectionsPage`: навигационные данные и
устойчивые accessible controls собраны в `readOnlySectionLocators`, а общий компонент проверяет
основной контент и технические значения без дублирования Page Objects для каждого раздела.

### `locators/`

Доменные типизированные контракты устойчивых `data-testid`, доступных имён и динамических
builder-функций. Один UI-домен не должен собирать один и тот же идентификатор в нескольких
компонентах. Каталоги `auth`, `employees`, `navigation`, `kpi`, `kpi-settings` и `common` являются
единственными источниками статических и динамических test ID/CSS/accessible-name контрактов.
Компоненты получают готовые значения из контракта и создают `Locator` через `LocatorFactory`.
Приоритет: `data-testid`, затем role/label, затем документированный устойчивый CSS.

### `framework/ui/`

Единый адаптер над Playwright:

- `LocatorFactory` создаёт локаторы из Page или корневого Locator;
- `UiActions` выполняет действия с диагностическими вложениями;
- `UiExpectations` ждёт и логирует наблюдаемое состояние: видимость, доступность, количество,
  текст и URL;
- `UiObject` предоставляет эти зависимости каждой странице и компоненту.

Изменение логирования, ожиданий или политики локаторов выполняется в одном месте.
Архитектурная проверка не позволяет страницам и компонентам возвращаться к строковым test ID/CSS
и raw `expect()`. Неиспользуемые speculative UI-компоненты не хранятся «на будущее»: общий
компонент добавляется, когда у него появляется реальный потребитель.

### `framework/network/`

`NetworkController` — единая точка для навигации, ожидания API-ответов, сбора запросов и
одноразовых и последовательных route-моков. Бизнес-тесты не вызывают `page.goto`, `page.route`,
`page.waitForRequest` или `page.waitForResponse` напрямую. Благодаря этому HTTP-диагностика и
политика моков меняются централизованно. `waitForResponseWhile` атомарно запускает ожидание ответа
до действия, которое инициирует запрос, и исключает гонку между навигацией и API. Request capture автоматически регистрирует снятие
listener в cleanup registry; ручной `stop()` выполняет раннюю уборку.
SSE-сценарии используют `fulfillNextSse` для терминальных `result`/`error` событий и `holdNext`
для управляемого незавершённого соединения. Удерживаемый route всегда снимается через cleanup,
а `waitForRequestFailedWhile` подтверждает реальную отмену запроса при закрытии модалки.

### `framework/playwright/`

`ManagedTestSession` даёт дополнительному BrowserContext только разрешённые операции:
навигацию, URL-ожидания, reload и управляемое изменение storage. `TestSessionFactory` создаёт
такие сессии и регистрирует закрытие контекста до возврата управления тесту.
`BrowserDiagnostics` собирает console errors через `ConsoleErrorCapture`; listener всегда
снимается вручную или при fixture teardown.

### `framework/data/`

`TestDataFactory` создаёт уникальные метки и выбирает свободные значения из заданного диапазона.
Сценарии не используют `Date.now`, случайные числа или ручной поиск свободного значения.

### `fixtures/`

Разделены по ответственности: `core-fixtures` владеет пользователями, cleanup, фабрикой данных и
сессиями; `ui-fixtures` создаёт публичные domain objects, network и browser diagnostics;
`domain-fixtures` собирает бизнес-lifecycle. Fixture `cleanup` регистрирует компенсирующие
операции до мутации и выполняет их в LIFO-порядке даже при падении теста. Явная успешная уборка
вызывает `runNow`; если она упала, задача остаётся активной и повторяется в fixture teardown.

`tests/setup/auth.setup.ts` создаёт admin storage state только для авторизованных проектов.
Проверки логина и контроля доступа запускаются отдельными проектами без этой зависимости.

### `tests/support/<domain>/`

Общие API-контракты и доменные lifecycle-сервисы. `AuthSessionLifecycle` инкапсулирует anonymous,
stored, expired и persistent remember-me сессии, включая временные каталоги и гарантированный
cleanup. `KpiSettingsLifecycle` выбирает свободные данные,
регистрирует компенсацию до создания и возвращает `ManagedKpiSettingsAction`. Управляемая сущность
инкапсулирует edit, negative API flow и раннее удаление; если тест падает, fixture выполняет
оставшийся cleanup автоматически.

### `mcp/`

`doqa-client.mjs` работает с API DoQA: ищет кандидатов, читает кейсы, переводит кейс в работу,
загружает отчёты и формирует read-only черновики дефектов элементов прогона. PATCH использует ETag той же версии, которая была прочитана и
проанализирована; при `412 Precondition Failed` клиент повторно читает кейс и не перезаписывает
чужое изменение. Bug-draft flow читает run element, выполняет дедупликацию активных багов по
маркеру `[AUTO][TC-<id>]` и возвращает готовые поля без внешней записи. `server.mjs` предоставляет операции как MCP-инструменты с read/write
аннотациями и структурированным результатом. Секрет отчёта берётся только из окружения, а путь
ограничен доверенным каталогом.

### `scripts/`

`doqa-run.mjs` запускает Playwright, собирает свежий Allure-архив и отправляет его в DoQA.
`allure-report.mjs` оставляет завершённые passed/failed/broken/skipped результаты с одним
уникальным числовым `ALLURE_ID` и их вложения. Retry одного теста определяется по Allure
`historyId`/`testCaseId`/`fullName`, и в отчёт попадает только последняя попытка. Одинаковый ID у
разных тестовых историй, пустой архив и некорректный preflight блокируют публикацию.
KPI read-only сценарии используют единый контракт preflight данных из `tests/support/kpi`.
Навигация KPI ждёт `commit`, целевой URL и наблюдаемое состояние `main-content` или
`error-content`; событие `domcontentloaded` не используется как признак готовности SPA.
TC-902 остаётся канонической проверкой непустого `full_stats`; зависимые от менеджеров, подиума,
претендентов или `start_score` кейсы помечаются `skipped` с сигналом `KPI_DATA_UNAVAILABLE`, если
стенд не содержит требуемого набора. Это сохраняет красный сигнал о неготовом окружении, но не
размножает одно отсутствие данных на каскад UI/API-падений.
После загрузки проверяются `counts.tests`, `progress`, элементы run и соответствие Allure ID
кейсам DoQA. Ненулевой exit code Playwright остаётся ненулевым для CI, но больше не скрывает
результат от DoQA. `bug-drafts.mjs` читает failed/broken Allure results, получает ожидаемый
бизнес-результат из DoQA, исключает stdout/stderr/trace, редактирует чувствительные строки в
error-context и создаёт один `bug.md`, `draft.json`, screenshot/video на Allure ID по результату
последней retry-попытки для ручного оформления.
Падение с сигналом `KPI_DATA_UNAVAILABLE` классифицируется как environment precondition,
показывается в README artifact и исключается из продуктовых bug drafts без обращения к DoQA за
кейсом или поиском дефекта.
Визуальные вложения требуют просмотра перед загрузкой.

### `.agents/skills/`

Репозиторий хранит project-scoped Codex skills вместе с кодом. `crm-automate-doqa-case`
маршрутизирует реализацию кейса через locator contracts, modules, fixtures, lifecycle и проверки
DoQA. `check-project-skills.mjs` проверяет frontmatter, UI metadata, ссылки на references и
отсутствие шаблонных TODO при каждом `npm run quality`.

## Статусы

```text
Подлежит автоматизации -> Ревью/в работе -> автотест создан
                                      -> отчёт загружен -> Автоматизирован
```

Ошибки после прогона разделяются на дефекты продукта, проблемы окружения и ошибки самого автотеста.

## Источники истины

- DoQA — описание кейса, его статус и связь с автотестом.
- Код теста — исполняемая реализация проверки.
- Allure — результат конкретного запуска.
- `docs/WORKFLOW.md` — порядок действий агента.
- `docs/LOGGING.md` — требования к диагностике.
