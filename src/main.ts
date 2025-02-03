import { TodoistTaskManager, TodoistProjectManager } from "./todoist";
import { ClockifyManager } from "./clockify";

// Runs script
async function main() {
  const todoistTaskManager = new TodoistTaskManager();
  const todoistProjectManager = new TodoistProjectManager();
  // Fetch Todoist tasks, then their associated project ids and project names. From this data, create Clockify time entries
  await todoistTaskManager.fetchTasks();
  todoistTaskManager.logTasks();
  const projectIds = todoistTaskManager.getTaskProjectIds();
  const projectNames = await todoistProjectManager.getTaskProjectNames(
    projectIds
  );
  const timeEntries = todoistTaskManager.formatTasksForClockify(projectNames);

  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const clockifyProjects = await clockifyManager.fetchAllProjects(workspaceId);
  console.log(`${JSON.stringify(clockifyProjects, null, 2)}`.bgGreen);

  // if (workspaceId) {
  //   for (const timeEntry of timeEntries) {
  //     clockifyManager.addTimeEntry(workspaceId, timeEntry);
  //   }
  // }
}
main();
