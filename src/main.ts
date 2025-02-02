import { TodoistTaskManager, TodoistProjectManager } from "./todoist";
import { ClockifyManager } from "./clockify";

// Runs script
async function main() {
  const todoistTaskManager = new TodoistTaskManager();
  await todoistTaskManager.fetchTasks();
  todoistTaskManager.logTasks();
  const timeEntries = await todoistTaskManager.formatTasksForClockify();
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = await clockifyManager.getWorkspaceId();
  if (workspaceId) {
    for (const timeEntry of timeEntries) {
      clockifyManager.addTimeEntry(workspaceId, timeEntry);
    }
  }

  const todoistProjects = new TodoistProjectManager();
  todoistProjects.fetchProjects();
  todoistProjects.logProjects();
}
main();
