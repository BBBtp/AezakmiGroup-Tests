import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { apiError, translationSuccess } from '@support/niches';

const translationEndpoint = /^https:\/\/translation\.googleapis\.com\/language\/translate\/v2(?:\?|$)/;

test.describe('Niches → keyword translation', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ dashboardPage, nichesPage }) => {
    await dashboardPage.navigate();
    await nichesPage.openFromSidebar();
    await nichesPage.openFirstDetail();
  });

  test('[TC-978] показывает элементы управления переводом', async ({ nichesPage }) => {
    await allure.allureId('978');
    await nichesPage.detail.expectTranslationControls();
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
  });

  test('[TC-952] переводит ключи одного GEO', async ({ network, nichesPage }) => {
    await allure.allureId('952');
    const before = await nichesPage.detail.rowKeywordsText();
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(2));
    await nichesPage.detail.translateRow();
    await nichesPage.detail.expectRowKeywordsChanged(before);
  });

  test('[TC-953] переводит все GEO', async ({ network, nichesPage }) => {
    await allure.allureId('953');
    const before = await nichesPage.detail.rowKeywordsText(1);
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(5));
    await nichesPage.detail.translateEveryGeo();
    await nichesPage.detail.expectRowKeywordsChanged(before, 1);
  });

  test('[TC-954] переводит только выбранные GEO', async ({ network, nichesPage }) => {
    await allure.allureId('954');
    await nichesPage.detail.selectRows(0, 1);
    const selectedBefore = await nichesPage.detail.rowKeywordsText(0);
    const otherBefore = await nichesPage.detail.rowKeywordsText(1);
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(2));
    await nichesPage.detail.translateRow(0);
    await nichesPage.detail.expectRowKeywordsChanged(selectedBefore, 0);
    await nichesPage.detail.expectRowKeywords(otherBefore, 1);
  });

  test('[TC-955] сохраняет числовые показатели после перевода', async ({ network, nichesPage }) => {
    await allure.allureId('955');
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(2));
    await nichesPage.detail.translateRow();
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
  });

  test('[TC-956] возвращает исходное отображение без второго mutation-запроса', async ({
    network,
    nichesPage,
  }) => {
    await allure.allureId('956');
    const initial = await nichesPage.detail.rowKeywordsText();
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(5));
    await nichesPage.detail.translateEveryGeo();
    await nichesPage.detail.expectRowKeywordsChanged(initial);
    await nichesPage.detail.translateEveryGeo();
    await nichesPage.detail.expectRowKeywords(initial);
  });

  test('[TC-957] показывает ошибку перевода одного GEO', async ({ network, nichesPage }) => {
    await allure.allureId('957');
    await network.fulfillNextMutation(translationEndpoint, apiError, 500);
    await nichesPage.detail.translateRow();
    await nichesPage.expectTranslationFailureNotice();
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
  });

  test('[TC-960] показывает ошибку перевода всех GEO', async ({ network, nichesPage }) => {
    await allure.allureId('960');
    await network.fulfillNextMutation(translationEndpoint, apiError, 500);
    await nichesPage.detail.translateEveryGeo();
    await nichesPage.expectTranslationFailureNotice();
  });

  test('[TC-962] показывает состояние загрузки перевода', async ({ network, nichesPage }) => {
    await allure.allureId('962');
    const requests = network.captureRequests(
      (request) => request.method() !== 'GET' && translationEndpoint.test(request.url()),
    );
    const held = await network.holdNextMutation(translationEndpoint);
    await nichesPage.detail.translateRow();
    await held.started;
    await nichesPage.detail.expectTranslationPending();
    await requests.expectCount(1, 'Перевод запускает ровно один mutation-запрос');

    await held.abort();
    await nichesPage.detail.expectTranslationReady();
    await requests.expectCount(1, 'Loading state не запускает дополнительные mutation-запросы');
    requests.stop();
  });
});
