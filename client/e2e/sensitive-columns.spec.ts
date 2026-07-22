import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(dirname, 'fixtures', 'sensitive-and-duplicates.csv');

test.describe('Sensitive columns confirmation', () => {
  test('shows the sensitive columns modal and applies the sensitive badge after confirming', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await page.getByTestId('process-document-btn').click();

    const modal = page.getByTestId('sensitive-columns-modal');
    const confirmBtn = modal.getByTestId('confirm-sensitive-columns-btn');
    await expect(confirmBtn).toBeVisible();

    // Modal cannot be dismissed via Escape - it must stay open.
    await page.keyboard.press('Escape');
    await expect(confirmBtn).toBeVisible();

    // Check the Email column checkbox so it gets tagged with the sensitive badge.
    await modal.getByRole('checkbox', { name: /Email/ }).check();
    await confirmBtn.click();

    await expect(confirmBtn).toBeHidden();
    await expect(page.getByTestId('result-table')).toBeVisible();
    await expect(page.getByTestId('result-table').getByText('sensitive').first()).toBeVisible();
  });

  test('leaving all columns unchecked confirms with no sensitive badges shown', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await page.getByTestId('process-document-btn').click();

    const modal = page.getByTestId('sensitive-columns-modal');
    const confirmBtn = modal.getByTestId('confirm-sensitive-columns-btn');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(confirmBtn).toBeHidden();
    await expect(page.getByTestId('result-table').getByText('sensitive')).toHaveCount(0);
  });
});
