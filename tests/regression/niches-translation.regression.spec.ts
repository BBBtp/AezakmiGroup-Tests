import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { apiError, translationSuccess } from '@support/niches';

const translationEndpoint = /^https:\/\/translation\.googleapis\.com\/language\/translate\/v2(?:\?|$)/;

test.describe('Niches → keyword translation', () => {
  test.beforeEach(async ({ dashboardPage, nichesPage }) => {
    await dashboardPage.navigate();
    await nichesPage.openFromSidebar();
    await nichesPage.openFirstDetail();
  });

  test('показывает элементы управления переводом', async ({ nichesPage }) => {
    await allure.allureId('978');
    await nichesPage.detail.expectTranslationControls();
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
  });

  test('переводит ключи одного GEO', async ({ network, nichesPage }) => {
    await allure.allureId('952');
    const before = await nichesPage.detail.rowKeywordsText();
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(2));
    await nichesPage.detail.translateRow();
    await expect.poll(() => nichesPage.detail.rowKeywordsText()).not.toBe(before);
  });

  test('переводит все GEO', async ({ network, nichesPage }) => {
    await allure.allureId('953');
    const before = await nichesPage.detail.rowKeywordsText(1);
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(5));
    await nichesPage.detail.translateEveryGeo();
    await expect.poll(() => nichesPage.detail.rowKeywordsText(1)).not.toBe(before);
  });

  test('переводит только выбранные GEO', async ({ network, nichesPage }) => {
    await allure.allureId('954');
    await nichesPage.detail.selectRows(0, 1);
    const selectedBefore = await nichesPage.detail.rowKeywordsText(0);
    const otherBefore = await nichesPage.detail.rowKeywordsText(1);
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(2));
    await nichesPage.detail.translateRow(0);
    await expect.poll(() => nichesPage.detail.rowKeywordsText(0)).not.toBe(selectedBefore);
    expect(await nichesPage.detail.rowKeywordsText(1)).toBe(otherBefore);
  });

  test('сохраняет числовые показатели после перевода', async ({ network, nichesPage }) => {
    await allure.allureId('955');
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(2));
    await nichesPage.detail.translateRow();
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
  });

  test('возвращает исходное отображение без второго mutation-запроса', async ({ network, nichesPage }) => {
    await allure.allureId('956');
    const initial = await nichesPage.detail.rowKeywordsText();
    await network.fulfillNextMutation(translationEndpoint, translationSuccess(5));
    await nichesPage.detail.translateEveryGeo();
    await expect.poll(() => nichesPage.detail.rowKeywordsText()).not.toBe(initial);
    await nichesPage.detail.translateEveryGeo();
    await expect.poll(() => nichesPage.detail.rowKeywordsText()).toBe(initial);
  });

  test('показывает ошибку перевода одного GEO', async ({ network, nichesPage }) => {
    await allure.allureId('957');
    await network.fulfillNextMutation(translationEndpoint, apiError, 500);
    await nichesPage.detail.translateRow();
    await nichesPage.expectTranslationFailureNotice();
    await nichesPage.detail.expectRowNumbersUnchanged(0, '2', 'twins ai');
  });

  test('показывает ошибку перевода всех GEO', async ({ network, nichesPage }) => {
    await allure.allureId('960');
    await network.fulfillNextMutation(translationEndpoint, apiError, 500);
    await nichesPage.detail.translateEveryGeo();
    await nichesPage.expectTranslationFailureNotice();
  });

  test('показывает состояние загрузки перевода', async ({ network, nichesPage }) => {
    await allure.allureId('962');
    const requests = network.captureRequests(
      (request) => request.method() !== 'GET' && translationEndpoint.test(request.url()),
    );
    const held = await network.holdNextMutation(translationEndpoint);
    await nichesPage.detail.translateRow();
    await held.started;
    await nichesPage.detail.expectTranslationPending();
    expect(requests.count).toBe(1);

    await held.abort();
    await nichesPage.detail.expectTranslationReady();
    expect(requests.count, 'loading state не должен запускать дополнительные запросы').toBe(1);
    requests.stop();
  });
});
