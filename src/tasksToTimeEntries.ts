import { TodoistTaskManager, TodoistProjectManager } from "./todoist";
import { ClockifyManager } from "./clockify";
import { compareTimes, getZonedTime } from "./utility";

// Populates Clockify time entries from Todoist tasks (once their time is passed), while avoiding duplicate entries
export async function tasksToTimeEntries() {
  // Fetch list of Todoist tasks whose time has elapsed
  const todoistTaskManager = new TodoistTaskManager();
  const todoistProjectManager = new TodoistProjectManager();
  await todoistTaskManager.fetchTasks("today & !#Habits & !#Subscriptions");
  todoistTaskManager.filterFutureTasks();
  todoistTaskManager.logTasks();

  // Get all project ids and names for fetched Todoist tasks
  const todoistProjectIds = todoistTaskManager.getTaskProjectIds();
  const todoistProjectNames = await todoistProjectManager.getTaskProjectNames(
    todoistProjectIds
  );

  // Match each Todoist task with a Clockify project (if found)
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const clockifyProjects = await clockifyManager.fetchAllProjects(workspaceId);
  const projectIds = todoistProjectNames.map((projectName) => {
    const match = clockifyProjects.find((p) => p.name === projectName);
    return match?.id ?? "";
  });

  // Convert tasks to Clockify time entries
  const timeEntries = todoistTaskManager.formatTasksForClockify(projectIds);

  // Filter out duplicate (pre-existing) Clockify entries
  async function filterClockifyDuplicates() {
    const userId = await clockifyManager.fetchUserId(workspaceId);
    const existingTimeEntries = await clockifyManager.fetchTodayTimeEntries(
      workspaceId,
      userId
    );
    const filtered = timeEntries.filter((timeEntry) => {
      // Check for matching item name AND start time (same name may reoccur throughout day)
      const match = existingTimeEntries.find((existing) => {
        let matchingStartTime = false;
        if (existing.timeInterval.start) {
          const existingEntryDate = new Date(existing.timeInterval.start);
          console.log(`Existing entry date: ${existingEntryDate}`);
          const timeEntryDate = new Date(timeEntry.start);
          console.log(`Time Entry date: ${timeEntryDate}`);
          matchingStartTime = compareTimes(existingEntryDate, timeEntryDate);
        }
        return timeEntry.description === existing.description &&
          matchingStartTime
          ? true
          : false;
      });
      if (match) {
        console.log(`Duplicate found: ${timeEntry.description}`.bgRed);
        return false;
      } else {
        console.log(`New time entry added: ${timeEntry.start}`.bgGreen);
        return true;
      }
    });
    return filtered;
  }
  const filteredTimeEntries = await filterClockifyDuplicates();

  if (workspaceId) {
    for (const timeEntry of filteredTimeEntries) {
      clockifyManager.addTimeEntry(workspaceId, timeEntry);
    }
  }
}
tasksToTimeEntries();
