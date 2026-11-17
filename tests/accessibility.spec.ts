import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const state of ['empty', 'populated', 'completed'] as const) {
  test(`accessibility: ${state} task list`, async ({ page }, testInfo) => {
    await page.goto('/');
    if (state !== 'empty') {
      await page.getByLabel('New task').fill('Review accessibility');
      await page.getByRole('button', { name: 'Add task', exact: true }).click();
      await expect(page.getByRole('listitem')).toHaveCount(1);
    }
    if (state === 'completed') {
      await page.getByRole('checkbox', { name: 'Review accessibility', exact: true }).check();
      await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
    }
    // Scan the entire page, including landmarks. Do not exclude failing elements.
    const results = await new AxeBuilder({ page }).analyze();
    await testInfo.attach('axe-results', {
      body: JSON.stringify(results, null, 2), contentType: 'application/json',
    });
    expect(results.violations).toEqual([]);
  });
}
