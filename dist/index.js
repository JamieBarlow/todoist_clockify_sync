"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("colors");
const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
const todoist_api_typescript_1 = require("@doist/todoist-api-typescript");
if (!TODOIST_API_KEY) {
    throw new Error("Missing TODOIST_API_KEY in environment variables");
}
if (!CLOCKIFY_API_KEY) {
    throw new Error("Missing CLOCKIFY_API_KEY in environment variables");
}
const todoist = new todoist_api_typescript_1.TodoistApi(TODOIST_API_KEY);
class TodoistProjectManager {
    constructor() {
        this.projects = []; // Typed encapsulated state
    }
    // Fetch all Todoist project objects
    fetchProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projects = yield todoist.getProjects();
                this.projects = projects.results; // Store in state
                return projects;
            }
            catch (error) {
                console.error("Failed to fetch projects:", error);
                return { results: [], nextCursor: null };
            }
        });
    }
    // Log project IDs
    logProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            const projects = (yield this.fetchProjects()).results;
            if (projects.length === 0) {
                console.log("No projects found.");
                return;
            }
            projects.forEach((project) => console.log(`${project.name}`.bgWhite));
        });
    }
    // Getter for accessing stored projects
    getProjects() {
        return this.projects;
    }
}
class TodoistTaskManager {
    constructor() {
        this.tasks = []; // encapsulated state
    }
    fetchTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield todoist.getTasks({ filter: "today" });
                this.tasks = response.results;
            }
            catch (error) {
                console.error(`Error fetching tasks: ${error}`.red);
            }
        });
    }
    // Getter method to access tasks
    getTasks() {
        return this.tasks;
    }
    logTasks() {
        console.log(`Tasks due today: ${this.tasks.length}`.green);
        this.tasks.forEach((task) => console.log(`${task.content}`.blue));
    }
}
class ClockifyManager {
    fetchClockifyWorkspaces() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const headers = {
                    "x-api-key": `${CLOCKIFY_API_KEY}`,
                    "Content-Type": "application/json",
                };
                const response = yield fetch("https://api.clockify.me/api/v1/workspaces", {
                    method: "GET",
                    headers: headers,
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch workspaces: ${response.statusText}`.red);
                }
                const workspaces = yield response.json();
                workspaces.forEach((workspace) => {
                    console.log(`Workspace name: ${workspace.name}. Workspace ID: ${workspace.id}`
                        .bgMagenta);
                });
                this.workspaces = workspaces;
                return workspaces;
            }
            catch (error) {
                console.error(error);
            }
            return [];
        });
    }
    getWorkspaceId() {
        if (this.workspaces) {
            return this.workspaces[0].id;
        }
        return this.workspaces;
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const clockifyManager = new ClockifyManager();
        yield clockifyManager.fetchClockifyWorkspaces();
        console.log(`${clockifyManager.getWorkspaceId()}`.bgWhite);
    });
}
main();
// // Runs script
// async function main() {
//   const todoistTaskManager = new TodoistTaskManager();
//   await todoistTaskManager.fetchTasks();
//   todoistTaskManager.logTasks();
//   const todoistProjects = new TodoistProjectManager();
//   todoistProjects.fetchProjects();
//   todoistProjects.logProjects();
// }
// main();
