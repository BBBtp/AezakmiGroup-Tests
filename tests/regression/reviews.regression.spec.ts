import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { reviewsApi } from '@support/reviews/contracts';

test.describe('Reviews and ratings', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('фильтры периода и вкладок обновляют данные раздела', async ({ reviewsPage }) => {
    await allure.allureId('633');
    await reviewsPage.openFromSidebar();
    await reviewsPage.overview.switchTab('Ratings');
    await reviewsPage.overview.switchTab('Reviews');
    await reviewsPage.overview.selectPeriod('Yesterday');
    await reviewsPage.overview.selectPeriod('View all');
  });

  test('список показывает строки и пагинация запрашивает следующую страницу', async ({
    network,
    reviewsPage,
  }) => {
    await allure.allureId('634');
    await reviewsPage.openFromSidebar();
    await reviewsPage.overview.expectRows();
    await reviewsPage.overview.expectPagination();
    const held = await network.holdNext(reviewsApi.list, 'POST');
    const changing = reviewsPage.overview.goToNextPage();
    await held.started;
    await changing;
    await held.abort();
  });

  test('выбранная строка открывает соответствующее приложение', async ({ reviewsPage }) => {
    await allure.allureId('635');
    await reviewsPage.openFromSidebar();
    await reviewsPage.overview.expectRows();
    await reviewsPage.overview.openFirstApplication();
  });

  test('See more раскрывает длинный отзыв и Ratings остаётся доступным', async ({ reviewsPage }) => {
    await allure.allureId('636');
    await reviewsPage.openFromSidebar();
    await reviewsPage.overview.expandFirstLongReview();
    await reviewsPage.overview.switchTab('Ratings');
  });

  test('ошибка API отображается без устаревших строк', async ({ network, reviewsPage }) => {
    await allure.allureId('745');
    await network.failNext(reviewsApi.list, 'POST', { message: 'Test failure' });
    await reviewsPage.openRouteFromSidebar();
    await reviewsPage.overview.expectError();
  });

  test('loading state завершается после ответа API', async ({ network, reviewsPage }) => {
    await allure.allureId('746');
    const held = await network.holdNext(reviewsApi.list, 'POST');
    const opening = reviewsPage.openRouteFromSidebar();
    await held.started;
    await reviewsPage.overview.expectLoading();
    await held.abort();
    await opening.catch(() => undefined);
    await network.fulfillNextJson(reviewsApi.list, 'POST', reviewsApi.emptyList);
    await network.reload();
    await reviewsPage.overview.expectLoaded();
  });
});
