import { test, expect } from '../fixtures/task.fixture';

// Keep inputs deterministic; screenshots supplement the functional assertions.
test.describe('task-list appearance @visual', () => {
  test.use({ colorScheme: 'light', locale: 'en-GB', timezoneId: 'Europe/London' });

  for (const state of ['empty', 'populated', 'completed'] as const) {
    test(`${state} task list`, async ({ page, taskPage }) => {
      if (state !== 'empty') {
        await taskPage.addTask('Write regression tests');
        await taskPage.addTask('Review a longer task description for layout coverage');
        await expect(taskPage.taskItems).toHaveCount(2);
      }
      if (state === 'completed') {
        await taskPage.completeTask('Write regression tests');
        await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
      }
      // Remove incidental pointer/focus state before comparing the layout.
      await taskPage.addTaskButton.blur();
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${state}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixels: 0,
      });
    });
  }
});
