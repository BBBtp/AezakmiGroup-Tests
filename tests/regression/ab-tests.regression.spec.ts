import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { abTestListResponse, abTestsApi } from '@support/product/contracts';

test.describe('Product / A/B tests', () => {
  test('[TC-621] фильтры Team, App и Test type доступны', async ({ productPage }) => {
    await allure.allureId('621');
    await productPage.openAbTests();
    await productPage.abTests.openFilter('Team');
    await productPage.abTests.openFilter('App');
    await productPage.abTests.openFilter('Test type');
  });

  test('[TC-1006] все multi-select фильтры фокусируют Search и закрепляют Select all первым', async ({
    productPage,
  }) => {
    await allure.allureId('1006');
    await productPage.openAbTests();
    await productPage.abTests.expectFilterAutofocusAndSelectAllOrder();
  });

  test('[TC-1004] применение фильтра с поздней страницы сбрасывает пагинацию на первую', async ({
    productPage,
  }) => {
    await allure.allureId('1004');
    await productPage.openAbTests();
    await productPage.abTests.goToPage(7);
    await productPage.abTests.applySingleAppFilterAndExpectFirstPage();
  });

  test('[TC-1005] изменение Show сохраняет раскрытый A/B test', async ({ productPage }) => {
    await allure.allureId('1005');
    await productPage.openAbTests();
    await productPage.abTests.expectExpandedRowPreservedWhenShowChanges(30);
  });

  test('[TC-1003] длинные Comment и Technical task прокручиваются внутри модалки', async ({
    productPage,
  }) => {
    await allure.allureId('1003');
    await productPage.openAbTests();
    await productPage.abTests.expectLongCommentAndTechnicalTaskModals();
  });

  test('[TC-1007] повторное открытие A/B tests использует cache списка', async ({ network, productPage }) => {
    await allure.allureId('1007');
    const listRequests = network.captureRequests(
      (request) => request.method() === 'GET' && abTestsApi.list.test(request.url()),
    );
    await productPage.openAbTests();
    await productPage.abTests.expectRowsAndPagination();
    await productPage.leaveAndReturnToAbTestsViaSidebar();
    await productPage.abTests.expectRowsAndPagination();
    await listRequests.expectCount(1, 'Повторное открытие использует один запрос списка');
    listRequests.stop();
  });

  test('[TC-1008] initial file upload подсвечивается при hover и drag-hover', async ({ productPage }) => {
    await allure.allureId('1008');
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    await productPage.abTestCreate.expectInitialUploadVisualStates();
  });

  test('[TC-1047] ручная загрузка отключает Figma, но сохраняет импорт Apphud', async ({
    network,
    productPage,
  }) => {
    await allure.allureId('1047');
    const links = {
      figma: 'https://www.figma.com/file/codex-front-32/ab-test',
      apphud: 'https://app.apphud.com/projects/codex-front-32/ab-tests/42',
    };
    await network.fulfillNextSse(abTestsApi.prepareTask, 'POST', 'result', {
      units: [],
      tech_spec: '',
    });
    await productPage.openAbTests();
    await productPage.abTests.openCreate();

    const { request } = await network.waitForRequestWhile(
      { url: abTestsApi.prepareTask, method: 'POST' },
      () => productPage.abTestCreate.requestManualImportPreparation(links),
    );

    await scenarioCheck.deepEqual('Manual import отправляет только Apphud URL', request.postDataJSON(), {
      test_type: 'onboardings',
      apphud_url: links.apphud,
    });
  });

  test('[TC-1090] галерея A/B-теста переключает изображения стрелками клавиатуры', async ({
    network,
    productPage,
  }) => {
    await allure.allureId('1090');
    await network.mockJson(
      abTestsApi.list,
      'GET',
      abTestListResponse({ name: 'FRONTINC-4 keyboard gallery', screenshotCount: 3 }),
    );
    await productPage.openAbTests();
    await productPage.abTests.expectGalleryKeyboardNavigation();
  });

  test('[TC-1091] отсутствующие P-value старого внутреннего теста не отображаются как null', async ({
    network,
    productPage,
  }) => {
    await allure.allureId('1091');
    await network.mockJson(
      abTestsApi.list,
      'GET',
      abTestListResponse({ name: '9 from 30.06.25', nicheId: null, pValues: null }),
    );
    await productPage.openAbTests();
    await productPage.abTests.expectMissingPValuesRenderedWithoutTechnicalValues();
  });

  test('[TC-1095] поиск по названию приложения выделяет совпавший текст', async ({
    network,
    productPage,
  }) => {
    await allure.allureId('1095');
    const appName = 'ID 9250 Universal Search Application';
    await network.mockJson(
      abTestsApi.list,
      'GET',
      abTestListResponse({ name: 'FRONTINC-6 search', appName }),
    );
    await productPage.openAbTests();

    const { response } = await network.waitForResponseWhile(
      { url: abTestsApi.list, method: 'GET', status: 200 },
      () => productPage.abTests.searchByApplicationName('9250'),
    );

    await scenarioCheck.contains('Поиск передаёт часть названия приложения', response.url(), '9250');
    await productPage.abTests.expectApplicationNameHighlighted(appName, '9250');
  });

  test('[TC-622] список тестов показывает приложения и пагинацию', async ({ productPage }) => {
    await allure.allureId('622');
    await productPage.openAbTests();
    await productPage.abTests.expectRowsAndPagination();
  });

  test('[TC-623] Create test открывает форму без преждевременной мутации', async ({
    network,
    productPage,
  }) => {
    await allure.allureId('623');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/ab-tests'),
    );
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    await mutations.expectCount(0, 'Открытие Create test не отправляет мутацию');
    mutations.stop();
  });

  test('[TC-624] ссылка приложения из A/B test открывает соответствующий detail', async ({ productPage }) => {
    await allure.allureId('624');
    await productPage.openAbTests();
    await productPage.abTests.openFirstApplication();
  });

  test('[TC-625] фильтр Team: Our tests сохраняется после возврата', async ({ productPage }) => {
    await allure.allureId('625');
    await productPage.openAbTests();
    await productPage.abTests.expectTeamFilter();
    await productPage.abTests.openFirstApplication();
    await productPage.backToAbTests();
    await productPage.abTests.expectTeamFilter();
  });

  test('[TC-727] ошибка API отображается без устаревших строк', async ({ network, productPage }) => {
    await allure.allureId('727');
    await network.failNext(abTestsApi.list, 'GET', { message: 'Test failure' });
    await productPage.openAbTestsRoute();
    await productPage.abTests.expectError();
  });

  test('[TC-728] загрузочный state виден до ответа API', async ({ network, productPage }) => {
    await allure.allureId('728');
    const held = await network.holdNext(abTestsApi.list, 'GET');
    const opening = productPage.openAbTestsRoute();
    await held.started;
    await productPage.abTests.expectLoading();
    await held.abort();
    await opening;
  });

  test('[TC-729] пустой ответ API скрывает строки без технических значений', async ({
    network,
    productPage,
  }) => {
    await allure.allureId('729');
    await network.mockJson(abTestsApi.list, 'GET', abTestsApi.emptyList);
    await productPage.openAbTestsRoute();
    await productPage.abTests.expectEmpty();
  });

  test('[TC-730] пагинация сохраняет выбранный Team-контекст', async ({ productPage }) => {
    await allure.allureId('730');
    await productPage.openAbTests();
    await productPage.abTests.expectRowsAndPagination();
    await productPage.abTests.expectTeamFilter();
  });

  test('[TC-731] Create test не сохраняет пустой черновик', async ({ network, productPage }) => {
    await allure.allureId('731');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/ab-tests'),
    );
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    await mutations.expectCount(0, 'Пустой черновик Create test не отправляет мутацию');
    mutations.stop();
  });

  test('[TC-732] отмена Create test возвращает список без сохранения', async ({ network, productPage }) => {
    await allure.allureId('732');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/ab-tests'),
    );
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    await productPage.backToAbTests();
    await mutations.expectCount(0, 'Отмена Create test не отправляет мутацию');
    mutations.stop();
  });
});
