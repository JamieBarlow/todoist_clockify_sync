import "dotenv/config";
import "colors";

const TODOIST_API_KEY = process.env.TODOIST_API_KEY;

import {
  GetProjectsResponse,
  GetTasksResponse,
  Task,
  TodoistApi,
  Project,
} from "@doist/todoist-api-typescript";
import { TimeEntry, ClockifyManager } from "./clockify";

if (!TODOIST_API_KEY) {
  throw new Error("Missing TODOIST_API_KEY in environment variables");
}
const todoist = new TodoistApi(TODOIST_API_KEY);
class TodoistProjectManager {
  private projects: Project[] = []; // Typed encapsulated state

  // Fetch all Todoist project objects
  async fetchProjects(): Promise<GetProjectsResponse> {
    try {
      const projects = await todoist.getProjects();
      this.projects = projects.results; // Store in state
      return projects;
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      return { results: [], nextCursor: null };
    }
  }

  // Log project IDs
  async logProjects(): Promise<void> {
    const projects = (await this.fetchProjects()).results;
    if (projects.length === 0) {
      console.log("No projects found.");
      return;
    }
    projects.forEach((project) => console.log(`${project.name}`.bgWhite));
  }

  // Getter for accessing stored projects
  getProjects(): Project[] {
    return this.projects;
  }
}

class TodoistTaskManager {
  private tasks: Task[] = []; // encapsulated state

  async fetchTasks() {
    try {
      const response = await todoist.getTasks({
        filter: "today & !#Habits & !#Subscriptions",
      });
      this.tasks = response.results;
    } catch (error) {
      console.error(`Error fetching tasks: ${error}`.red);
    }
  }
  // Getter method to access tasks
  getTasks() {
    return this.tasks;
  }

  logTasks() {
    console.log(`Tasks due today: ${this.tasks.length}`.green);
    this.tasks.forEach((task) => console.log(`${task.content}`.blue));
  }
  formatTasksForClockify() {
    const timeEntries: TimeEntry[] = [];
    this.tasks.forEach((task) => {
      timeEntries.push({
        billable: false,
        description: task.description,
        start: `${task.due?.datetime}Z` || "",
        end: `${task.due?.datetime}Z` || "",
        type: "REGULAR",
      });
    });
    console.log(`${JSON.stringify(timeEntries, null, 2)}`.bgCyan);
    return timeEntries;
  }
}

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
  // const todoistProjects = new TodoistProjectManager();
  // todoistProjects.fetchProjects();
  // todoistProjects.logProjects();
}
main();
