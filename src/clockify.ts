import "dotenv/config";
import "colors";
import { StringMappingType } from "typescript";
import { AddTaskArgs } from "@doist/todoist-api-typescript";

const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;

interface ClockifyWorkspace {
  costRate: {};
  currencies: [];
  featureSubscriptionType: string;
  features: [];
  hourlyRate: {};
  id: string;
  imageUrl: string;
  memberships: [];
  name: string;
  subdomain: {};
  workspaceSettings: {};
}
type FetchWorkspacesResponse = ClockifyWorkspace[];

interface ClockifyProject {
  color: string;
  duration: string;
  id: string;
  memberships: [];
  name: string;
  note: string;
  public: boolean;
  workspaceId: string;
}
type FetchProjectsResponse = ClockifyProject[];

interface User {
  activeWorkspace: string;
  customFields?: [];
  defaultWorkspace: string;
  email: string;
  id: string;
  memberships: [];
  name: string;
  profilePicture: string;
  settings: {};
  status: string;
}
type FetchUserIdsResponse = User[];

export interface NewTimeEntry {
  billable: boolean;
  customAttributes?: [
    {
      name: string;
      namespace: string;
      value: string;
    }
  ];
  customFields?: [
    {
      customFieldId: string;
      sourceType: string;
      value: string;
    }
  ];
  description: string;
  end: string;
  projectId?: string;
  start: string;
  tagIds?: string[];
  taskId?: string;
  type: "REGULAR" | "BREAK";
}

interface FetchedTimeEntry {
  billable: boolean;
  costRate: {};
  customFieldValues: [];
  description: string;
  hourlyRate: {};
  id: string;
  isLocked: boolean;
  kioskId: string;
  projectId: string;
  tagIds?: [];
  taskId?: string;
  timeInterval: {
    start?: string;
    end?: string;
    duration?: string;
  };
  type: string;
  userId: string;
  workspaceId: string;
}

if (!CLOCKIFY_API_KEY) {
  throw new Error("Missing CLOCKIFY_API_KEY in environment variables");
}
const headers: HeadersInit = {
  "x-api-key": `${CLOCKIFY_API_KEY}`,
  "Content-Type": "application/json",
};

export class ClockifyManager {
  private workspaces: FetchWorkspacesResponse | undefined;
  private projects: FetchProjectsResponse | undefined;
  async fetchClockifyWorkspaces(): Promise<FetchWorkspacesResponse> {
    try {
      const response = await fetch(
        "https://api.clockify.me/api/v1/workspaces",
        {
          method: "GET",
          headers: headers,
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch workspaces: ${response.statusText}`.red
        );
      }
      const workspaces: FetchWorkspacesResponse = await response.json();
      this.workspaces = workspaces;
      return workspaces;
    } catch (error) {
      console.error(error);
    }
    return [];
  }

  getWorkspaceId(): string {
    if (this.workspaces) {
      return this.workspaces[0].id;
    }
    return "";
  }
  async fetchAllProjects(workspaceId: string): Promise<FetchProjectsResponse> {
    try {
      const response = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`.red);
      }
      const projects: FetchProjectsResponse = await response.json();
      this.projects = projects;
      return projects;
    } catch (error) {
      console.error(error);
    }
    return [];
  }

  async fetchUserId(workspaceId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/users`,
        { method: "GET", headers: headers }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch user Ids: ${response.statusText}`);
      }
      const userIds: FetchUserIdsResponse = await response.json();
      return userIds[0].id;
    } catch (error) {
      console.error(error);
    }
    return "";
  }

  async fetchAllTimeEntries(
    workspaceId: string,
    userId: string
  ): Promise<FetchedTimeEntry[]> {
    try {
      const response = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`,
        { method: "GET", headers: headers }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch time entries: ${response.statusText}`);
      }
      const timeEntries: FetchedTimeEntry[] = await response.json();
      return timeEntries;
    } catch (error) {
      console.error(error);
    }
    return [];
  }

  async fetchTodayTimeEntries(
    workspaceId: string,
    userId: string
  ): Promise<FetchedTimeEntry[]> {
    const timeEntries = await this.fetchAllTimeEntries(workspaceId, userId);
    const today = new Date();
    const todayEntries = timeEntries.filter((entry) => {
      const date = new Date(`${entry.timeInterval.start}`);
      return compareDates(today, date);
    });
    // console.log(`${JSON.stringify(todayEntries).bgWhite}`);
    return todayEntries;
  }

  // Takes in fetched Clockify time entries and formats for Todoist tasks
  formatForTodoist(
    timeEntries: FetchedTimeEntry[],
    projectId?: string,
    sectionId?: string
  ): AddTaskArgs[] {
    const tasks: AddTaskArgs[] = [];
    for (let i = 0; i < timeEntries.length; i++) {
      const { description, timeInterval } = timeEntries[i];
      // Formatting start date to submit as human defined time entry
      const today = new Date();
      const startTime = new Date(`${timeInterval.start}`);
      const endTime = new Date(`${timeInterval.end}`);
      const dueString = compareDates(today, startTime)
        ? `today at ${startTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : `${startTime.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
          })} at ${startTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`;

      // Getting time interval (duration) of task/time entry
      const duration: number =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const durationUnit = "minute";
      const priority = 3;
      const dueLang = "eng";

      // Getting projectId and sectionId for meetings
      const finalProjectId = projectId ?? ""; // Nullish coalescing to handle undefined/null
      const finalSectionId = sectionId ?? "";

      tasks.push({
        content: description,
        dueString,
        duration,
        durationUnit,
        dueLang,
        priority,
        projectId: finalProjectId,
        sectionId: finalSectionId,
      });
    }
    return tasks;
  }

  async addTimeEntry(id: string, timeEntry: NewTimeEntry): Promise<void> {
    const { billable, description, start, end, type, projectId } = timeEntry;
    const payload: NewTimeEntry = {
      billable,
      description,
      start,
      end,
      type,
      projectId,
    };
    try {
      const response = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${id}/time-entries`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload),
        }
      );
      // catch HTTP errors
      if (!response.ok) {
        console.error(
          `Failed to add time entry: ${
            response.statusText
          }, payload: ${JSON.stringify(payload, null, 2)}`.red
        );
        return;
      }
      // catch async errors
    } catch (error) {
      console.error(`Error adding time entries: ${error}`.red);
    }
  }
}

const compareDates = (d1: Date, d2: Date): boolean => {
  if (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  ) {
    return true;
  } else {
    return false;
  }
};
