import { randomUUID } from 'node:crypto';
import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { TaskPage } from '../pages/task-page';

export type TaskData = { id: string; text: string; completed: boolean };
export class TaskApi {
  constructor(readonly request: APIRequestContext) {}
  async create(text: string): Promise<TaskData> {
    const response = await this.request.post('/api/tasks', { data: { text } });
    expect(response.status(), 'API fixture creates a task').toBe(201);
    return response.json();
  }
}
type TaskFixtures = {
  workspaceId: string;
  taskApi: TaskApi;
  createdTask: TaskData;
  taskPage: TaskPage;
};
export const test = base.extend<TaskFixtures>({
  workspaceId: async ({}, use) => { await use(randomUUID()); },
  extraHTTPHeaders: async ({ workspaceId }, use) => {
    await use({ 'x-task-workspace': workspaceId });
  },
  taskApi: async ({ playwright, baseURL, workspaceId }, use) => {
    const request = await playwright.request.newContext({
      baseURL, extraHTTPHeaders: { 'x-task-workspace': workspaceId },
    });
    try { await use(new TaskApi(request)); }
    finally {
      try {
        const response = await request.delete('/api/tasks');
        expect(response.status(), 'Only this test workspace is cleaned up').toBe(204);
      } finally { await request.dispose(); }
    }
  },
  createdTask: async ({ taskApi }, use) => {
    await use(await taskApi.create('Prepared by API'));
  },
  taskPage: async ({ page, taskApi }, use) => {
    void taskApi; // Establish cleanup ownership even for tasks created through the UI.
    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await use(taskPage);
  },
});
export { expect };
