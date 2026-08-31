import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { performanceApi } from '@support/asa/contracts';

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

  test('[TC-1093] ограничивает запросы Performance вчерашним днем', async ({ network, performancePage }) => {
    await allure.allureId('1093');
    await performancePage.setFixedTime('2026-08-27T05:00:00.000Z');
    const requests = network.captureRequests(
      (request) => request.method() === 'GET' && performanceApi.datedRequests.test(request.url()),
    );

    await performancePage.openFromSidebar();

    await requests.expectCount(3, 'Performance отправляет три запроса данных');
    const urls = requests.urls.map((value) => new URL(value));
    await scenarioCheck.deepEqual(
      'Performance запрашивает все обязательные ресурсы',
      urls.map((url) => url.pathname).sort(),
      [...performanceApi.expectedDatedRequestPaths].sort(),
    );
    for (const url of urls) {
      await scenarioCheck.equal(
        `${url.pathname} ограничен вчерашним днем`,
        url.searchParams.get('to_date'),
        '2026-08-26',
      );
    }
    requests.stop();
  });

  test('[TC-1094] запрещает выбирать сегодня и будущие даты', async ({ performancePage }) => {
    await allure.allureId('1094');
    await performancePage.setFixedTime('2026-08-27T05:00:00.000Z');
    await performancePage.openFromSidebar();
    await performancePage.content.openCalendar();
    await performancePage.content.calendar.expectLatestAvailableDay({
      latestAvailableLabel: 'Choose Wednesday, August 26th, 2026',
      todayUnavailableLabel: 'Not available Thursday, August 27th, 2026',
      futureUnavailableLabel: 'Not available Friday, August 28th, 2026',
    });
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
