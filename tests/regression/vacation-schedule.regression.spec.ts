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

test('[TC-1119] отпуск можно запланировать задней датой в пределах года', async ({
  vacationSchedulePage,
}) => {
  await allure.allureId('1119');
  await allure.description(`
**Цель:** проверить исправление FRONT-153.

**Контекст:** форма Adding vacation в разделе Vacation schedule.

**Предусловия:** администратор авторизован; доступно планирование отпуска.

**Сценарий:** открыть форму, проверить нижнюю границу и ввести прошедшую дату в пределах года.

**Ожидаемый результат:** минимальная дата равна дате год назад, разрешённая прошедшая дата принимается формой.
`);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await test.step('ПОДГОТОВКА · Открыть Vacation schedule', () => vacationSchedulePage.navigate());
  await test.step('ДЕЙСТВИЕ · Открыть форму добавления отпуска', () => vacationSchedulePage.form.open());
  await test.step('ДЕЙСТВИЕ · Выбрать тестового сотрудника', () =>
    vacationSchedulePage.form.selectEmployee());
  await test.step('ПРОВЕРКА · Минимальная дата ограничена одним годом назад', async () => {
    await vacationSchedulePage.form.openStartDateCalendar();
    await vacationSchedulePage.form.expectOneYearCalendarBoundary(new Date().getFullYear());
  });
  await test.step('ДЕЙСТВИЕ · Ввести прошедшую дату в пределах года', () =>
    vacationSchedulePage.form.fillStartDate(formatDate(yesterday)));
  await test.step('ПРОВЕРКА · Прошедшая дата принята формой', () =>
    vacationSchedulePage.form.expectStartDate(formatDate(yesterday)));
});
