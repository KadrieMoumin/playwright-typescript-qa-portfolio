import { test as base, expect } from '@playwright/test';
import { TaskPage } from '../pages/task-page';

type TaskFixtures = { taskPage: TaskPage };

// Test-scoped: each test gets a page object backed by its isolated page fixture.
export const test = base.extend<TaskFixtures>({
  taskPage: async ({ page }, use) => {
    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await use(taskPage);
    // Playwright owns and closes the built-in page/context after the test.
  },
});

export { expect };
