import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('ASA Performance → calendar', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-838] применяет предустановленный и произвольный период', async ({ performancePage }) => {
    await allure.allureId('838');
    await performancePage.openFromSidebar();
    for (const period of ['3 months', '6 months', 'All time', '1 month'] as const) {
      await performancePage.content.selectPeriod(period);
    }
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.fill('02.08.2026', '09.08.2026');
    await performancePage.content.calendar.apply();
    await performancePage.content.expectBusinessBlocks();
  });

  test('[TC-972] показывает поля Start, End, Reset и Apply', async ({ performancePage }) => {
    await allure.allureId('972');
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.expectOpen();
  });

  test('[TC-973] не применяет диапазон с End раньше Start', async ({ performancePage }) => {
    await allure.allureId('973');
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.fill('12.08.2026', '01.08.2026');
    await performancePage.content.calendar.expectApplyDisabled();
  });

  test('[TC-976] поддерживает диапазон в один день без сдвига даты', async ({ performancePage }) => {
    await allure.allureId('976');
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.fill('02.08.2026', '02.08.2026');
    await performancePage.content.calendar.apply();
    await performancePage.expectPeriodInUrl('2026-08-02', '2026-08-02');
  });

  test('[TC-975] обновляет все бизнес-блоки одним диапазоном', async ({ performancePage }) => {
    await allure.allureId('975');
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.fill('02.08.2026', '09.08.2026');
    await performancePage.content.calendar.apply();
    await performancePage.content.expectBusinessBlocks();
  });
});

test.describe('Common date range calendar', () => {
  test('[TC-974] использует Start и End во всех разделах', async ({
    dashboardPage,
    performancePage,
    statisticsPage,
  }) => {
    await allure.allureId('974');
    await dashboardPage.navigate();
    await statisticsPage.openFromSidebar();
    await statisticsPage.openCalendar();
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.expectOpen();
  });

  test('[TC-977] одинаково применяет и сбрасывает диапазон', async ({
    dashboardPage,
    performancePage,
    statisticsPage,
  }) => {
    await allure.allureId('977');
    await dashboardPage.navigate();
    await statisticsPage.openFromSidebar();
    await statisticsPage.openCalendar();
    await statisticsPage.calendar.fill('02.08.2026', '09.08.2026');
    await statisticsPage.calendar.apply();
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.fill('02.08.2026', '09.08.2026');
    await performancePage.content.calendar.reset();
  });
});
