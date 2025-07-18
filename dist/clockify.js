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
exports.ClockifyManager = void 0;
require("dotenv/config");
require("colors");
const utility_1 = require("./utility");
const date_fns_1 = require("date-fns");
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
if (!CLOCKIFY_API_KEY) {
    throw new Error("Missing CLOCKIFY_API_KEY in environment variables");
}
const headers = {
    "x-api-key": `${CLOCKIFY_API_KEY}`,
    "Content-Type": "application/json",
};
class ClockifyManager {
    fetchClockifyWorkspaces() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch("https://api.clockify.me/api/v1/workspaces", {
                    method: "GET",
                    headers: headers,
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch workspaces: ${response.statusText}`.red);
                }
                const workspaces = yield response.json();
                this.workspaces = workspaces;
                return workspaces;
            }
            catch (error) {
                console.error(error);
            }
            return [];
        });
    }
    // Assumes there is only 1 workspace
    getWorkspaceId() {
        if (this.workspaces) {
            return this.workspaces[0].id;
        }
        return "";
    }
    fetchAllProjects(workspaceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects`, {
                    method: "GET",
                    headers: headers,
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch projects: ${response.statusText}`.red);
                }
                const projects = yield response.json();
                this.projects = projects;
                return projects;
            }
            catch (error) {
                console.error(error);
            }
            return [];
        });
    }
    fetchUserId(workspaceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/users`, { method: "GET", headers: headers });
                if (!response.ok) {
                    throw new Error(`Failed to fetch user Ids: ${response.statusText}`);
                }
                const userIds = yield response.json();
                return userIds[0].id;
            }
            catch (error) {
                console.error(error);
            }
            return "";
        });
    }
    // Fetch time entries within (optionally) a date range, defined by 'start' and 'end' params.
    fetchTimeEntries(workspaceId, userId, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParams = new URLSearchParams();
            if (start)
                queryParams.append("start", start);
            if (end)
                queryParams.append("end", end);
            try {
                const response = yield fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries` +
                    (queryParams.toString() ? `?${queryParams.toString()}` : ""), { method: "GET", headers: headers });
                if (!response.ok) {
                    throw new Error(`Failed to fetch time entries: ${response.statusText}`);
                }
                const timeEntries = yield response.json();
                console.log("Fetched time entries from Clockify:", JSON.stringify(timeEntries, null, 2));
                return timeEntries;
            }
            catch (error) {
                throw new Error("Failed to return Clockify time entries");
            }
        });
    }
    fetchTodayTimeEntries(workspaceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Defines today's date range for fetchTimeEntries()
            const start = new Date().toISOString();
            const end = (0, date_fns_1.endOfDay)(new Date()).toISOString();
            console.log(`Start of day: ${start}`);
            console.log(`End of day: ${end}`);
            const timeEntries = yield this.fetchTimeEntries(workspaceId, userId, start, end);
            return timeEntries;
        });
    }
    fetchWeeklyTimeEntries(workspaceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Defines weekly date range for fetchTimeEntries()
            const start = (0, date_fns_1.formatISO)((0, date_fns_1.startOfDay)((0, utility_1.getZonedTime)(new Date())));
            const end = (0, date_fns_1.formatISO)((0, date_fns_1.startOfDay)((0, utility_1.getZonedTime)((0, date_fns_1.addDays)(new Date(), 5))));
            console.log(`fetchWeeklyTimeEntries start of day: ${start}`);
            const timeEntries = yield this.fetchTimeEntries(workspaceId, userId, start, end);
            return timeEntries;
        });
    }
    // Useful method for ensuring timeEntriesToTasks script is only populating future entries
    excludePastEntries(timeEntries) {
        return timeEntries.filter((entry) => {
            const start = (0, utility_1.getZonedTime)(new Date(`${entry.timeInterval.start}`));
            const now = (0, utility_1.getZonedTime)(new Date());
            return (0, date_fns_1.isAfter)(start, now);
        });
    }
    // Takes in fetched Clockify time entries and formats for Todoist tasks
    formatForTodoist(timeEntries, projectId, sectionId) {
        const tasks = [];
        for (let i = 0; i < timeEntries.length; i++) {
            const { description, timeInterval } = timeEntries[i];
            // Formatting start date to submit as human defined time entry
            const today = (0, utility_1.getZonedTime)(new Date());
            const startTime = (0, utility_1.getZonedTime)(new Date(`${timeInterval.start}`));
            console.log(`formatForTodoist startTime: ${startTime}`);
            const endTime = (0, utility_1.getZonedTime)(new Date(`${timeInterval.end}`));
            const dueString = (0, utility_1.compareDates)(today, startTime)
                ? `today at ${startTime.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`
                : `${startTime.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                })} at ${startTime.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`;
            // Getting time interval (duration) of task/time entry
            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const durationUnit = "minute";
            const priority = 3;
            const dueLang = "eng";
            // Getting projectId and sectionId for meetings
            const finalProjectId = projectId !== null && projectId !== void 0 ? projectId : ""; // Nullish coalescing to handle undefined/null
            const finalSectionId = sectionId !== null && sectionId !== void 0 ? sectionId : "";
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
    addTimeEntry(id, timeEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            const { billable, description, start, end, type, projectId } = timeEntry;
            const payload = Object.assign({ billable,
                description,
                start,
                end,
                type }, (projectId && { projectId }));
            try {
                const response = yield fetch(`https://api.clockify.me/api/v1/workspaces/${id}/time-entries`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(payload),
                });
                // catch HTTP errors
                if (!response.ok) {
                    console.error(`Failed to add time entry: ${response.statusText}, payload: ${JSON.stringify(payload, null, 2)}`.red);
                    return;
                }
                const result = yield response.json();
                console.log("Time entry successfully added:", result);
                // catch async errors
            }
            catch (error) {
                console.error(`Error adding time entries: ${error}`.red);
            }
        });
    }
}
exports.ClockifyManager = ClockifyManager;
