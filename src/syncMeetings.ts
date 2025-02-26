import { ClockifyManager } from "./clockify";
import { TodoistProjectManager, TodoistTaskManager } from "./todoist";

// Fetches new Clockify time entries and creates matching Todoist tasks (as meetings)
async function syncMeetingsToTasks() {
  // Fetch Clockify API data and use to get today's time entries
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const userId = await clockifyManager.fetchUserId(workspaceId);
  let timeEntries = await clockifyManager.fetchTodayTimeEntries(
    workspaceId,
    userId
  );
  // Avoids re-posting items to Todoist that have already been synced from Todoist -> Clockify
  timeEntries = clockifyManager.excludePastEntries(timeEntries);
  // Populate Todoist from time entries
  const todoistProjectManager = new TodoistProjectManager();
  const projects = await todoistProjectManager.fetchProjects();
  // Using "Work Admin" project and "Meetings" section
  const workAdminProject = projects.results.find((project) => {
    return project.name === "Work Admin";
  });
  const fetchIds = async () => {
    const workAdminProjectId = workAdminProject?.id;
    let meetingsSectionId;
    if (workAdminProjectId) {
      const projectSections = await todoistProjectManager.getProjectSections({
        projectId: workAdminProjectId,
      });
      const meetingsSection = projectSections.find((section) => {
        return section.name === "Meetings";
      });
      meetingsSectionId = meetingsSection?.id;
    }
    return { workAdminProjectId, meetingsSectionId };
  };
  const ids = await fetchIds();
  const { workAdminProjectId, meetingsSectionId } = ids;
  const tasks = clockifyManager.formatForTodoist(
    timeEntries,
    workAdminProjectId,
    meetingsSectionId
  );
  // Add meetings as Todoist tasks
  const todoistTaskManager = new TodoistTaskManager();
  await todoistTaskManager.createTask(tasks);
}
syncMeetingsToTasks();
