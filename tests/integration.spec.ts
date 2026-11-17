import { test, expect } from '../fixtures/task.fixture';

test('shows a task prepared by the API', async ({ createdTask, taskPage }) => {
  await taskPage.goto();
  await expect(taskPage.taskCheckbox(createdTask.text)).not.toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
});

test('a UI completion is saved in the API', async ({ createdTask, taskPage, taskApi }) => {
  await taskPage.goto();
  await taskPage.completeTask(createdTask.text);
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
  const response = await taskApi.request.get(`/api/tasks/${createdTask.id}`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ...createdTask, completed: true });
});
