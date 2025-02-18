import { TodoistTaskManager } from "./todoist";

// Reschedules overdue Todoist tasks to today's date (without a start time)
async function rescheduleOverdue() {
  const todoistTaskManager = new TodoistTaskManager();
  const overdueTasks = await todoistTaskManager.fetchTasks(
    "overdue & !#Subscriptions & !/Weekly"
  );
  const taskIds = overdueTasks.results.map((task) => task.id);
  await todoistTaskManager.rescheduleTasks(taskIds, "today");
}
rescheduleOverdue();
