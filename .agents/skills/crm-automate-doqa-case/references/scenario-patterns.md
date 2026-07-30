# Карта сценариев

## Выбор размещения

| Сценарий                               | Тест/project                                | Публичный API          | Инфраструктура                                 |
| -------------------------------------- | ------------------------------------------- | ---------------------- | ---------------------------------------------- |
| Доступность критического пути          | `tests/smoke`, `smoke`                      | `@modules/<domain>`    | существующие fixtures                          |
| Подробное UI-поведение                 | `tests/regression`, `regression`            | page/component methods | locator contract + `framework/ui`              |
| Login, anonymous access                | `smoke-auth` или `regression-auth`          | `@modules/auth`        | `AuthSessionLifecycle`                         |
| Logout, expired или persistent session | `tests/regression`, подходящий auth project | navigation/auth module | `ManagedTestSession`, `AuthSessionLifecycle`   |
| API-контракт, вызванный UI             | `tests/regression`                          | domain page            | `tests/support/<domain>` + `NetworkController` |
| Создание или изменение данных          | `tests/regression`                          | domain flow            | `TestDataFactory` + cleanup registry           |
| Общая конфигурация KPI Settings        | serial regression                           | `@modules/kpi`         | `KpiSettingsLifecycle`                         |
| Проверка console errors                | smoke/regression                            | domain action          | `BrowserDiagnostics`                           |

## Куда помещать изменение

- Новый устойчивый ID, accessible name или CSS fallback: `locators/<domain>.ts`.
- Действие внутри одного блока: `components/<domain>`.
- Переход между блоками или страницами: `pages/<domain>`.
- Объект, разрешённый тестам и fixtures: `modules/<domain>/index.ts`.
- Повторяемый API-контракт или интеграционный flow: `tests/support/<domain>`.
- Создание объектов для теста: один из слоёв `fixtures/core-fixtures.ts`,
  `fixtures/ui-fixtures.ts`, `fixtures/domain-fixtures.ts`.
- Общий адаптер Playwright: `framework/ui`, `framework/network` или `framework/playwright`.

## Замены запрещённых приёмов

| Не использовать в бизнес-тесте           | Использовать                                |
| ---------------------------------------- | ------------------------------------------- |
| `page.locator`, `getBy*`                 | метод объекта из `@modules/*`               |
| `page.goto`, `waitForResponse`, `route`  | `NetworkController`                         |
| `page.on('console')`                     | `BrowserDiagnostics.captureConsoleErrors()` |
| `browser.newContext`, `chromium.launch*` | `ManagedTestSession` или domain lifecycle   |
| `localStorage`, `page.evaluate`          | метод управляемой сессии                    |
| `Date.now`, случайный suffix             | `TestDataFactory`                           |
| ручной `finally` для данных/listeners    | cleanup registry                            |
| raw `expect(locator)` в UI-слое          | `UiExpectations`                            |
| fixed timeout или retry                  | ожидание observable state                   |

## Граница assertions

- Проверять UI-состояние в page/component через `UiExpectations`.
- Проверять чистые JSON/data contracts в тесте или `tests/support`.
- Не возвращать Locator или raw Page в бизнес-тест ради assertion.
- Добавлять доменный `expect...()` метод, когда проверка выражает наблюдаемое поведение продукта.
