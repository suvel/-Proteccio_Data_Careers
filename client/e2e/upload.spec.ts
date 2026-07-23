import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_TEST_DIR = path.resolve(dirname, '..', '..', 'data_test');
const CSV_FIXTURE = path.join(DATA_TEST_DIR, 'INFY-selected-columns.csv');
const XLSX_FIXTURE = path.join(DATA_TEST_DIR, 'NIFTY-small_set.xlsx');

test.describe('Upload and process document', () => {
  test('Process document button is disabled until a file is chosen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('process-document-btn')).toBeDisabled();
  });

  test('uploads a CSV file and displays the result table', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
    const processBtn = page.getByTestId('process-document-btn');
    await expect(processBtn).toBeEnabled();
    await processBtn.click();

    await expect(page.getByTestId('result-table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Symbol' })).toBeVisible();
    await expect(page.getByTestId('pagination-summary')).toContainText('of');
  });

  test('uploads an XLSX file and displays the result table', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(XLSX_FIXTURE);
    await page.getByTestId('process-document-btn').click();

    await expect(page.getByTestId('result-table')).toBeVisible();
    await expect(page.getByTestId('pagination-summary')).toContainText('of');
  });
});
