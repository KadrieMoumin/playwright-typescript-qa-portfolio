import type { Locator, Page } from '@playwright/test';

/** Locators and interactions for the task list; assertions belong in tests. */
export class TaskPage {
  readonly newTaskInput: Locator;
  readonly addTaskButton: Locator;
  readonly remainingCount: Locator;
  readonly taskItems: Locator;

  constructor(readonly page: Page) {
    this.newTaskInput = page.getByLabel('New task', { exact: true });
    this.addTaskButton = page.getByRole('button', { name: 'Add task', exact: true });
    this.remainingCount = page.getByRole('status');
    this.taskItems = page.getByRole('list', { name: 'Tasks', exact: true }).getByRole('listitem');
  }

  async goto() {
    await this.page.goto('/');
  }

  taskCheckbox(name: string) {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  deleteButton(name: string) {
    return this.page.getByRole('button', { name: `Delete ${name}`, exact: true });
  }

  async addTask(name: string) {
    await this.newTaskInput.fill(name);
    await this.addTaskButton.click();
  }

  async completeTask(name: string) {
    await this.taskCheckbox(name).check();
  }

  async reopenTask(name: string) {
    await this.taskCheckbox(name).uncheck();
  }

  async deleteTask(name: string) {
    await this.deleteButton(name).click();
  }
}
