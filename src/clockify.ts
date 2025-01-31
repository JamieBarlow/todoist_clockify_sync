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

if (!CLOCKIFY_API_KEY) {
  throw new Error("Missing CLOCKIFY_API_KEY in environment variables");
}

class ClockifyManager {
  private workspaces: GetWorkspacesResponse | undefined;
  async fetchClockifyWorkspaces(): Promise<GetWorkspacesResponse> {
    try {
      const headers: HeadersInit = {
        "x-api-key": `${CLOCKIFY_API_KEY}`,
        "Content-Type": "application/json",
      };
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
}

async function main() {
  const clockifyManager = new ClockifyManager();
  await clockifyManager.fetchClockifyWorkspaces();
  console.log(`${clockifyManager.getWorkspaceId()}`.bgWhite);
}
main();
