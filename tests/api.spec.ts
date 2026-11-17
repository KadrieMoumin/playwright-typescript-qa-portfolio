import { randomUUID } from 'node:crypto';
import { test, expect } from '../fixtures/task.fixture';

test('creates, retrieves, completes and deletes a task', async ({ taskApi }) => {
  const created = await taskApi.request.post('/api/tasks', { data: { text: '  API task  ' } });
  expect(created.status()).toBe(201);
  const task = await created.json();
  expect(task).toMatchObject({ text: 'API task', completed: false });
  expect(created.headers().location).toBe(`/api/tasks/${task.id}`);
  const fetched = await taskApi.request.get(`/api/tasks/${task.id}`);
  expect(fetched.status()).toBe(200);
  expect(await fetched.json()).toEqual(task);
  const updated = await taskApi.request.patch(`/api/tasks/${task.id}`, { data: { completed: true } });
  expect(updated.status()).toBe(200);
  expect(await updated.json()).toEqual({ ...task, completed: true });
  const reopened = await taskApi.request.patch(`/api/tasks/${task.id}`, { data: { completed: false } });
  expect(reopened.status()).toBe(200);
  expect((await reopened.json()).completed).toBe(false);
  expect((await taskApi.request.delete(`/api/tasks/${task.id}`)).status()).toBe(204);
  expect((await taskApi.request.get(`/api/tasks/${task.id}`)).status()).toBe(404);
});

for (const text of ['', '   ', 'x'.repeat(501), 123, null]) {
  test(`rejects invalid text ${JSON.stringify(text).slice(0, 30)}`, async ({ taskApi }) => {
    const response = await taskApi.request.post('/api/tasks', { data: { text } });
    expect(response.status()).toBe(422);
    expect(await (await taskApi.request.get('/api/tasks')).json()).toEqual([]);
  });
}

test('accepts the 500 character boundary', async ({ taskApi }) => {
  const task = await taskApi.create('x'.repeat(500));
  expect(task.text).toHaveLength(500);
});

test('rejects malformed JSON', async ({ taskApi }) => {
  const response = await taskApi.request.post('/api/tasks', {
    data: '{', headers: { 'Content-Type': 'application/json' },
  });
  expect(response.status()).toBe(400);
});

test('rejects a non-JSON body', async ({ taskApi }) => {
  const response = await taskApi.request.post('/api/tasks', {
    data: 'text', headers: { 'Content-Type': 'text/plain' },
  });
  expect(response.status()).toBe(415);
});

test('rejects an oversized body', async ({ taskApi }) => {
  const response = await taskApi.request.post('/api/tasks', { data: { text: 'x'.repeat(20000) } });
  expect(response.status()).toBe(413);
});

for (const data of [{ completed: 'true' }, {}, { completed: true, text: 'unexpected' }]) {
  test(`rejects invalid patch ${JSON.stringify(data)}`, async ({ taskApi, createdTask }) => {
    const response = await taskApi.request.patch(`/api/tasks/${createdTask.id}`, { data });
    expect(response.status()).toBe(422);
    expect(await (await taskApi.request.get(`/api/tasks/${createdTask.id}`)).json()).toEqual(createdTask);
  });
}

test('returns 404 for an unknown task', async ({ taskApi }) => {
  const id = randomUUID();
  for (const method of ['get', 'patch', 'delete'] as const) {
    const response = await taskApi.request[method](`/api/tasks/${id}`, {
      ...(method === 'patch' ? { data: { completed: true } } : {}),
    });
    expect(response.status()).toBe(404);
  }
});

test('retrying the same create ID does not duplicate the task', async ({ taskApi }) => {
  const data = { id: randomUUID(), text: 'Retry safely' };
  expect((await taskApi.request.post('/api/tasks', { data })).status()).toBe(201);
  const repeat = await taskApi.request.post('/api/tasks', { data });
  expect(repeat.status()).toBe(200);
  expect((await repeat.json()).id).toBe(data.id);
  expect((await taskApi.request.post('/api/tasks', { data: { ...data, text: 'Different' } })).status()).toBe(409);
  expect(await (await taskApi.request.get('/api/tasks')).json()).toEqual([
    { ...data, completed: false },
  ]);
});

test('workspaces cannot read or delete each other tasks', async ({ taskApi, createdTask, playwright, baseURL }) => {
  const other = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { 'x-task-workspace': randomUUID() } });
  try {
    expect(await (await other.get('/api/tasks')).json()).toEqual([]);
    expect((await other.get(`/api/tasks/${createdTask.id}`)).status()).toBe(404);
    expect((await other.delete(`/api/tasks/${createdTask.id}`)).status()).toBe(404);
    expect((await other.delete('/api/tasks')).status()).toBe(204);
    expect((await taskApi.request.get(`/api/tasks/${createdTask.id}`)).status()).toBe(200);
  } finally { await other.dispose(); }
});

test('concurrent creates preserve all tasks', async ({ taskApi }) => {
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => taskApi.request.post('/api/tasks', { data: { text: `Task ${i}` } })));
  for (const response of results) expect(response.status()).toBe(201);
  const tasks = await (await taskApi.request.get('/api/tasks')).json();
  expect(tasks).toHaveLength(10);
  expect(new Set(tasks.map((task: { id: string }) => task.id)).size).toBe(10);
});

test('unsupported methods and invalid IDs have explicit contracts', async ({ taskApi }) => {
  const response = await taskApi.request.put('/api/tasks', { data: {} });
  expect(response.status()).toBe(405);
  expect(response.headers().allow).toBe('GET, POST, DELETE');
  expect((await taskApi.request.get('/api/tasks/not-a-uuid')).status()).toBe(400);
});


test('manual sessions retain their cookie and stay separate', async ({ playwright, baseURL }) => {
  // Clear Playwright Test's inherited workspace header to exercise real cookie sessions.
  const first = await playwright.request.newContext({ baseURL, extraHTTPHeaders: {} });
  const second = await playwright.request.newContext({ baseURL, extraHTTPHeaders: {} });
  try {
    const home = await first.get('/');
    expect(home.headers()['set-cookie']).toContain('HttpOnly');
    const saved = await first.post('/api/tasks', { data: { text: 'Cookie task' } });
    expect(saved.status()).toBe(201);
    expect(await (await first.get('/api/tasks')).json()).toHaveLength(1);
    expect(await (await second.get('/api/tasks')).json()).toEqual([]);
  } finally {
    try { await first.delete('/api/tasks'); await second.delete('/api/tasks'); }
    finally { await first.dispose(); await second.dispose(); }
  }
});
