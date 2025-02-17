import { TodoistTaskManager, TodoistProjectManager } from "./todoist";
import { ClockifyManager } from "./clockify";
import { compareTimes } from "./utility";

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

  // Filter out duplicate entries (i.e. any time entries already present in Clockify)
  async function filterDuplicates() {
    const userId = await clockifyManager.fetchUserId(workspaceId);
    const existingTimeEntries = await clockifyManager.fetchTodayTimeEntries(
      workspaceId,
      userId
    );
    const filtered = timeEntries.filter((timeEntry) => {
      // Check for matching item name AND start time (same name may reoccur throughout day)
      const match = existingTimeEntries.find((existing) => {
        let matchingStartTime;
        if (existing.timeInterval.start) {
          const existingEntryDate = new Date(existing.timeInterval.start);
          const timeEntryDate = new Date(timeEntry.start);
          matchingStartTime = compareTimes(existingEntryDate, timeEntryDate);
        }
        if (
          timeEntry.description === existing.description &&
          matchingStartTime
        ) {
          return true;
        } else {
          return false;
        }
      });
      if (match) {
        console.log(`Duplicate found: ${timeEntry.description}`.bgRed);
        return false;
      } else {
        console.log(`New time entry added: ${timeEntry.description}`.bgGreen);
        return true;
      }
    });
    return filtered;
  }
  const filteredTimeEntries = await filterDuplicates();

  if (workspaceId) {
    for (const timeEntry of filteredTimeEntries) {
      clockifyManager.addTimeEntry(workspaceId, timeEntry);
    }
  }
}
main();
