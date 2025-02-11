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
    fetchUserIds(workspaceId) {
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
    fetchAllTimeEntries(workspaceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries`, { method: "GET", headers: headers });
                if (!response.ok) {
                    throw new Error(`Failed to fetch time entries: ${response.statusText}`);
                }
                const timeEntries = yield response.json();
                return timeEntries;
            }
            catch (error) {
                console.error(error);
            }
            return [];
        });
    }
    fetchTodayTimeEntries(workspaceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeEntries = yield this.fetchAllTimeEntries(workspaceId, userId);
            const today = new Date();
            const todayEntries = timeEntries.filter((entry) => {
                const date = new Date(`${entry.timeInterval.start}`);
                return compareDates(today, date);
            });
            console.log(`${JSON.stringify(todayEntries).bgWhite}`);
            return todayEntries;
        });
    }
    addTimeEntry(id, timeEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            const { billable, description, start, end, type, projectId } = timeEntry;
            const payload = {
                billable,
                description,
                start,
                end,
                type,
                projectId,
            };
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
                // catch async errors
            }
            catch (error) {
                console.error(`Error adding time entries: ${error}`.red);
            }
        });
    }
}
exports.ClockifyManager = ClockifyManager;
const compareDates = (d1, d2) => {
    if (d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()) {
        return true;
    }
    else {
        return false;
    }
};
