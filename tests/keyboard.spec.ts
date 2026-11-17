import { test, expect } from '../fixtures/task.fixture';

test('adds a task by pressing Enter', async ({ taskPage }) => {
  const input = taskPage.newTaskInput;
  await input.fill('Keyboard task');
  await input.press('Enter');
  await expect(taskPage.taskCheckbox('Keyboard task')).not.toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
  await expect(input).toBeEmpty();
});

test('Tab navigation reaches the form and task controls', async ({ page, taskPage }) => {
  const input = taskPage.newTaskInput;
  await input.fill('Navigate task');
  await input.press('Enter');
  // Start at a known focus point, then verify the actual Tab order.
  await input.focus();
  await page.keyboard.press('Tab');
  await expect(taskPage.addTaskButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(taskPage.taskCheckbox('Navigate task')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(taskPage.deleteButton('Navigate task')).toBeFocused();
});

test('Space completes and reopens a focused task', async ({ page, taskPage }) => {
  const input = taskPage.newTaskInput;
  await input.fill('Toggle task');
  await input.press('Enter');
  const checkbox = taskPage.taskCheckbox('Toggle task');
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
  await page.keyboard.press('Space');
  await expect(checkbox).not.toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
});

test('deletes a task with the keyboard', async ({ page, taskPage }) => {
  await taskPage.newTaskInput.fill('Delete by keyboard');
  await taskPage.newTaskInput.press('Enter');
  await taskPage.deleteButton('Delete by keyboard').focus();
  await page.keyboard.press('Enter');
  await expect(taskPage.taskItems).toHaveCount(0);
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
});
