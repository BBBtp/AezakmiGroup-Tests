# Интеграция в фронтенд-проект

## Шаг 1: Добавить зависимость

В `package.json` фронтенд-проекта:

```json
{
  "devDependencies": {
    "@crm/e2e-tests": "file:../crm-aezakmi-tests"
  }
}
```

Или если репозитории в разных местах:

```json
{
  "devDependencies": {
    "@crm/e2e-tests": "file:/absolute/path/to/crm-aezakmi-tests"
  }
}
```

## Шаг 2: Установить зависимости

```bash
cd /path/to/crm-frontend
npm install
```

## Шаг 3: Настроить тестовые данные (.env файл)

⚠️ **Важно:** Тесты используют переменные окружения из `.env` файла.

### Вариант A: Создать .env в корне фронтенд-проекта

Создайте файл `.env` в корне фронтенд-проекта:


Или скопируйте `.env.example` из пакета:

```bash
cp node_modules/@crm/e2e-tests/.env.example .env
# Отредактируйте .env с реальными данными
```

### Вариант B: Использовать переменные окружения в CI

В CI/CD настройте секреты (GitHub Secrets / GitLab Variables):

```yaml
env:
  E2E_ADMIN_USERNAME: ${{ secrets.E2E_ADMIN_USERNAME }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
  E2E_USER_USERNAME: ${{ secrets.E2E_USER_USERNAME }}
  E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
  E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
```

⚠️ **Не коммитьте `.env` файл в Git!** Добавьте в `.gitignore` фронтенд-проекта:
```
.env
.env.local
```

## Шаг 4: Добавить скрипты в package.json фронтенда

```json
{
  "scripts": {
    "test:e2e": "playwright test --config=node_modules/@crm/e2e-tests/playwright.config.ts",
    "test:e2e:smoke": "playwright test --project=smoke --config=node_modules/@crm/e2e-tests/playwright.config.ts",
    "test:e2e:regression": "playwright test --project=regression --config=node_modules/@crm/e2e-tests/playwright.config.ts",
    "test:e2e:report": "playwright test --config=node_modules/@crm/e2e-tests/playwright.config.ts && playwright show-report --config=node_modules/@crm/e2e-tests/playwright.config.ts"
  }
}
```

## Шаг 5: Запуск тестов

```bash
# Все тесты
npm run test:e2e

# Только smoke
npm run test:e2e:smoke

# Только regression
npm run test:e2e:regression
```

## CI/CD интеграция (GitHub Actions)

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: node_modules/@crm/e2e-tests
      
      - name: Run smoke tests
        env:
          E2E_ADMIN_USERNAME: ${{ secrets.E2E_ADMIN_USERNAME }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_USER_USERNAME: ${{ secrets.E2E_USER_USERNAME }}
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
        run: npm run test:e2e:smoke
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-smoke
          path: node_modules/@crm/e2e-tests/playwright-report/
          retention-days: 30

  test-regression:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: node_modules/@crm/e2e-tests
      
      - name: Run regression tests
        env:
          E2E_ADMIN_USERNAME: ${{ secrets.E2E_ADMIN_USERNAME }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_USER_USERNAME: ${{ secrets.E2E_USER_USERNAME }}
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
        run: npm run test:e2e:regression
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-regression
          path: node_modules/@crm/e2e-tests/playwright-report/
          retention-days: 30
```

## CI/CD интеграция (GitLab CI)

```yaml
stages:
  - test

variables:
  PLAYWRIGHT_BROWSERS_PATH: 0

test:smoke:
  stage: test
  image: mcr.microsoft.com/playwright:v1.56.1-focal
  script:
    - npm ci
    - cd node_modules/@crm/e2e-tests
    - npm run test:smoke
  artifacts:
    when: always
    paths:
      - node_modules/@crm/e2e-tests/playwright-report/
    expire_in: 30 days

test:regression:
  stage: test
  image: mcr.microsoft.com/playwright:v1.56.1-focal
  only:
    - main
  script:
    - npm ci
    - cd node_modules/@crm/e2e-tests
    - npm run test:regression
  artifacts:
    when: always
    paths:
      - node_modules/@crm/e2e-tests/playwright-report/
    expire_in: 30 days
```

## Обновление тестов

Когда обновляешь тесты в репозитории `crm-aezakmi-tests`:

```bash
# В репозитории тестов
git pull
# или делаешь изменения и коммитишь

# Во фронтенд-проекте
npm install  # обновит симлинк на новую версию
```

## Переменные окружения

Тесты **обязательно** требуют следующие переменные окружения:

- `E2E_ADMIN_USERNAME` - имя пользователя администратора
- `E2E_ADMIN_EMAIL` - email администратора
- `E2E_ADMIN_PASSWORD` - пароль администратора
- `E2E_USER_USERNAME` - имя обычного пользователя
- `E2E_USER_EMAIL` - email обычного пользователя
- `E2E_USER_PASSWORD` - пароль обычного пользователя

Эти переменные можно задать через:
1. `.env` файл в корне проекта (рекомендуется для локальной разработки)
2. Переменные окружения в CI/CD (секреты)

Можно также переопределить baseURL:

```bash
PLAYWRIGHT_BASE_URL=https://staging.example.com npm run test:e2e:smoke
```

## Troubleshooting

### Проблема: "Cannot find module '@crm/e2e-tests'"

**Решение:** Убедись, что путь в `package.json` правильный и выполни `npm install`.

### Проблема: "Playwright browsers not installed"

**Решение:** 
```bash
cd node_modules/@crm/e2e-tests
npx playwright install --with-deps
```

### Проблема: Тесты не находят конфиг

**Решение:** Убедись, что используешь полный путь:
```bash
--config=node_modules/@crm/e2e-tests/playwright.config.ts
```

### Проблема: "Missing required environment variable: E2E_ADMIN_EMAIL"

**Решение:** Создай `.env` файл в корне фронтенд-проекта или настрой переменные окружения:
```bash
# Создать .env файл
cp node_modules/@crm/e2e-tests/.env.example .env
# Отредактировать .env с реальными данными
```

