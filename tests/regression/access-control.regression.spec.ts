import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { test } from '@fixtures';

const protectedPaths = [
    '/dashboard',
    '/statistics',
    '/keywords',
    '/checks',
    '/niches',
    '/apps',
    '/ab-tests',
    '/kpi',
    '/employees',
    '/schedule',
    '/users',
    '/parameters',
];

test.describe('Контроль доступа', () => {
    test('Неавторизованный доступ к основным разделам заблокирован', async ({ browser }) => {
        await allure.allureId('567');

        const context = await browser.newContext({
            storageState: { cookies: [], origins: [] },
        });
        const page = await context.newPage();

        try {
            await test.step('Проверить доступ к закрытым URL без сессии', async () => {
                for (const path of protectedPaths) {
                    await page.goto(path, { waitUntil: 'commit' });
                    await expect(page).toHaveURL(/\/login(?:[/?]|$)/, {
                        timeout: 15000,
                    });
                }
            });
        } finally {
            await context.close();
        }
    });
});
