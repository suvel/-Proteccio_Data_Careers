import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const INVALID_FIXTURE = path.resolve(dirname, 'fixtures', 'invalid-file.txt');

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
