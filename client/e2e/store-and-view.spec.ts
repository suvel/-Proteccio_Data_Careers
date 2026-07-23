import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_TEST_DIR = path.resolve(dirname, '..', '..', 'data_test');
const CSV_FIXTURE = path.join(DATA_TEST_DIR, 'INFY-selected-columns.csv');

test.describe('Store and view stored tables', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows "No tables stored yet." before anything has been stored', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('stored-tables-toggle').click();

    const drawer = page.getByTestId('stored-tables-drawer');
    await expect(drawer.getByRole('heading', { name: 'Stored tables' })).toBeVisible();
    await expect(drawer.getByText('No tables stored yet.')).toBeVisible();
  });

  test('Store button stays disabled until a title is entered, then stores and lists the table', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await expect(page.getByTestId('store-confirm-btn')).toBeDisabled();

    await page.getByTestId('store-title-input').fill('Q1 customer export');
    await expect(page.getByTestId('store-confirm-btn')).toBeEnabled();
    await page.getByTestId('store-confirm-btn').click();

    // Storing clears the main view and the process button is gone again.
    await expect(page.getByTestId('result-table')).toBeHidden();

    await page.getByTestId('stored-tables-toggle').click();
    const drawer = page.getByTestId('stored-tables-drawer');
    await expect(drawer.getByRole('heading', { name: 'Stored tables' })).toBeVisible();

    const storedRow = drawer
      .getByTestId('stored-table-row')
      .filter({ hasText: 'Q1 customer export' });
    await expect(storedRow).toBeVisible();
    await expect(storedRow).toContainText('show stats');

    await storedRow.click();
    await expect(storedRow).toContainText('hide stats');

    await storedRow.getByTestId('stored-table-drop-btn').click();
    await expect(storedRow).toBeHidden();
  });

  test('Load button loads the stored table into the main view and closes the drawer', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await page.getByTestId('store-title-input').fill('Q1 customer export');
    await page.getByTestId('store-confirm-btn').click();
    await expect(page.getByTestId('result-table')).toBeHidden();

    await page.getByTestId('stored-tables-toggle').click();
    const drawer = page.getByTestId('stored-tables-drawer');
    const storedRow = drawer
      .getByTestId('stored-table-row')
      .filter({ hasText: 'Q1 customer export' });
    await storedRow.getByTestId('stored-table-load-btn').click();

    await expect(drawer).toBeHidden();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('stored-tables-toggle').click();
    const cleanupDrawer = page.getByTestId('stored-tables-drawer');
    const cleanupRow = cleanupDrawer
      .getByTestId('stored-table-row')
      .filter({ hasText: 'Q1 customer export' });
    await cleanupRow.getByTestId('stored-table-drop-btn').click();
    await expect(cleanupRow).toBeHidden();
  });

  test('Drop button removes the stored table from the list', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await page.getByTestId('store-title-input').fill('Q1 customer export');
    await page.getByTestId('store-confirm-btn').click();

    await page.getByTestId('stored-tables-toggle').click();
    const drawer = page.getByTestId('stored-tables-drawer');
    const storedRow = drawer
      .getByTestId('stored-table-row')
      .filter({ hasText: 'Q1 customer export' });
    await expect(storedRow).toBeVisible();

    await storedRow.getByTestId('stored-table-drop-btn').click();

    await expect(storedRow).toBeHidden();
    await expect(drawer.getByText('No tables stored yet.')).toBeVisible();
  });

  test('Cancel on the store modal discards the title and keeps the table unstored', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
    await page.getByTestId('process-document-btn').click();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('store-in-cloud-btn').click();
    await page.getByTestId('store-title-input').fill('Should not be saved');
    await page.getByTestId('store-cancel-btn').click();

    await expect(page.getByTestId('store-title-input')).toBeHidden();
    await expect(page.getByTestId('result-table')).toBeVisible();

    await page.getByTestId('stored-tables-toggle').click();
    await expect(
      page.getByTestId('stored-tables-drawer').getByText('No tables stored yet.'),
    ).toBeVisible();
  });
});
