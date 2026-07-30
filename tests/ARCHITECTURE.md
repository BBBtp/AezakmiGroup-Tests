# Test architecture

- `modules/<domain>` is the public boundary for Auth, KPI and Employees. Tests and fixtures import pages or public components only from here.
- `fixtures` owns authentication, test users and page lifecycles. Import it through `@fixtures`.
- `tests/setup` creates admin storage state for authenticated projects. Auth and access-control projects do not depend on it.
- `tests/smoke` and `tests/regression` contain only business scenarios.
- `tests/support/<domain>` contains reusable API contracts, test identifiers and test-data lifecycle.
- `pages` compose page interactions; `components` own locators and component actions; both are implementation details behind `modules`.
- `framework/ui` is the only adapter over raw Playwright locator/actions and diagnostic logging.
- `locators/<domain>` contains shared public locator identifiers; component-private dynamic structure remains behind the owning component.
- `framework/lifecycle` owns the LIFO cleanup registry; register compensation before every mutation.
- `framework/playwright` owns reusable Playwright extensions such as additional managed sessions.
- `config` and `utils` are cross-domain infrastructure, imported through `@config/*` and `@utils/*`.

Use the aliases in `tsconfig.json` for new code. Add a module export before exposing a new page or component to tests. Add a domain under `tests/support` when two or more scenarios share service contracts, test data lifecycle or an integration flow.

KPI Settings scenarios mutate shared application configuration and therefore remain serial even if the rest of the suite becomes parallel. Every mutation registers cleanup before the mutation. Use `runNow` for eager cleanup; a failed eager cleanup remains registered for fixture teardown retry.

Business tests must not call `locator`, `getBy*` or diagnostic action helpers directly. Add the
missing behavior to the domain module instead.
