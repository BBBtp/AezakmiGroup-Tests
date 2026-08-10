# CRM Aezakmi E2E tests

Playwright-проект для проверки CRM и синхронизации результатов автоматизации с DoQA.

## Требования

- Node.js 20+
- npm
- доступ к тестовому окружению CRM
- отдельные тестовые пользователи

## Быстрый старт

```bash
npm ci
npx playwright install chromium
cp .env.example .env
npm run quality
npm run test:smoke
```

Заполните `.env` локальными значениями. Файл `.env`, сохранённые сессии и отчёты не должны попадать в Git.

## Основные команды

```bash
npm run quality          # обязательные статические проверки
npm run test:unit        # unit-тесты инфраструктуры
npm run test:smoke       # 8 критических пользовательских сценариев
npm run test:regression  # подробный regression-набор
npm run test:auth        # тесты авторизации и сессии
npm run doqa:run -- --project=regression --workers=1
npm run doqa:publish     # публикация уже собранного Allure-каталога
npm run bug:drafts      # read-only черновики по failed/broken Allure-результатам
```

`doqa:run` запускает тесты и публикует свежие Allure results в DoQA. Passed, failed, broken и
skipped результаты с единственным числовым `ALLURE_ID` попадают в run; setup и записи без
корректного ID исключаются. Созданный run проверяется по количеству тестов, progress, элементам и
связям с DoQA ID. Красный результат публикуется, но команда сохраняет ненулевой exit code для CI.
Не используйте её для исследовательских локальных прогонов.

MCP не принимает токены в аргументах инструментов. Для публикации он читает
`DOQA_AUTOTEST_TOKEN` из окружения и разрешает выбирать только имя файла внутри
`DOQA_REPORT_DIR`. `doqa_improve_case` работает как dry-run, пока явно не передан `apply: true`.
После failed/broken run инструмент `doqa_analyze_run_failures` выполняет read-only triage.
`doqa_prepare_product_bug_draft` формирует готовые поля бага только после подтверждения
классификации `product` и проверяет активные дубли `[AUTO][TC-<id>]`. Он ничего не записывает.
Команда `bug:drafts` создаёт каталог `bug-drafts/TC-<id>` с `bug.md`, `draft.json`, screenshot,
video и очищенным error-context. stdout/stderr и trace в пакет не попадают; screenshot/video
отмечаются для визуальной проверки перед ручной загрузкой. Известные предусловия окружения,
включая пустой KPI-набор с сигналом `KPI_DATA_UNAVAILABLE`, остаются в индексе artifact, но не
создают продуктовый черновик.

## Архитектура

- `tests/smoke` — короткий набор критических проверок.
- `tests/regression` — подробные бизнес-сценарии.
- `tests/setup` — создание storage state только для авторизованных проектов.
- `tests/support` — API-контракты, lifecycle тестовых данных и общие domain helpers.
- `fixtures` — послойная композиция core, UI и domain lifecycle.
- `modules` — публичная граница домена для тестов и fixtures.
- `pages` — композиция страниц.
- `components` — локаторы и действия отдельных UI-блоков.
- `locators` — типизированные доменные контракты статических и динамических идентификаторов.
- `framework/ui` — единая фабрика локаторов, действия и ожидания с диагностикой.
- `framework/network` — навигация, API-ожидания, request capture и одноразовые моки.
- `framework/data` — фабрика уникальных и свободных тестовых значений.
- `framework/lifecycle` — LIFO-уборщики, выполняемые даже после падения теста.
- `framework/playwright` — дополнительные сессии и автоматически очищаемая browser-диагностика.
- `mcp` — интеграция с DoQA.
- `scripts` — проверки репозитория и управляемые workflow.
- `.agents/skills/crm-automate-doqa-case` — проектный Codex skill для реализации кейса из DoQA.

Подробности: [архитектура](docs/ARCHITECTURE.md), [workflow](docs/WORKFLOW.md), [логирование](docs/LOGGING.md).

## Добавление теста

1. Получите полный кейс и ID из DoQA.
2. Выберите smoke или regression по бизнес-критичности.
3. Используйте публичный экспорт из `modules`, не импортируйте `pages/components` напрямую.
4. Добавьте ровно один уникальный `allure.allureId(...)`.
5. Для мутаций используйте domain lifecycle fixture, например `kpiSettingsLifecycle`: он
   зарегистрирует cleanup до создания и вернёт управляемую сущность.
6. Запустите адресный тест, затем `npm run quality`.

Авторизованные `smoke` и `regression` зависят от setup-project. Проекты `smoke-auth` и `regression-auth` запускаются без сохранённой admin-сессии, поэтому проверки логина и контроля доступа не зависят от успешного setup.

Правила, обязательные для разработчиков и агентов, находятся в [AGENTS.md](AGENTS.md).
Для создания или изменения автотеста из DoQA используйте проектный skill
`$crm-automate-doqa-case`; его структура и метаданные проверяются внутри `npm run quality`.

## CI

GitHub Actions выполняет статический quality gate для pull request. После push в `main` дополнительно запускается smoke-набор.

Каждую ночь в 01:00 МСК workflow `Nightly regression` запускает три независимые read-only группы
параллельно, затем отдельно выполняет сценарии с общими KPI Settings. Каждый job сохраняет
Allure, blob, HTML, JSON, JUnit, traces, screenshots и videos на 14 дней. Тест, прошедший только
после retry, отмечается как flaky и делает соответствующую CI job красной.
После завершения regression отдельный read-only job сохраняет artifact `bug-drafts-<run-id>`:
для каждого failed/broken теста в нём находятся готовые поля формы и диагностические вложения.

Nightly-прогон сам по себе ничего не публикует в DoQA. Для публикации запустите workflow вручную
с параметром `publish_to_doqa=true`. Job публикации использует GitHub Environment
`doqa-production`; настройте для него required reviewers. Read-only job черновиков использует
repository secrets `DOQA_ENDPOINT`, `DOQA_SPACE_ID`, опционально `DOQA_PROJECT_ID` и
`DOQA_TOKEN`. Для environment `doqa-production` дополнительно нужен:

- `DOQA_AUTOTEST_TOKEN`.

Публикация начинается после завершения всех regression-групп, включая завершённые failed jobs,
объединяет их Allure results и повторно выполняет preflight и post-upload verification.

Для smoke job настройте repository secrets:

- `E2E_BASE_URL`
- `E2E_ADMIN_USERNAME`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_USER_USERNAME`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`

Playwright/Allure-артефакты smoke-прогона сохраняются на 14 дней. DoQA-токены CI quality workflow не получает и отчёты во внешнюю систему не публикует.
