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
npm run test:regression:statistics # фильтры и периоды Statistics
npm run test:regression:top-keywords # фильтры, таблица и перевод Top-3000
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
MCP также предоставляет `doqa_list_checklists`, `doqa_get_checklist`,
`doqa_create_checklist` и `doqa_update_checklist`. Обновление чек-листа сначала читает его
`ETag/versionUuid`, допускает только изменение метаданных и добавление новых пунктов, затем
перечитывает результат; существующие пункты не заменяются и не удаляются.
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

Каждую ночь в 01:00 МСК workflow `Nightly regression` автоматически обнаруживает все сценарии
из `tests/regression` и распределяет read-only/auth часть по трём shard jobs на self-hosted
runner'ах с labels `Linux`, `X64`, `crm`, `playwright`. После них один runner последовательно
выполняет сценарии с общими KPI Settings. Тест, прошедший только после retry, отмечается как flaky
и делает соответствующую CI job красной.

Каждый shard сохраняет raw Allure results. Отдельный job объединяет результаты всех трёх shards
и KPI Settings, генерирует HTML и сохраняет artifact `allure-report-<run-id>` на 14 дней. При
ошибке дополнительно сохраняются blob report, traces, screenshots и videos соответствующего job.
После завершения regression отдельный read-only job сохраняет artifact `bug-drafts-<run-id>`:
для каждого failed/broken теста в нём находятся готовые поля формы и диагностические вложения.

### Запуск из DoQA через GitLab bridge

DoQA нативно запускает GitLab pipeline, поэтому `.gitlab-ci.yml` используется как relay: он
вызывает `workflow_dispatch` для GitHub Actions, ждёт завершения трёх runner'ов, скачивает единый
artifact `allure-results-<run-id>` и распаковывает raw results под запущенным `doqa-cli watch`.
`DOQA_PIPELINE_ID` связывает результаты с уже созданным прогоном, поэтому отдельный прогон через
`doqa-cli report` не создаётся. GitLab сам тесты не выполняет.

1. Импортируйте или зеркалируйте этот репозиторий в отдельный GitLab project и подключите project
   в DoQA как CI/CD integration.
2. В GitLab добавьте masked/protected variables `GITHUB_ACTIONS_TOKEN`, `DOQA_ENDPOINT`,
   `DOQA_SPACE_ID`, `DOQA_AUTOTEST_TOKEN`. Fine-grained GitHub token должен иметь repository
   permission `Actions: read and write` только для `BBBtp/AezakmiGroup-Tests`.
3. Запустите автотесты из DoQA: bridge передаст выбранную ветку в GitHub, а после завершения
   вернёт raw Allure results. Переменные `CI_PIPELINE_ID`, `CI_PROJECT_ID` и
   `CI_COMMIT_REF_NAME` предоставляет GitLab.

Опциональная pipeline variable `TEST_GREP` передаётся в Playwright как `--grep`. Пустое значение
запускает полный regression на трёх self-hosted runner'ах. Непустой фильтр запускает один shard
на одном runner'е, после чего тем же фильтром последовательно проверяет serial KPI Settings.
Например: `TEST_GREP=TC-967`, `TEST_GREP=niches` или `TEST_GREP=TC-(967|995)`. Если тесты
содержат нативный тег Playwright, можно передать `TEST_GREP=@niches`. Jobs используют
`--pass-with-no-tests`, потому что фильтр может относиться только к read-only либо только к KPI
Settings; в итоговый Allure попадают только реально выбранные сценарии.

Собственный runner разворачивается из `infra/gitlab-runner/compose.yaml`, регистрируется как
Project Runner с shell executor и tag `doqa-bridge`. Контейнер не получает Docker socket и не
может управлять тремя GitHub runner'ами на том же сервере.

Полный HTML остаётся artifact `allure-report-<run-id>`. Для постоянной страницы создайте пустой
Netlify project и добавьте в GitHub repository secrets `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`,
а также variables `NETLIFY_REPORT_URL=https://<project-name>.netlify.app/` и
`NETLIFY_ENABLED=true`. После генерации CI отправляет готовый HTML в Netlify через ZIP Deploy API;
доступ Netlify к GitHub repository не нужен. Пока флаг не включён, наружу ничего не публикуется.

Allure содержит screenshots, videos и traces с данными CRM. Перед включением публикации задайте
в Netlify Project configuration → General → Visitor access → Project visibility значение Private
или Password. Возможности доступа зависят от тарифного плана Netlify.

Nightly-прогон сам по себе ничего не публикует в DoQA. Для публикации запустите workflow вручную
с параметром `publish_to_doqa=true`. Job публикации использует GitHub Environment
`doqa-production`; настройте для него required reviewers. Read-only job черновиков использует
repository secrets `DOQA_ENDPOINT`, `DOQA_SPACE_ID`, опционально `DOQA_PROJECT_ID` и
`DOQA_TOKEN`. Для environment `doqa-production` дополнительно нужен:

- `DOQA_AUTOTEST_TOKEN`.

Публикация начинается после завершения всех regression-групп, включая завершённые failed jobs,
объединяет их Allure results и повторно выполняет preflight и post-upload verification.

Прогон, инициированный из DoQA, публикуется обратно bridge job в GitLab и не использует ручной
GitHub job `publish-doqa`, поэтому дублирующий DoQA run не создаётся.

Для smoke job настройте repository secrets:

- `E2E_BASE_URL`
- `E2E_ADMIN_USERNAME`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_USER_USERNAME`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`

Playwright/Allure-артефакты smoke-прогона сохраняются на 14 дней. DoQA-токены CI quality workflow не получает и отчёты во внешнюю систему не публикует.
