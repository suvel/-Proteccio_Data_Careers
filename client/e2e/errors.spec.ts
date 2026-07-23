import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import type { StoredTable } from '../src/types';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const INVALID_FIXTURE = path.resolve(dirname, 'fixtures', 'invalid-file.txt');
const DATA_TEST_DIR = path.resolve(dirname, '..', '..', 'data_test');
const CSV_FIXTURE = path.join(DATA_TEST_DIR, 'INFY-selected-columns.csv');

const ERROR_BODY = { code: 'INTERNAL_ERROR', message: 'Could not reach storage' };

const SEEDED_TABLE: StoredTable = {
  id: 'seeded-1',
  title: 'Seeded table',
  tableObject: { headers: [], rows: [], colAttributes: [] },
};

test.describe('Upload error handling', () => {
  test('shows an error alert when an unparsable file is uploaded and does not crash the app', async ({
    page,
  }) => {
    await page.goto('/');

    // Bypass the file picker's accept filter to exercise server-side validation,
    // the same way the browser would if the OS file picker allowed it through.
    await page.locator('input[type="file"]').setInputFiles(INVALID_FIXTURE);
    await page.getByTestId('process-document-btn').click();

    const errorAlert = page.getByTestId('upload-error-alert');
    await expect(errorAlert).toBeVisible();

    // App remains usable: process button is re-enabled once a new file is chosen.
    await expect(page.getByTestId('result-table')).toHaveCount(0);
    await expect(page.getByTestId('process-document-btn')).toBeEnabled();
  });
});

test.describe('Stored tables error handling', () => {
  test('a failed fetch-all opens the drawer and shows the error there', async ({ page }) => {
    await page.route('**/table', (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(ERROR_BODY),
      });
    });

    await page.goto('/');

    const drawerAlert = page.getByTestId('stored-tables-drawer-error-alert');
    await expect(drawerAlert).toBeVisible();
    await expect(drawerAlert).toContainText(ERROR_BODY.message);
    await expect(page.getByTestId('store-table-error-alert')).toHaveCount(0);
  });

  test('a failed store shows the error above the result table and preserves the view', async ({
    page,
  }) => {
    await page.route('**/table', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify(ERROR_BODY),
        });
      }
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.continue();
    });

    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await page.getByTestId('store-title-input').fill('Q1 customer export');
    await page.getByTestId('store-confirm-btn').click();

    const storeAlert = page.getByTestId('store-table-error-alert');
    await expect(storeAlert).toBeVisible();
    await expect(storeAlert).toContainText('Failed to store table');
    await expect(storeAlert).toContainText(ERROR_BODY.message);

    // Modal stays open and the result view is preserved so the user can retry.
    await expect(page.getByTestId('store-title-input')).toBeVisible();
    await expect(page.getByTestId('result-table')).toBeHidden();
    await expect(page.getByTestId('stored-tables-drawer')).toBeHidden();
  });

  test('a failed delete shows the error inside the drawer and keeps the row', async ({ page }) => {
    await page.route('**/table', (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([SEEDED_TABLE]),
      });
    });
    await page.route('**/table/*', (route) => {
      if (route.request().method() !== 'DELETE') return route.continue();
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(ERROR_BODY),
      });
    });

    await page.goto('/');
    await page.getByTestId('stored-tables-toggle').click();

    const drawer = page.getByTestId('stored-tables-drawer');
    const seededRow = drawer.getByTestId('stored-table-row').filter({ hasText: 'Seeded table' });
    await expect(seededRow).toBeVisible();

    await seededRow.getByTestId('stored-table-drop-btn').click();

    const drawerAlert = page.getByTestId('stored-tables-drawer-error-alert');
    await expect(drawerAlert).toBeVisible();
    await expect(drawerAlert).toContainText(ERROR_BODY.message);
    await expect(seededRow).toBeVisible();
  });
});
