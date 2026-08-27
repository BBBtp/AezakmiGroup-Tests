# Project instructions

## Scope

These rules apply to the entire repository.

## Project skill

- Use `.agents/skills/crm-automate-doqa-case/SKILL.md` when creating, updating or migrating a
  CRM Playwright test from a DoQA case.
- Use the skill's DoQA publication path only when the user explicitly requests a DoQA write or
  report upload.

## Required checks

Before completing a code change, run:

```bash
npm run quality
npm run test:unit
npx playwright test --list
```

Run each changed Playwright scenario directly. Run smoke or regression in proportion to the change.

## Test architecture

- Tests and fixtures import domain UI objects only through `@modules/*`.
- Do not import `pages/*` or `components/*` directly from tests or fixtures.
- Keep business scenarios in `tests/smoke` and `tests/regression`.
- Put shared API contracts, data lifecycle and domain helpers under `tests/support/<domain>`.
- Pages compose flows; components own their locators and local actions.
- Prefer aliases from `tsconfig.json` for cross-directory imports.

## Playwright rules

- Every test has exactly one unique numeric `allure.allureId`.
- All Allure step names are written in Russian and use only the prefixes `ПОДГОТОВКА`,
  `ДЕЙСТВИЕ` and `ПРОВЕРКА`. Targets passed to `UiActions`, `UiExpectations` and
  `scenarioCheck` must be human-readable Russian descriptions; stable product names, URLs,
  HTTP methods and technical identifiers may remain unchanged.
- Allure descriptions contain goal, context, preconditions, scenario and expected result. Do not
  add a separate `Диагностика` section.
- Prefer `data-testid`, then accessible role/label. Do not target generated CSS-module classes.
- Do not add fixed sleeps, `networkidle`, `force: true` or positional locators unless the reason is documented.
- Wait for observable state: response, URL, loader, visible business result or stable DOM state.
- New page/component actions use the diagnostic helpers from `@utils/playwright-logger`.
- Tests that create or mutate data must use unique data and guaranteed cleanup.
- Keep login/access-control tests in projects without setup dependencies or storage state.
- Tests that mutate shared KPI settings must remain serial until an isolated API data factory exists.
- Do not hide instability with local retries.

## DoQA and MCP

- Read and analyze a case before changing its state.
- Use dry-run before safe normalization.
- Preserve ETag/versionUuid optimistic locking.
- Never publish an empty report.
- Completed reports may contain failed, broken or skipped mapped tests.
- Triage every failed/broken run element after upload. Prepare a bug draft only for an explicitly
  confirmed product failure, after a read-only duplicate check.
- Do not create DoQA or tracker defects automatically; return copy-ready text and reviewed
  screenshot/video plus sanitized error context.
- After upload, verify run test count, progress and run elements.
- Do not pass or print tokens, passwords, `.env` contents or storage state.

## Repository hygiene

- Do not commit `.env`, `.auth`, reports, screenshots, videos or traces.
- Update README and architecture documentation when commands or boundaries change.
- Keep `npm run quality` green.
