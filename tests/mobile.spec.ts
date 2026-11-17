import { test, expect } from '../fixtures/task.fixture';

test('adds, completes and deletes a task using touch', async ({ taskPage }) => {
  const input = taskPage.newTaskInput;
  await input.tap();
  await input.fill('Mobile task');
  await taskPage.addTaskButton.tap();
  await expect(input).toBeEmpty();
  const checkbox = taskPage.taskCheckbox('Mobile task');
  await expect(checkbox).not.toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('1 tasks remaining');
  await checkbox.tap();
  await expect(checkbox).toBeChecked();
  await expect(taskPage.remainingCount).toHaveText('0 tasks remaining');
  await taskPage.deleteButton('Mobile task').tap();
  await expect(taskPage.taskItems).toHaveCount(0);
});

for (const width of [320, 375, 414]) {
  test(`long task remains usable at ${width}px width`, async ({ page, taskPage }) => {
    await page.setViewportSize({ width, height: 812 });
    await taskPage.goto();
    const name = 'LongTask'.repeat(20);
    await taskPage.newTaskInput.fill(name);
    await taskPage.addTaskButton.tap();
    await expect(taskPage.taskItems).toHaveCount(1);
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow, 'Page must not require horizontal scrolling').toBe(false);
    const remove = taskPage.deleteButton(name);
    await expect(remove).toBeInViewport({ ratio: 1 });
    await remove.tap();
    await expect(taskPage.taskItems).toHaveCount(0);
  });
}
