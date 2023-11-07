type TaskCallback<T> = () => Promise<T>;
type Task<T> = {
  id: string;
  callback: TaskCallback<T>;
  promise?: Promise<T>;
};

export class TaskManager {
  private tasks: Map<string, Task<any>>;

  constructor() {
    this.tasks = new Map();
  }

  addTask<T>(id: string, taskCallback: TaskCallback<T>): void {
    if (this.tasks.has(id)) {
      throw new Error(`A task with the id "${id}" already exists.`);
    }

    const task: Task<T> = {
      id,
      callback: taskCallback,
      promise: undefined
    };

    task.promise = taskCallback()
      .then((result) => {
        this.tasks.delete(id);
        return result;
      })
      .catch((error) => {
        this.tasks.delete(id);
        throw error;
      });

    this.tasks.set(id, task);
  }

  // 获取任务的Promise，如果任务不存在则返回undefined
  getTaskPromise<T>(id: string): Promise<T> | undefined {
    return this.tasks.get(id)?.promise;
  }

  // 等待所有任务完成
  waitForAll(): Promise<any[]> {
    const promises = Array.from(this.tasks.values()).map((task) => task.promise);
    return Promise.all(promises);
  }

  // 检查所有任务是否已完成
  allTasksCompleted(): boolean {
    return this.tasks.size === 0;
  }

  // 取消所有任务
  cancelAll(): void {
    this.tasks.clear();
  }
}
