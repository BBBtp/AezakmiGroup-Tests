# Настройка тестовых данных

## Важно! 🔒

Тесты используют переменные окружения из `.env` файла. Файл `.env` **НЕ коммитится в Git**.

## Первоначальная настройка

### Шаг 1: Создать .env файл

Скопируйте пример и заполните реальными данными:

```bash
cp .env.example .env
```

Или создайте вручную файл `.env` в корне проекта:

```bash
# Тестовые данные для E2E тестов
E2E_ADMIN_USERNAME=test_admin
E2E_ADMIN_EMAIL=your-admin@example.com
E2E_ADMIN_PASSWORD=your-admin-password

E2E_USER_USERNAME=test_user
E2E_USER_EMAIL=your-user@example.com
E2E_USER_PASSWORD=your-user-password
```

### Шаг 2: Заполнить реальными данными

Откройте `.env` и замените плейсхолдеры:
- `your-admin@example.com` → реальный email администратора
- `your-admin-password` → реальный пароль администратора
- `your-user@example.com` → реальный email пользователя
- `your-user-password` → реальный пароль пользователя

## При использовании как npm пакет во фронтенд-проекте

Когда фронтенд-проект устанавливает пакет `@crm/e2e-tests`:

### Вариант 1: .env в корне фронтенд-проекта (рекомендуется)

Создайте `.env` файл в **корне фронтенд-проекта** (не в node_modules):

```bash
# В корне фронтенд-проекта
cp node_modules/@crm/e2e-tests/.env.example .env
# Отредактировать .env с реальными данными
```

Playwright автоматически загрузит `.env` из корня проекта.

### Вариант 2: Переменные окружения (для CI)

В CI/CD используйте секреты/переменные окружения:

```bash
export E2E_ADMIN_EMAIL=your-email@example.com
export E2E_ADMIN_PASSWORD=your-password
export E2E_USER_EMAIL=user-email@example.com
export E2E_USER_PASSWORD=user-password
npm run test:e2e:smoke
```

## CI/CD настройка

### GitHub Actions

```yaml
env:
  E2E_ADMIN_USERNAME: ${{ secrets.E2E_ADMIN_USERNAME }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
  E2E_USER_USERNAME: ${{ secrets.E2E_USER_USERNAME }}
  E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
  E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}

steps:
  - name: Run smoke tests
    run: npm run test:e2e:smoke
```

### GitLab CI

```yaml
variables:
  E2E_ADMIN_USERNAME: $E2E_ADMIN_USERNAME
  E2E_ADMIN_EMAIL: $E2E_ADMIN_EMAIL
  E2E_ADMIN_PASSWORD: $E2E_ADMIN_PASSWORD
  E2E_USER_USERNAME: $E2E_USER_USERNAME
  E2E_USER_EMAIL: $E2E_USER_EMAIL
  E2E_USER_PASSWORD: $E2E_USER_PASSWORD
```

## Проверка

После настройки запустите:

```bash
npm run test:smoke
```

Если данные настроены правильно, тесты должны пройти авторизацию.

Если видите ошибку `Missing required environment variable: E2E_ADMIN_EMAIL` - проверьте, что `.env` файл создан и содержит все необходимые переменные.

## Безопасность

- ✅ `.env.example` - коммитится (безопасно, только шаблон)
- ❌ `.env` - НЕ коммитится (содержит реальные пароли, в `.gitignore`)
- ✅ Переменные окружения в CI - безопасно (секреты)
