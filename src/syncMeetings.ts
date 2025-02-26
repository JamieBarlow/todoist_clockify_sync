import { ClockifyManager, FetchedTimeEntry } from "./clockify";
import { TodoistProjectManager, TodoistTaskManager } from "./todoist";
import { AddTaskArgs, Task } from "@doist/todoist-api-typescript";
import { compareTimes } from "./utility";

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
  timeEntries = clockifyManager.excludePastEntries(timeEntries); // Avoids re-posting items to Todoist that have already been synced from Todoist -> Clockify
  const todoistProjectManager = new TodoistProjectManager();
  const projects = await todoistProjectManager.fetchProjects();
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

  // Get existing Todoist tasks
  const todoistTaskManager = new TodoistTaskManager();
  await todoistTaskManager.fetchTasks("today");
  const existingTasks = todoistTaskManager.getTasks();

  function filterTodoistDuplicates(
    existingTasks: Task[],
    timeEntries: FetchedTimeEntry[]
  ) {
    const filteredTasks = timeEntries.filter((newTask) => {
      const newTaskTime = new Date(`${newTask.timeInterval.start}`);
      const matchingTime = existingTasks.find((task) => {
        const taskTime = new Date(`${task.due?.datetime}`);
        return compareTimes(taskTime, newTaskTime);
      });
      if (matchingTime) {
        console.log(`Duplicate found: ${matchingTime.content}`.bgRed);
        return false;
      } else {
        console.log(`New task added: ${newTask}`.bgGreen);
        return true;
      }
    });
    return filteredTasks;
  }
  const filteredTasks = filterTodoistDuplicates(existingTasks, timeEntries);
  const newTasks = clockifyManager.formatForTodoist(
    filteredTasks,
    workAdminProjectId,
    meetingsSectionId
  );
  // Add meetings as Todoist tasks
  await todoistTaskManager.createTasks(newTasks);
}
syncMeetingsToTasks();
