import { test, expect } from '../fixtures/task.fixture';
import AxeBuilder from '@axe-core/playwright';

for (const state of ['empty', 'populated', 'completed'] as const) {
  test(`accessibility: ${state} task list`, async ({ page, taskPage }, testInfo) => {
    if (state !== 'empty') {
      await taskPage.addTask('Review accessibility');
      await expect(taskPage.taskItems).toHaveCount(1);
    }
    if (state === 'completed') {
      await taskPage.completeTask('Review accessibility');
      await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
    }
    // Scan the entire page, including landmarks. Do not exclude failing elements.
    const results = await new AxeBuilder({ page }).analyze();
    await testInfo.attach('axe-results', {
      body: JSON.stringify(results, null, 2), contentType: 'application/json',
    });
    expect(results.violations).toEqual([]);
  });
}
