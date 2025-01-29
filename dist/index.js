"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
console.log("Todoist API Key:", process.env.TODOIST_API_KEY);
const todoist_api_typescript_1 = require("@doist/todoist-api-typescript");
if (!TODOIST_API_KEY) {
    throw new Error("Missing TODOIST_API_KEY in environment variables");
}
const todoist = new todoist_api_typescript_1.TodoistApi(TODOIST_API_KEY);
todoist
    .getProjects()
    .then((projects) => console.log(projects))
    .catch((error) => console.log(error));
