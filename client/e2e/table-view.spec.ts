import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_TEST_DIR = path.resolve(dirname, '..', '..', 'data_test');
const LARGE_CSV_FIXTURE = path.join(DATA_TEST_DIR, 'INFY-selected-columns.csv');
const DUPLICATES_FIXTURE = path.resolve(dirname, 'fixtures', 'sensitive-and-duplicates.csv');

async function uploadAndConfirm(page: import('@playwright/test').Page, filePath: string) {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await page.getByTestId('process-document-btn').click();

  const confirmSensitiveBtn = page
    .getByTestId('sensitive-columns-modal')
    .getByTestId('confirm-sensitive-columns-btn');
  if (await confirmSensitiveBtn.isVisible().catch(() => false)) {
    await confirmSensitiveBtn.click();
    await expect(confirmSensitiveBtn).toBeHidden();
  }
  await expect(page.getByTestId('result-table')).toBeVisible();
}

test.describe('Result table view', () => {
  test('toggles the column stats section', async ({ page }) => {
    await uploadAndConfirm(page, LARGE_CSV_FIXTURE);

    const toggle = page.getByTestId('toggle-column-stats');
    await expect(toggle).toContainText('hide');

    await toggle.click();
    await expect(toggle).toContainText('show');

    await toggle.click();
    await expect(toggle).toContainText('hide');
  });

  test('changes visible row count via the page-size select and navigates pages', async ({
    page,
  }) => {
    await uploadAndConfirm(page, LARGE_CSV_FIXTURE);

    await expect(page.getByTestId('pagination-summary')).toContainText('Showing 1–25 of');

    const rowsWithDefault = await page.getByTestId('result-table').locator('tbody tr').count();
    expect(rowsWithDefault).toBe(25);

    await page.locator('input.mantine-Select-input').click();
    await page.getByRole('option', { name: '10', exact: true }).click();

    await expect(page.getByTestId('pagination-summary')).toContainText('Showing 1–10 of');
    await expect(page.getByTestId('result-table').locator('tbody tr')).toHaveCount(10);

    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.getByTestId('pagination-summary')).toContainText('Showing 11–20 of');
  });

  test('shows the duplicate rows alert when duplicate rows are present', async ({ page }) => {
    await uploadAndConfirm(page, DUPLICATES_FIXTURE);

    await expect(page.getByTestId('duplicate-rows-alert')).toBeVisible();
    await expect(page.getByTestId('duplicate-rows-alert')).toContainText(
      'duplicates of each other',
    );
  });
});
