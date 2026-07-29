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
```

`doqa:run` запускает тесты и публикует свежие Allure results в DoQA. Публикация выполняется только
после зелёного прогона: setup-, skipped-результаты и записи без единственного числового
`ALLURE_ID` исключаются, а созданный run проверяется по количеству тестов, progress, элементам и
связям с DoQA ID. Не используйте эту команду для исследовательских локальных прогонов.

MCP не принимает токены в аргументах инструментов. Для публикации он читает
`DOQA_AUTOTEST_TOKEN` из окружения и разрешает выбирать только имя файла внутри
`DOQA_REPORT_DIR`. `doqa_improve_case` работает как dry-run, пока явно не передан `apply: true`.

## Архитектура

- `tests/smoke` — короткий набор критических проверок.
- `tests/regression` — подробные бизнес-сценарии.
- `tests/setup` — создание storage state только для авторизованных проектов.
- `tests/support` — API-контракты, lifecycle тестовых данных и общие domain helpers.
- `fixtures` — пользователи, авторизация и lifecycle страниц.
- `modules` — публичная граница домена для тестов и fixtures.
- `pages` — композиция страниц.
- `components` — локаторы и действия отдельных UI-блоков.
- `mcp` — интеграция с DoQA.
- `scripts` — проверки репозитория и управляемые workflow.

Подробности: [архитектура](docs/ARCHITECTURE.md), [workflow](docs/WORKFLOW.md), [логирование](docs/LOGGING.md).

## Добавление теста

1. Получите полный кейс и ID из DoQA.
2. Выберите smoke или regression по бизнес-критичности.
3. Используйте публичный экспорт из `modules`, не импортируйте `pages/components` напрямую.
4. Добавьте ровно один уникальный `allure.allureId(...)`.
5. Изолируйте данные и гарантируйте cleanup в `finally` или fixture teardown.
6. Запустите адресный тест, затем `npm run quality`.

Авторизованные `smoke` и `regression` зависят от setup-project. Проекты `smoke-auth` и `regression-auth` запускаются без сохранённой admin-сессии, поэтому проверки логина и контроля доступа не зависят от успешного setup.

Правила, обязательные для разработчиков и агентов, находятся в [AGENTS.md](AGENTS.md).

## CI

GitHub Actions выполняет статический quality gate для pull request. После push в `main` дополнительно запускается smoke-набор.

Для smoke job настройте repository secrets:

- `E2E_BASE_URL`
- `E2E_ADMIN_USERNAME`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_USER_USERNAME`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`

Playwright/Allure-артефакты smoke-прогона сохраняются на 14 дней. DoQA-токены CI quality workflow не получает и отчёты во внешнюю систему не публикует.
