import "dotenv/config";
import "colors";

const TODOIST_API_KEY = process.env.TODOIST_API_KEY;

import {
  GetProjectsResponse,
  GetTasksResponse,
  AddTaskArgs,
  Task,
  TodoistApi,
  Project,
  Section,
  GetSectionsArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  DueDate,
  Label,
} from "@doist/todoist-api-typescript";
import { NewTimeEntry } from "./clockify";
import { isAfter } from "./utility";

if (!TODOIST_API_KEY) {
  throw new Error("Missing TODOIST_API_KEY in environment variables");
}

// Extending arguments for adding a task in Todoist (not included in types but here https://developer.todoist.com/rest/v2/#create-a-new-task)
type AddTaskArgsExtended = AddTaskArgs & {
  duration?: number;
};

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
  async getProjectSections(projectId: GetSectionsArgs): Promise<Section[]> {
    try {
      const sections = await todoist.getSections(projectId);
      return sections.results;
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      return [];
    }
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

  async fetchTasks(filter: string): Promise<GetTasksResponse> {
    try {
      const response = await todoist.getTasks({
        filter,
      });
      this.tasks = response.results;
      return response;
    } catch (error) {
      console.error(`Error fetching tasks: ${error}`.red);
      throw error;
    }
  }
  // Getter method to access tasks
  getTasks(): Task[] {
    return this.tasks;
  }
  getTaskProjectIds(): string[] {
    const ids = this.tasks.map((task) => task.projectId);
    return ids;
  }

  logTasks(): void {
    console.log(`Tasks due today: ${this.tasks.length}`.green);
    this.tasks.forEach((task) => console.log(`${task.content}`.blue));
  }

  // Calculates start and end times from the Todoist task's datetime value. Allows for conversion to Clockify tasks
  getTaskTiming(task: Task) {
    if (task.duration && task.due && task.due.datetime) {
      const duration = task.duration?.amount;
      const startTime = new Date(`${task.due?.datetime}`).toISOString();
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      const endTimeStr = endTime.toISOString();
      return {
        startTime: startTime,
        endTime: endTimeStr,
      };
    } else {
      return {
        startTime: undefined,
        endTime: undefined,
      };
    }
  }

  async createTasks(
    taskOrTasks: AddTaskArgsExtended | AddTaskArgsExtended[]
  ): Promise<void> {
    // Ensure input is in an array (even if single value)
    const tasks = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];
    try {
      const results = await Promise.all(
        tasks.map((task) => {
          const {
            content,
            dueString,
            duration,
            durationUnit,
            dueLang,
            priority,
            projectId,
            sectionId,
          } = task;
          todoist.addTask({
            content,
            dueString,
            duration,
            durationUnit,
            dueLang,
            priority,
            projectId,
            sectionId,
          } as AddTaskArgs);
        })
      );
      console.log(JSON.stringify(results).bgGreen);
    } catch (error) {
      console.error(error);
    }
  }

  formatTasksForClockify(projectIds?: string[]): NewTimeEntry[] {
    const timeEntries: NewTimeEntry[] = [];
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      const { startTime, endTime } = this.getTaskTiming(task);
      if (startTime && endTime) {
        timeEntries.push({
          billable: false,
          description: task.content,
          start: startTime,
          end: endTime,
          type: "REGULAR",
          projectId: projectIds?.[i],
        });
      }
    }
    console.log(
      `Time entries: ${JSON.stringify(timeEntries, null, 2)}`.bgMagenta
    );
    return timeEntries;
  }

  removeFutureTasks() {
    this.tasks = this.tasks.filter((task) => {
      const now = new Date();
      if (!task.due?.datetime) return true; // Keep tasks without a due date
      const taskDue = new Date(task.due.datetime);
      return !isAfter(taskDue, now);
    });
  }

  async closeTask(task: Task): Promise<void> {
    try {
      await todoist.closeTask(task.id);
      console.log(`Successfully closed task: ${task.content}`.green);
    } catch (error) {
      console.error(`Error closing task: ${error}`.red);
      throw error;
    }
  }

  async removeLabels(task: Task, toRemove: string): Promise<void> {
    const { id, labels } = task;
    const filteredLabels = labels.filter((label) => label !== toRemove);
    try {
      await todoist.updateTask(id, { labels: filteredLabels });
      console.log(
        `Successfully removed labels from task: ${task.content} Updated labels: ${task.labels}`
          .green
      );
    } catch (error) {
      console.error(
        `Error updating task: ${error}. Labels: ${task.labels} `.red
      );
    }
  }

  // Allows you to reschedule a task/tasks to a given due date, defined by dueString
  async rescheduleTasks(
    taskId: string | string[],
    dueString: string
  ): Promise<void> {
    // Ensure input is in an array (even if single value) - allows for single or multiple values
    const taskIds = Array.isArray(taskId) ? taskId : [taskId];
    try {
      await Promise.all(
        taskIds.map(async (id) => {
          await todoist.updateTask(id, { dueString });
          console.log(`Task rescheduled successfully: ${id}}`.green);
        })
      );
    } catch (error) {
      console.error(`Error updating task: ${error}`.red);
      throw error;
    }
  }
}
