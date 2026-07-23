import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import type { StoredTable } from '../src/types';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const LARGE_SHEET_FIXTURE = path.resolve(dirname, 'fixtures', 'large-sheet.csv');
const SMALL_SHEET_FIXTURE = path.resolve(dirname, 'fixtures', 'sensitive-and-duplicates.csv');

const SEEDED_TABLES: StoredTable[] = Array.from({ length: 5 }, (_, i) => ({
  id: `seeded-${i}`,
  title: `Seeded ${i}`,
  tableObject: { headers: [], rows: [], colAttributes: [] },
}));

test.describe('Row/table limit handling', () => {
  test('rejects storing a sheet with more than MAX_ROW_SHEET_UPLOAD rows', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(LARGE_SHEET_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await page.getByTestId('store-title-input').fill('Too many rows');
    await page.getByTestId('store-confirm-btn').click();

    const storeAlert = page.getByTestId('store-table-error-alert');
    await expect(storeAlert).toBeVisible();
    await expect(storeAlert).toContainText('101 rows');
    await expect(storeAlert).toContainText('100 rows');

    // Blocked client-side before any network call: the result view and modal
    // stay in the same "rejected" state rather than clearing as a successful store would.
    await expect(page.getByTestId('store-title-input')).toBeHidden();
  });

  test('rejects storing once MAX_ROW_CAN_INSERT tables are already in the cloud', async ({ page }) => {
    await page.route('**/table', (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEEDED_TABLES),
      });
    });

    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(SMALL_SHEET_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await page.getByTestId('store-title-input').fill('One too many');
    await page.getByTestId('store-confirm-btn').click();

    const storeAlert = page.getByTestId('store-table-error-alert');
    await expect(storeAlert).toBeVisible();
    await expect(storeAlert).toContainText('5-table limit');
  });
});
