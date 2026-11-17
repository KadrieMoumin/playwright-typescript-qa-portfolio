import { test, expect } from '@playwright/test';

test('adds, completes and deletes a task using touch', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('New task');
  await input.tap();
  await input.fill('Mobile task');
  await page.getByRole('button', { name: 'Add task', exact: true }).tap();
  await expect(input).toBeEmpty();
  const checkbox = page.getByRole('checkbox', { name: 'Mobile task', exact: true });
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
  await checkbox.tap();
  await expect(checkbox).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
  await page.getByRole('button', { name: 'Delete Mobile task', exact: true }).tap();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

for (const width of [320, 375, 414]) {
  test(`long task remains usable at ${width}px width`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/');
    const name = 'LongTask'.repeat(20);
    await page.getByLabel('New task').fill(name);
    await page.getByRole('button', { name: 'Add task', exact: true }).tap();
    await expect(page.getByRole('listitem')).toHaveCount(1);
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow, 'Page must not require horizontal scrolling').toBe(false);
    const remove = page.getByRole('button', { name: `Delete ${name}`, exact: true });
    await expect(remove).toBeInViewport({ ratio: 1 });
    await remove.tap();
    await expect(page.getByRole('listitem')).toHaveCount(0);
  });
}
