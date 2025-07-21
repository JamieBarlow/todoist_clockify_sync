import { ClockifyManager, FetchedTimeEntry } from "./clockify";
import { TodoistProjectManager, TodoistTaskManager } from "./todoist";
import { Task } from "@doist/todoist-api-typescript";
import { compareTimes, getUtcTime } from "./utility";

// Fetches new Clockify time entries and creates matching Todoist tasks (as meetings)
async function timeEntriesToTasks() {
  // Fetch Clockify API data and use to get today's time entries
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = clockifyManager.getWorkspaceId();
  const userId = await clockifyManager.fetchUserId(workspaceId);
  let timeEntries = await clockifyManager.fetchWeeklyTimeEntries(
    workspaceId,
    userId
  );
  timeEntries = clockifyManager.excludePastEntries(timeEntries); // Avoids re-posting items to Todoist that have already been synced from Todoist -> Clockify

  // Fetch ids for specific projects
  const fetchIds = async () => {
    const todoistProjectManager = new TodoistProjectManager();
    const projects = await todoistProjectManager.fetchProjects();
    const workAdminProject = projects.results.find((project) => {
      return project.name === "Work Admin";
    });
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

  // Get existing scheduled Todoist tasks over subsequent days. Fetch requests broken into smaller chunks due to 50 item Todoist API limit
  const todoistTaskManager = new TodoistTaskManager();
  const days = ["today", "tomorrow", "3 days", "4 days", "5 days"];
  let existingTasks: Task[] = [];
  let exclusions: string[] = ["!no date & !no time"];
  for (const day of days) {
    const filter = `${exclusions.join(" & ")} & ${day}`;
    await todoistTaskManager.fetchTasks(filter);
    existingTasks = existingTasks.concat(todoistTaskManager.getTasks());
    // Add the day to exclusions for the next iteration
    exclusions.push(`!${day}`);
  }
  console.log(`Total fetched tasks: ${existingTasks.length}`);

  function filterTodoistDuplicates(
    existingTasks: Task[],
    timeEntries: FetchedTimeEntry[]
  ) {
    const filteredTasks = timeEntries.filter((newTask) => {
      const newTaskTime = getUtcTime(`${newTask.timeInterval.start}`);
      const matchingTime = existingTasks.find((task) => {
        const taskTime = getUtcTime(`${task.due?.datetime}`);
        console.log(`Existing task: ${task.content}:${taskTime}`.bgMagenta);
        return compareTimes(taskTime, newTaskTime);
      });
      if (matchingTime) {
        console.log(`Duplicate found: ${matchingTime.content}`.bgRed);
        return false;
      } else {
        console.log(
          `New task added: ${newTask.description} ${newTask.timeInterval.start}`
            .bgGreen
        );
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
timeEntriesToTasks();
