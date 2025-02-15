import { ClockifyManager } from "./clockify";
import { TodoistTaskManager } from "./todoist";

async function syncMeetingsToTasks() {
  // Fetch Clockify API data and use to get today's time entries
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const userId = await clockifyManager.fetchUserId(workspaceId);
  const timeEntries = await clockifyManager.fetchTodayTimeEntries(
    workspaceId,
    userId
  );
  // Populate Todoist from time entries
  const tasks = clockifyManager.formatForTodoist(timeEntries);
  const todoistTaskManager = new TodoistTaskManager();
  await todoistTaskManager.createTask(tasks);
}
syncMeetingsToTasks();
