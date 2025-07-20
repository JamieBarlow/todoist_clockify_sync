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
exports.tasksToTimeEntries = tasksToTimeEntries;
const todoist_1 = require("./todoist");
const clockify_1 = require("./clockify");
const utility_1 = require("./utility");
// Populates Clockify time entries from Todoist tasks (once their time is passed), while avoiding duplicate entries
function tasksToTimeEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch list of Todoist tasks whose time has elapsed
        const todoistTaskManager = new todoist_1.TodoistTaskManager();
        const todoistProjectManager = new todoist_1.TodoistProjectManager();
        yield todoistTaskManager.fetchTasks("today & !#Habits & !#Subscriptions");
        todoistTaskManager.filterFutureTasks();
        todoistTaskManager.logTasks();
        // Get all project ids and names for fetched Todoist tasks
        const todoistProjectIds = todoistTaskManager.getTaskProjectIds();
        const todoistProjectNames = yield todoistProjectManager.getTaskProjectNames(todoistProjectIds);
        // Match each Todoist task with a Clockify project (if found)
        const clockifyManager = new clockify_1.ClockifyManager();
        yield clockifyManager.fetchClockifyWorkspaces();
        const workspaceId = clockifyManager.getWorkspaceId();
        const clockifyProjects = yield clockifyManager.fetchAllProjects(workspaceId);
        const projectIds = todoistProjectNames.map((projectName) => {
            var _a;
            const match = clockifyProjects.find((p) => p.name === projectName);
            return (_a = match === null || match === void 0 ? void 0 : match.id) !== null && _a !== void 0 ? _a : "";
        });
        // Convert tasks to Clockify time entries
        const newtimeEntries = todoistTaskManager.formatTasksForClockify(projectIds);
        // Filter out duplicate (pre-existing) Clockify entries
        function filterClockifyDuplicates() {
            return __awaiter(this, void 0, void 0, function* () {
                const userId = yield clockifyManager.fetchUserId(workspaceId);
                const existingTimeEntries = yield clockifyManager.fetchTodayTimeEntries(workspaceId, userId);
                const filtered = newtimeEntries.filter((newTimeEntry) => {
                    const match = existingTimeEntries.find((existing) => {
                        let matchingStartTime = false;
                        if (existing.timeInterval.start) {
                            const existingEntryDate = new Date(existing.timeInterval.start);
                            console.log(`Existing entry date: ${existingEntryDate} ${existing.description}`);
                            const timeEntryDate = new Date(newTimeEntry.start);
                            console.log(`New time Entry date: ${timeEntryDate} ${newTimeEntry.description}`);
                            matchingStartTime = (0, utility_1.compareTimes)(existingEntryDate, timeEntryDate);
                        }
                        return newTimeEntry.description === existing.description &&
                            matchingStartTime
                            ? true
                            : false;
                    });
                    if (match) {
                        console.log(`Duplicate found: ${newTimeEntry.description}`.bgRed);
                        return false;
                    }
                    else {
                        console.log(`New time entry added: ${newTimeEntry.start}`.bgGreen);
                        return true;
                    }
                });
                return filtered;
            });
        }
        const filteredTimeEntries = yield filterClockifyDuplicates();
        if (workspaceId) {
            for (const timeEntry of filteredTimeEntries) {
                clockifyManager.addTimeEntry(workspaceId, timeEntry);
            }
        }
    });
}
tasksToTimeEntries();
