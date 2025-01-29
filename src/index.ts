import "dotenv/config";

const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;

import { TodoistApi } from "@doist/todoist-api-typescript";

if (!TODOIST_API_KEY) {
  throw new Error("Missing TODOIST_API_KEY in environment variables");
}
const todoist = new TodoistApi(TODOIST_API_KEY);

todoist
  .getProjects()
  .then((projects) => console.log(projects))
  .catch((error) => console.log(error));
