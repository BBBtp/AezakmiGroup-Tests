import { allure } from 'allure-playwright';

import { test } from '@fixtures';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  }).format(date);
}

test('[TC-1197] отпуск можно создать с прошедшей датой в пределах года', async ({
  employeesPage,
  vacationSchedulePage,
}) => {
  await allure.allureId('1197');
  await allure.description(`
**Цель:** проверить FRONT-161.

**Контекст:** создание и редактирование отпуска в разделах Vacation schedule и Vacation сотрудника.

**Предусловия:** администратор авторизован; доступно планирование отпуска; есть сотрудник с отпуском.

**Сценарий:** открыть формы создания и редактирования, ввести прошедшую дату в пределах года.

**Ожидаемый результат:** прошедшая дата принимается обеими формами.
`);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const value = formatDate(yesterday);

  await test.step('ПОДГОТОВКА · Открыть Vacation schedule', () => vacationSchedulePage.navigate());
  await test.step('ДЕЙСТВИЕ · Открыть форму добавления отпуска', () => vacationSchedulePage.form.open());
  await test.step('ДЕЙСТВИЕ · Выбрать тестового сотрудника', () =>
    vacationSchedulePage.form.selectEmployee());
  await test.step('ДЕЙСТВИЕ · Ввести прошедшую дату', () => vacationSchedulePage.form.fillStartDate(value));
  await test.step('ПРОВЕРКА · Прошедшая дата принята формой', () =>
    vacationSchedulePage.form.expectStartDate(value));

  const employeeVacationPage = await test.step('ПОДГОТОВКА · Открыть Vacation сотрудника', async () => {
    await employeesPage.navigate();
    return employeesPage.openFirstEmployeeVacation();
  });
  await test.step('ДЕЙСТВИЕ · Открыть редактирование отпуска', () => employeeVacationPage.openEditVacation());
  await test.step('ДЕЙСТВИЕ · Ввести прошедшую дату в форме редактирования', () =>
    employeeVacationPage.fillEditStartDate(value));
  await test.step('ПРОВЕРКА · Прошедшая дата принята формой редактирования', () =>
    employeeVacationPage.expectEditStartDate(value));
});

test('[TC-1199] A/B tests учитывает Team по умолчанию и KPI Settings открывается', async ({
  dashboardPage,
  kpiPage,
  productPage,
  readOnlySectionsPage,
}) => {
  await allure.allureId('1199');
  await allure.description(`
**Цель:** проверить FRONT-163.

**Контекст:** исправления падений smoke-тестов A/B tests, KPI Settings и read-only разделов.

**Предусловия:** администратор авторизован.

**Сценарий:** открыть A/B tests, проверить дефолтный Team-фильтр, открыть KPI Settings,
  Employees и Vacation schedule через боковое меню.

**Ожидаемый результат:** разделы открываются, основные контролы и бизнес-данные видимы,
  технические значения отсутствуют.
`);

  await test.step('ПОДГОТОВКА · Открыть Dashboard', () => dashboardPage.navigate());
  await test.step('ДЕЙСТВИЕ · Открыть A/B tests', () => productPage.openAbTests());
  await test.step('ПРОВЕРКА · Проверить фильтр Team по умолчанию', () =>
    productPage.abTests.expectTeamFilter());
  const settingsPage = await test.step('ДЕЙСТВИЕ · Открыть KPI Settings', async () => {
    await kpiPage.navigate();
    return kpiPage.openSettings();
  });
  await test.step('ПРОВЕРКА · Проверить базовые таблицы KPI Settings', () =>
    settingsPage.expectBaseTablesVisible());
  await test.step('ПРОВЕРКА · Открыть Employees', () => readOnlySectionsPage.openFromSidebar('employees'));
  await test.step('ПРОВЕРКА · Открыть Vacation schedule', () =>
    readOnlySectionsPage.openFromSidebar('vacationSchedule'));
});

test('[TC-1195] tooltip карточки Overall score сотрудника не шире 240 пикселей', async ({ kpiPage }) => {
  await allure.allureId('1195');
  await allure.description(`
**Цель:** проверить FRONT-155.

**Контекст:** информационная подсказка карточки Overall score на странице KPI конкретного сотрудника.

**Предусловия:** администратор авторизован; доступна страница KPI сотрудника; карточка Overall score сотрудника отображается.

**Сценарий:** открыть страницу KPI сотрудника, убедиться, что выбрана карточка Overall score,
  и навести курсор на иконку подсказки карточки.

**Ожидаемый результат:** максимальная ширина открывшегося tooltip не превышает 240 px.
`);

  const employeeKpiPage = await test.step('ПОДГОТОВКА · Открыть KPI сотрудника', async () => {
    const managerPage = kpiPage.manager('1c923ed6-c112-4522-90e1-bc4bdf1f2cf3');
    await managerPage.navigate();
    await managerPage.scoreCard.assertVisible('Overall score');
    return managerPage;
  });
  await test.step('ДЕЙСТВИЕ · Открыть tooltip карточки Overall score сотрудника', () =>
    employeeKpiPage.scoreCard.hoverTooltip());
  await test.step('ПРОВЕРКА · Проверить максимальную ширину tooltip', () =>
    employeeKpiPage.scoreCard.expectTooltipWidthAtMost(240));
});

test('[TC-1196] значения Staff Select не содержат лишнего начального пробела', async ({ productPage }) => {
  await allure.allureId('1196');
  await allure.description(`
**Цель:** проверить FRONT-156.

**Контекст:** Select-ы в карточке Staff диалога редактирования параметров приложения.

**Предусловия:** администратор авторизован; в разделе Apps доступно приложение.

**Сценарий:** открыть detail приложения, открыть Edit parameters и проверить выбранные значения
  Staff Select-ов.

**Ожидаемый результат:** каждое выбранное значение начинается с видимого символа без лишнего
  начального пробела.
`);

  const parameters = await test.step('ПОДГОТОВКА · Открыть параметры первого приложения', () =>
    productPage.openApps().then(() => productPage.apps.openFirstAppParameters()));
  await test.step('ПРОВЕРКА · Проверить значения Staff Select', () =>
    parameters.expectStaffSelectValuesWithoutLeadingGap());
});

test('[TC-1198] End date позволяет выбрать тот же месяц, что и Start date', async ({
  vacationSchedulePage,
}) => {
  await allure.allureId('1198');
  await allure.description(`
**Цель:** проверить FRONT-160.

**Контекст:** выбор дат в форме планирования отпуска.

**Предусловия:** администратор авторизован; форма планирования отпуска доступна.

**Сценарий:** выбрать сотрудника, заполнить Start date и открыть календарь End date.

**Ожидаемый результат:** месяц Start date доступен в выборе End date, а дата окончания в том же
месяце принимается формой.
`);

  const start = new Date();
  start.setDate(start.getDate() - 2);
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const startValue = formatDate(start);
  const endValue = formatDate(end);

  await test.step('ПОДГОТОВКА · Открыть форму выбора дат', async () => {
    await vacationSchedulePage.navigate();
    await vacationSchedulePage.form.open();
    await vacationSchedulePage.form.selectEmployee();
  });
  await test.step('ДЕЙСТВИЕ · Заполнить Start date', () =>
    vacationSchedulePage.form.fillStartDate(startValue));
  await test.step('ДЕЙСТВИЕ · Выбрать тот же месяц в End date', () =>
    vacationSchedulePage.form.selectEndDateMonth(start.getMonth()));
  await test.step('ДЕЙСТВИЕ · Заполнить End date', () => vacationSchedulePage.form.fillEndDate(endValue));
  await test.step('ПРОВЕРКА · Даты одного месяца приняты формой', async () => {
    await vacationSchedulePage.form.expectStartDate(startValue);
    await vacationSchedulePage.form.expectEndDate(endValue);
  });
});

test('[TC-1201] tooltip карточки Overall score сотрудника содержит новый текст', async ({ kpiPage }) => {
  await allure.allureId('1201');
  await allure.description(`
**Цель:** проверить FRONT-165.

**Контекст:** информационная подсказка карточки Overall score на странице KPI конкретного сотрудника.

**Предусловия:** администратор авторизован; доступна страница KPI сотрудника; карточка Overall score сотрудника отображается.

**Сценарий:** открыть страницу KPI сотрудника, убедиться, что выбрана карточка Overall score,
  открыть tooltip карточки и прочитать его текст.

**Ожидаемый результат:** текст равен Starting / current / minimum score for ASO manager.
`);

  const employeeKpiPage = await test.step('ПОДГОТОВКА · Открыть KPI сотрудника', async () => {
    const managerPage = kpiPage.manager('1c923ed6-c112-4522-90e1-bc4bdf1f2cf3');
    await managerPage.navigate();
    await managerPage.scoreCard.assertVisible('Overall score');
    return managerPage;
  });
  await test.step('ДЕЙСТВИЕ · Открыть tooltip карточки Overall score сотрудника', () =>
    employeeKpiPage.scoreCard.hoverTooltip());
  await test.step('ПРОВЕРКА · Проверить текст tooltip', () =>
    employeeKpiPage.scoreCard.expectTooltipText('Starting / current / minimum score for ASO manager'));
});

test('[TC-1200] старый отпуск имеет действия редактирования и удаления', async ({ employeesPage }) => {
  await allure.allureId('1200');
  await allure.description(`
**Цель:** проверить FRONT-166.

**Контекст:** история отпусков на странице Vacation сотрудника.

**Предусловия:** администратор авторизован; в списке сотрудников есть сотрудник с отпуском.

**Сценарий:** открыть карточку сотрудника, перейти в Vacation и проверить действия у старого отпуска.

**Ожидаемый результат:** для отпуска не старше года доступны Edit и Delete.
`);

  const employeeVacationPage = await test.step('ПОДГОТОВКА · Открыть Vacation сотрудника', async () => {
    await employeesPage.navigate();
    return employeesPage.openFirstEmployeeVacation();
  });
  await test.step('ПРОВЕРКА · Проверить действия старого отпуска', () =>
    employeeVacationPage.expectVacationHistoryEditable());
});

test('[TC-1202] Vacation schedule позволяет открыть 2025 год', async ({
  readOnlySectionsPage,
  vacationSchedulePage,
}) => {
  await allure.allureId('1202');
  await allure.description(`
**Цель:** проверить FRONT-167.

**Контекст:** годовой переключатель страницы Vacation schedule.

**Предусловия:** администратор авторизован; открыта страница Vacation schedule; выбран 2026 год.

**Сценарий:** перейти к предыдущему году.

**Ожидаемый результат:** выбран 2025 год, месяцы и данные графика доступны.
`);

  await test.step('ПОДГОТОВКА · Открыть Vacation schedule', () => vacationSchedulePage.navigate());
  await test.step('ДЕЙСТВИЕ · Переключить график на предыдущий год', () =>
    vacationSchedulePage.openPreviousYear());
  await test.step('ПРОВЕРКА · Проверить выбранный 2025 год и содержимое графика', async () => {
    await vacationSchedulePage.expectYear(2025);
    await readOnlySectionsPage.section.expectHealthy('vacationSchedule');
  });
});
