import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Checks: ключевые слова', () => {
  test('Edit keywords отменяет и подтверждает добавление с гарантированным откатом', async ({
    checksKeywords,
  }) => {
    await allure.allureId('589');

    await checksKeywords.navigate();
    const keyword = checksKeywords.nextKeyword();

    await checksKeywords.cancelAdding(keyword);
    const trackedKeyword = await checksKeywords.add(keyword);
    await checksKeywords.expectPersisted(keyword);
    await trackedKeyword.remove();
  });
});
