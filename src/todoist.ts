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
import { time } from "console";

if (!TODOIST_API_KEY) {
  throw new Error("Missing TODOIST_API_KEY in environment variables");
}
const todoist = new TodoistApi(TODOIST_API_KEY);
export class TodoistProjectManager {
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

  getAllProjects(): Project[] {
    return this.projects;
  }
  // Lists all project names associated with tasks
  async getTaskProjectNames(ids: string[]): Promise<string[]> {
    await this.fetchProjects();
    const allProjects = this.getAllProjects();
    const projectNames = ids.map((id) => {
      const project = allProjects.find((p) => p.id === id);
      if (project) {
        return project.name;
      } else {
        return "";
      }
    });
    return projectNames;
  }
}

export class TodoistTaskManager {
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
  getTaskProjectIds(): string[] {
    const ids = this.tasks.map((task) => task.projectId);
    return ids;
  }

  logTasks() {
    console.log(`Tasks due today: ${this.tasks.length}`.green);
    this.tasks.forEach((task) => console.log(`${task.content}`.blue));
  }

  // Calculates start and end times from the Todoist task's datetime value. Allows for conversion to Clockify tasks
  getTaskTiming(task: Task) {
    if (task.duration && task.due) {
      const duration = task.duration?.amount;
      console.log(task);
      const startTime = new Date(`${task.due?.datetime}`).toISOString();
      console.log(`${startTime}: type of ${typeof startTime}`.bgRed);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      const endTimeStr = endTime.toISOString();
      return {
        startTime: startTime,
        endTime: endTimeStr,
      };
    } else {
      console.log(task.content);
      console.log("No time for task".red);
      return {
        startTime: "",
        endTime: "",
      };
    }
  }

  formatTasksForClockify(projectNames?: string[]): TimeEntry[] {
    const timeEntries: TimeEntry[] = [];
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      const { startTime, endTime } = this.getTaskTiming(task);
      timeEntries.push({
        billable: false,
        description: task.content,
        start: startTime,
        end: endTime,
        type: "REGULAR",
        projectId: projectNames?.[i],
      });
    }
    console.log(`${JSON.stringify(timeEntries, null, 2)}`.bgCyan);
    return timeEntries;
  }
}
