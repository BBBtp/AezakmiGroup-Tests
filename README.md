# CRM E2E Tests

Автоматизированные end-to-end тесты для CRM приложения на базе Playwright.

## Установка

### Как npm пакет (рекомендуется)

В корне фронтенд-проекта:

```json
{
  "devDependencies": {
    "@crm/e2e-tests": "file:../crm-aezakmi-tests"
  }
}
```

Затем:
```bash
npm install
```

### Локальная разработка

```bash
npm install
npx playwright install
```

## Запуск тестов

### Из этого репозитория

```bash
# Все тесты
npm test

# Только smoke тесты
npm run test:smoke

# Только regression тесты
npm run test:regression

# С UI
npm run test:headed

# С отчётом
npm run test:report
```

### Из фронтенд-проекта

После установки как npm пакет:

```bash
# Вариант 1: Через npm scripts (добавить в package.json фронтенда)
npm run test:e2e:smoke
npm run test:e2e:regression

# Вариант 2: Напрямую через Playwright
npx playwright test --config=node_modules/@crm/e2e-tests/playwright.config.ts --project=smoke
```

## Структура проекта

```
├── components/          # Page Object компоненты
├── pages/               # Page Object страницы
├── fixtures/            # Тестовые данные и фикстуры
├── tests/               # Тестовые сценарии
│   ├── smoke/          # Smoke тесты
│   └── regression/     # Regression тесты
├── utils/               # Утилиты
├── config/              # Конфигурация окружений
└── playwright.config.ts # Конфигурация Playwright
```

## Проекты тестов

- **smoke** - быстрые критичные тесты (15 тестов, ~15 сек)
- **regression** - полный набор тестов (19 тестов, ~18 сек)

## CI/CD интеграция

### GitHub Actions пример

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run smoke tests
  run: npm run test:e2e:smoke

- name: Run regression tests
  run: npm run test:e2e:regression
```

### Параллельный запуск

```yaml
test-smoke:
  runs-on: ubuntu-latest
  steps:
    - run: npm run test:e2e:smoke

test-regression:
  runs-on: ubuntu-latest
  steps:
    - run: npm run test:e2e:regression
```

## Окружения

Тесты используют окружение из `playwright.config.ts`:
- Base URL: `https://totally-adequate-goldfinch.cloudpub.ru/`

Для смены окружения измените `baseURL` в конфиге или используйте переменные окружения.

## Настройка тестовых данных

⚠️ **Важно:** Тесты используют переменные окружения из `.env` файла.

Перед первым запуском тестов создайте `.env` файл в корне проекта:

```bash
# Скопировать пример
cp .env.example .env

# Отредактировать .env с реальными данными
```

Или создать вручную:

```bash
# Тестовые данные для E2E тестов
E2E_ADMIN_USERNAME=test_admin
E2E_ADMIN_EMAIL=your-admin@example.com
E2E_ADMIN_PASSWORD=your-admin-password

E2E_USER_USERNAME=test_user
E2E_USER_EMAIL=your-user@example.com
E2E_USER_PASSWORD=your-user-password
```

Файл `.env` не коммитится в Git (в `.gitignore`). Для CI/CD используйте секреты/переменные окружения.

Подробнее см. [SETUP.md](./SETUP.md) и [INTEGRATION.md](./INTEGRATION.md)

## Авторизация

Тесты используют глобальную настройку (`globalSetup`) для автоматической авторизации. Файл `.auth/admin.json` создаётся автоматически при первом запуске.

## Требования

- Node.js >= 18
- npm >= 9
- Playwright browsers (устанавливаются автоматически)

## Лицензия

ISC

