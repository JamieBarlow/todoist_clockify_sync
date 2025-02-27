import "dotenv/config";
import "colors";
import { StringMappingType } from "typescript";
import { compareDates, isAfter } from "./utility";
import { AddTaskArgs } from "@doist/todoist-api-typescript";
import { addDays, endOfDay, formatISO, startOfDay } from "date-fns";

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

export interface FetchedTimeEntry {
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

  // Fetch time entries within (optionally) a date range, defined by 'start' and 'end' params.
  async fetchTimeEntries(
    workspaceId: string,
    userId: string,
    start?: string,
    end?: string
  ): Promise<FetchedTimeEntry[]> {
    const queryParams = new URLSearchParams();
    if (start) queryParams.append("start", start);
    if (end) queryParams.append("end", end);
    try {
      const response = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries` +
          (queryParams.toString() ? `?${queryParams.toString()}` : ""),
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
    const start = formatISO(startOfDay(new Date()));
    const end = formatISO(endOfDay(new Date()));
    const timeEntries = await this.fetchTimeEntries(
      workspaceId,
      userId,
      start,
      end
    );
    return timeEntries;
  }

  async fetchWeeklyTimeEntries(
    workspaceId: string,
    userId: string
  ): Promise<FetchedTimeEntry[]> {
    const start = formatISO(startOfDay(new Date()));
    const end = formatISO(startOfDay(addDays(new Date(), 5)));
    const timeEntries = await this.fetchTimeEntries(
      workspaceId,
      userId,
      start,
      end
    );
    return timeEntries;
  }

  // Useful method for ensuring syncMeetings script is only populating future entries
  excludePastEntries(timeEntries: FetchedTimeEntry[]): FetchedTimeEntry[] {
    return timeEntries.filter((entry) => {
      const start = new Date(`${entry.timeInterval.start}`);
      const now = new Date();
      return isAfter(start, now);
    });
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
      ...(projectId && { projectId }), // conditionally include projectId - handles cases where projectId isn't present
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
