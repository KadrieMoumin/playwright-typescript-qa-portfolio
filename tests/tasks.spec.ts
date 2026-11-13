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


test('completing one task leaves the other pending', async ({ page }) => {
  for (const name of ['Write tests', 'Review tests']) {
    await page.getByLabel('New task').fill(name);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
  }
  await page.getByRole('checkbox', { name: 'Write tests', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Review tests', exact: true })).not.toBeChecked();
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
});

test('reopening a completed task updates the remaining count', async ({ page }) => {
  await page.getByLabel('New task').fill('Reopen me');
  await page.getByRole('button', { name: 'Add task' }).click();
  const task = page.getByRole('checkbox', { name: 'Reopen me', exact: true });
  await task.check();
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
  await task.uncheck();
  await expect(task).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
});

test('deletes only the selected task with a similar name', async ({ page }) => {
  for (const name of ['Task', 'Task extra']) {
    await page.getByLabel('New task').fill(name);
    await page.getByRole('button', { name: 'Add task' }).click();
  }
  await page.getByRole('button', { name: 'Delete Task', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Task', exact: true })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Task extra', exact: true })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveText('1 tasks remaining');
});

test('trims surrounding spaces from task names', async ({ page }) => {
  await page.getByLabel('New task').fill('  Trim me  ');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem').locator('span')).toHaveText('Trim me');
  await expect(page.getByLabel('New task')).toBeEmpty();
});

test('rejects an empty task with native required validation', async ({ page }) => {
  await page.getByRole('button', { name: 'Add task' }).click();
  const missing = await page.getByLabel('New task').evaluate(
    (input: HTMLInputElement) => input.validity.valueMissing,
  );
  expect(missing).toBe(true);
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
});

test('resets tasks on reload as documented', async ({ page }) => {
  await page.getByLabel('New task').fill('Temporary task');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('0 tasks remaining');
});
