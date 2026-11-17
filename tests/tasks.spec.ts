import { test, expect } from '../fixtures/task.fixture';

test('adds a task', async ({ taskPage }) => {
  await taskPage.addTask('Practise Playwright');
  await expect(taskPage.taskCheckbox('Practise Playwright')).not.toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
  await expect(taskPage.newTaskInput).toBeEmpty();
});

test('completes a task', async ({ taskPage }) => {
  await taskPage.addTask('Write a test');
  await taskPage.completeTask('Write a test');
  await expect(taskPage.taskCheckbox('Write a test')).toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
});

test('deletes a task', async ({ taskPage }) => {
  await taskPage.addTask('Remove me');
  await taskPage.deleteTask('Remove me');
  await expect(taskPage.taskItems).toHaveCount(0);
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
});

test('rejects whitespace-only tasks', async ({ taskPage }) => {
  await taskPage.addTask('   ');
  await expect(taskPage.taskItems).toHaveCount(0);
});

test('completing one task leaves the other pending', async ({ taskPage }) => {
  for (const name of ['Write tests', 'Review tests']) {
    await taskPage.addTask(name);
  }
  await taskPage.completeTask('Write tests');
  await expect(taskPage.taskCheckbox('Review tests')).not.toBeChecked();
  await expect(taskPage.taskItems).toHaveCount(2);
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
});

test('reopening a completed task updates the remaining count', async ({ taskPage }) => {
  await taskPage.addTask('Reopen me');
  const task = taskPage.taskCheckbox('Reopen me');
  await taskPage.completeTask('Reopen me');
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
  await taskPage.reopenTask('Reopen me');
  await expect(task).not.toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
});

test('deletes only the selected task with a similar name', async ({ taskPage }) => {
  for (const name of ['Task', 'Task extra']) {
    await taskPage.addTask(name);
  }
  await taskPage.deleteTask('Task');
  await expect(taskPage.taskCheckbox('Task')).toHaveCount(0);
  await expect(taskPage.taskCheckbox('Task extra')).toBeVisible();
  await expect(taskPage.taskItems).toHaveCount(1);
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
});

test('trims surrounding spaces from task names', async ({ taskPage }) => {
  await taskPage.addTask('  Trim me  ');
  await expect(taskPage.taskItems.locator('span')).toHaveText('Trim me');
  await expect(taskPage.newTaskInput).toBeEmpty();
});

test('rejects an empty task with native required validation', async ({ taskPage }) => {
  await taskPage.addTaskButton.click();
  const missing = await taskPage.newTaskInput.evaluate(
    (input: HTMLInputElement) => input.validity.valueMissing,
  );
  expect(missing).toBe(true);
  await expect(taskPage.taskItems).toHaveCount(0);
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
});

test('preserves tasks and completion on reload', async ({ page, taskPage }) => {
  await taskPage.addTask('Persistent task');
  await taskPage.completeTask('Persistent task');
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
  await expect(taskPage.taskItems).toHaveCount(1);
  await page.reload();
  await expect(taskPage.taskItems).toHaveCount(1);
  await expect(taskPage.taskCheckbox('Persistent task')).toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
});
