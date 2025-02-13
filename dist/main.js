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
const todoist_1 = require("./todoist");
const clockify_1 = require("./clockify");
// Runs script
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const todoistTaskManager = new todoist_1.TodoistTaskManager();
        const todoistProjectManager = new todoist_1.TodoistProjectManager();
        // Fetch Todoist tasks, then their associated project ids and project names.
        yield todoistTaskManager.fetchTasks();
        todoistTaskManager.logTasks();
        const todoistProjectIds = todoistTaskManager.getTaskProjectIds();
        const todoistProjectNames = yield todoistProjectManager.getTaskProjectNames(todoistProjectIds);
        // Fetch Clockify workspaces, and use id of workspace (assuming there is only 1) to fetch all projects (names and ids)
        const clockifyManager = new clockify_1.ClockifyManager();
        yield clockifyManager.fetchClockifyWorkspaces();
        const workspaceId = clockifyManager.getWorkspaceId();
        const clockifyProjects = yield clockifyManager.fetchAllProjects(workspaceId);
        // Check project name of each Todoist task against Clockify project names, and return the Clockify project id if they match
        const projectIds = todoistProjectNames.map((projectName) => {
            const projectMatch = clockifyProjects.find((p) => {
                return p.name === projectName;
            });
            if (projectMatch) {
                console.log(`Match!! ${projectMatch.id}`);
                return projectMatch.id;
            }
            else {
                return "";
            }
        });
        const timeEntries = todoistTaskManager.formatTasksForClockify(projectIds);
        if (workspaceId) {
            for (const timeEntry of timeEntries) {
                clockifyManager.addTimeEntry(workspaceId, timeEntry);
            }
        }
    });
}
main();
