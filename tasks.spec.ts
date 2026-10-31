import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('adds a task', async ({ page }) => {
  await page.getByLabel('New task').fill('Practise Playwright');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('checkbox', { name: 'Practise Playwright' })).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
  await expect(page.getByLabel('New task')).toBeEmpty();
});

test('completes a task', async ({ page }) => {
  await page.getByLabel('New task').fill('Write a test');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByRole('checkbox', { name: 'Write a test' }).check();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
});

test('deletes a task', async ({ page }) => {
  await page.getByLabel('New task').fill('Remove me');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByRole('button', { name: 'Delete Remove me' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
});

test('rejects whitespace-only tasks', async ({ page }) => {
  await page.getByLabel('New task').fill('   ');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});
