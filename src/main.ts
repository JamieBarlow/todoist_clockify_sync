import { TodoistTaskManager, TodoistProjectManager } from "./todoist";
import { ClockifyManager } from "./clockify";

// Runs script
async function main() {
  const todoistTaskManager = new TodoistTaskManager();
  const todoistProjectManager = new TodoistProjectManager();
  // Fetch Todoist tasks, then their associated project ids and project names.
  await todoistTaskManager.fetchTasks();
  todoistTaskManager.logTasks();
  const todoistProjectIds = todoistTaskManager.getTaskProjectIds();
  const todoistProjectNames = await todoistProjectManager.getTaskProjectNames(
    todoistProjectIds
  );
  // Fetch Clockify workspaces, and use id of workspace (assuming there is only 1) to fetch all projects (names and ids)
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const clockifyProjects = await clockifyManager.fetchAllProjects(workspaceId);
  // Check project name of each Todoist task against Clockify project names, and return the Clockify project id if they match
  const projectIds = todoistProjectNames.map((projectName) => {
    const projectMatch = clockifyProjects.find((p) => {
      return p.name === projectName;
    });
    if (projectMatch) {
      console.log(`Match!! ${projectMatch.id}`);
      return projectMatch.id;
    } else {
      return "";
    }
  });

  const timeEntries = todoistTaskManager.formatTasksForClockify(projectIds);

  if (workspaceId) {
    for (const timeEntry of timeEntries) {
      clockifyManager.addTimeEntry(workspaceId, timeEntry);
    }
  }
}
main();
