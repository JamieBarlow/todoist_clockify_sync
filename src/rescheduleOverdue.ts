import { TodoistTaskManager } from "./todoist";

// Reschedules overdue Todoist tasks to today's date (without a start time). Note: handles daily recurring tasks but currently excludes weekly items since these will need rescheduling to a future week
async function rescheduleOverdue() {
  const todoistTaskManager = new TodoistTaskManager();
  await todoistTaskManager.fetchTasks("overdue & !#Subscriptions & !/Weekly");
  const overdueTasks = todoistTaskManager.getTasks();
  await todoistTaskManager.rescheduleTasks(overdueTasks, "today");
}
rescheduleOverdue();
