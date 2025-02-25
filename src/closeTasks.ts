import { TodoistTaskManager } from "./todoist";

// Close all scheduled tasks with a 'Done' tag. Also close any meetings which are in the past, even if no 'Done' label is present
async function closeTasks() {
  const todoistTaskManager = new TodoistTaskManager();
  await todoistTaskManager.fetchTasks(
    "today & (!#Habits & !#Subscriptions & @Done & !(no time) | /Meetings)"
  );
  todoistTaskManager.removeFutureTasks();
  const tasks = todoistTaskManager.getTasks();
  tasks.forEach((task) => {
    // Remove 'Done' label to account for recurring tasks
    todoistTaskManager.removeLabels(task, "Done");
    todoistTaskManager.closeTask(task);
  });
}

closeTasks();
