import { test, expect } from '../fixtures/task.fixture';

for (const failure of ['server error', 'connection failure'] as const) {
  test(`failed create recovers after ${failure}`, async ({ page, taskPage, taskApi }) => {
    let fail = true;
    await page.route('**/api/tasks', async route => {
      if (route.request().method() !== 'POST' || !fail) return route.continue();
      fail = false;
      if (failure === 'connection failure') return route.abort('failed');
      await route.fulfill({ status: 500, json: { error: 'Simulated failure' } });
    });
    await taskPage.addTask('Retry this task');
    await expect(page.getByRole('alert')).toHaveText('Could not save task. Try again.');
    await expect(taskPage.newTaskInput).toHaveValue('Retry this task');
    await expect(taskPage.taskItems).toHaveCount(0);
    expect(await (await taskApi.request.get('/api/tasks')).json()).toEqual([]);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(taskPage.taskItems).toHaveCount(1);
    await expect(page.getByRole('alert')).toBeHidden();
    expect(await (await taskApi.request.get('/api/tasks')).json()).toHaveLength(1);
    await taskPage.goto();
    await expect(taskPage.taskCheckbox('Retry this task')).not.toBeChecked();
  });
}

test('a delayed save exposes pending state and prevents duplicate submission', async ({ page, taskPage }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let count = 0;
  await page.route('**/api/tasks', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    count++;
    await gate;
    await route.continue();
  });
  try {
    await taskPage.addTask('Delayed task');
    await expect.poll(() => count).toBe(1);
    await expect(taskPage.addTaskButton).toBeDisabled();
    await expect(taskPage.newTaskInput).toBeDisabled();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(taskPage.taskItems).toHaveCount(0);
  } finally { release(); }
  await expect(taskPage.taskItems).toHaveCount(1);
  await expect(taskPage.addTaskButton).toBeEnabled();
  expect(count).toBe(1);
});

for (const operation of ['PATCH', 'DELETE'] as const) {
  test(`failed ${operation} preserves saved state and supports retry`, async ({ page, createdTask, taskPage, taskApi }) => {
    await taskPage.goto();
    let fail = true;
    await page.route(`**/api/tasks/${createdTask.id}`, async route => {
      if (route.request().method() !== operation || !fail) return route.continue();
      fail = false;
      await route.fulfill({ status: 500, json: { error: 'Simulated failure' } });
    });
    // Use a raw user click: check() requires the state to remain checked,
    // whereas this failure scenario intentionally rolls the checkbox back.
    if (operation === 'PATCH') await taskPage.taskCheckbox(createdTask.text).click();
    else await taskPage.deleteTask(createdTask.text);
    await expect(page.getByRole('alert')).toContainText(operation === 'PATCH' ? 'Could not update' : 'Could not delete');
    await expect(taskPage.taskCheckbox(createdTask.text)).not.toBeChecked();
    const unchanged = await taskApi.request.get(`/api/tasks/${createdTask.id}`);
    expect(await unchanged.json()).toEqual(createdTask);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    if (operation === 'PATCH') {
      await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
      expect((await (await taskApi.request.get(`/api/tasks/${createdTask.id}`)).json()).completed).toBe(true);
    } else {
      await expect(taskPage.taskItems).toHaveCount(0);
      expect((await taskApi.request.get(`/api/tasks/${createdTask.id}`)).status()).toBe(404);
    }
  });
}

test('failed initial loading recovers through Retry', async ({ page, taskPage }) => {
  let fail = true;
  await page.route('**/api/tasks', async route => {
    if (route.request().method() !== 'GET' || !fail) return route.continue();
    fail = false;
    await route.fulfill({ status: 500, json: { error: 'Simulated failure' } });
  });
  await taskPage.goto();
  await expect(page.getByRole('alert')).toHaveText('Could not load tasks. Try again.');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('alert')).toBeHidden();
  await taskPage.addTask('Recovered');
  await expect(taskPage.taskItems).toHaveCount(1);
});


test('retry after a lost response does not create a duplicate', async ({ page, taskPage, taskApi }) => {
  let loseResponse = true;
  await page.route('**/api/tasks', async route => {
    if (route.request().method() !== 'POST' || !loseResponse) return route.continue();
    loseResponse = false;
    const saved = await route.fetch(); // Real backend commits before the browser loses the reply.
    expect(saved.status()).toBe(201);
    await route.abort('failed');
  });
  await taskPage.addTask('Saved but response lost');
  await expect(page.getByRole('alert')).toContainText('Could not save');
  await expect(taskPage.taskItems).toHaveCount(0);
  expect(await (await taskApi.request.get('/api/tasks')).json()).toHaveLength(1);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(taskPage.taskItems).toHaveCount(1);
  expect(await (await taskApi.request.get('/api/tasks')).json()).toHaveLength(1);
});
