import "dotenv/config";
import "colors";
import { StringMappingType } from "typescript";

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

export interface TimeEntry {
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

  async addTimeEntry(id: string, timeEntry: TimeEntry): Promise<void> {
    const { billable, description, start, end, type, projectId } = timeEntry;
    const payload: TimeEntry = {
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
