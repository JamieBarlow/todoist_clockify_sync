import { ClockifyManager } from "./clockify";

async function syncMeetingsToTasks() {
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const userId = await clockifyManager.fetchUserId(workspaceId);
  const timeEntries = await clockifyManager.fetchTodayTimeEntries(
    workspaceId,
    userId
  );
}
syncMeetingsToTasks();
