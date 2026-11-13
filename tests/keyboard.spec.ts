import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('adds a task by pressing Enter', async ({ page }) => {
  const input = page.getByLabel('New task');
  await input.fill('Keyboard task');
  await input.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Keyboard task', exact: true })).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
  await expect(input).toBeEmpty();
});

test('Tab navigation reaches the form and task controls', async ({ page }) => {
  const input = page.getByLabel('New task');
  await input.fill('Navigate task');
  await input.press('Enter');
  // Start at a known focus point, then verify the actual Tab order.
  await input.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add task', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('checkbox', { name: 'Navigate task', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Delete Navigate task', exact: true })).toBeFocused();
});

test('Space completes and reopens a focused task', async ({ page }) => {
  const input = page.getByLabel('New task');
  await input.fill('Toggle task');
  await input.press('Enter');
  const checkbox = page.getByRole('checkbox', { name: 'Toggle task', exact: true });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
  await page.keyboard.press('Space');
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
});

test('deletes a task with the keyboard', async ({ page }) => {
  await page.getByLabel('New task').fill('Delete by keyboard');
  await page.getByLabel('New task').press('Enter');
  await page.getByRole('button', { name: 'Delete Delete by keyboard', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
});
