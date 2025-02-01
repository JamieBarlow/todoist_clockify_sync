import "dotenv/config";
import "colors";

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
type GetWorkspacesResponse = ClockifyWorkspace[];

interface TimeEntry {
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

class ClockifyManager {
  private workspaces: GetWorkspacesResponse | undefined;
  async fetchClockifyWorkspaces(): Promise<GetWorkspacesResponse> {
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
      const workspaces: GetWorkspacesResponse = await response.json();
      workspaces.forEach((workspace) => {
        console.log(
          `Workspace name: ${workspace.name}. Workspace ID: ${workspace.id}`
            .bgMagenta
        );
      });
      this.workspaces = workspaces;
      return workspaces;
    } catch (error) {
      console.error(error);
    }
    return [];
  }
  getWorkspaceId() {
    if (this.workspaces) {
      return this.workspaces[0].id;
    }
    return this.workspaces;
  }
  async addTimeEntry(id: string): Promise<void> {
    const payload: TimeEntry = {
      billable: false,
      description: "This is a sample time entry description",
      start: "2025-02-01T09:00:00Z",
      end: "2025-02-01T10:00:00Z",
      type: "REGULAR",
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
        console.error(`Failed to add time entries: ${response.statusText}`.red);
        return;
      }
      // catch async errors
    } catch (error) {
      console.error(`Error adding time entries: ${error}`.red);
    }
  }
}

async function main() {
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  const workspaceId = await clockifyManager.getWorkspaceId();
  if (workspaceId) {
    clockifyManager.addTimeEntry(workspaceId);
  }
}
main();
