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
exports.TodoistTaskManager = exports.TodoistProjectManager = void 0;
require("dotenv/config");
require("colors");
const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const todoist_api_typescript_1 = require("@doist/todoist-api-typescript");
if (!TODOIST_API_KEY) {
    throw new Error("Missing TODOIST_API_KEY in environment variables");
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
    getAllProjects() {
        return this.projects;
    }
    getProjectSections(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sections = yield todoist.getSections(projectId);
                return sections.results;
            }
            catch (error) {
                console.error("Failed to fetch sections:", error);
                return [];
            }
        });
    }
    // Lists all project names associated with tasks
    getTaskProjectNames(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchProjects();
            const allProjects = this.getAllProjects();
            const projectNames = ids.map((id) => {
                const project = allProjects.find((p) => p.id === id);
                if (project) {
                    return project.name;
                }
                else {
                    return "";
                }
            });
            return projectNames;
        });
    }
}
exports.TodoistProjectManager = TodoistProjectManager;
class TodoistTaskManager {
    constructor() {
        this.tasks = []; // encapsulated state
    }
    fetchTasks(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield todoist.getTasks({
                    filter,
                });
                this.tasks = response.results;
                return response;
            }
            catch (error) {
                console.error(`Error fetching tasks: ${error}`.red);
                throw error;
            }
        });
    }
    // Getter method to access tasks
    getTasks() {
        return this.tasks;
    }
    getTaskProjectIds() {
        const ids = this.tasks.map((task) => task.projectId);
        return ids;
    }
    logTasks() {
        console.log(`Tasks due today: ${this.tasks.length}`.green);
        this.tasks.forEach((task) => console.log(`${task.content}`.blue));
    }
    // Calculates start and end times from the Todoist task's datetime value. Allows for conversion to Clockify tasks
    getTaskTiming(task) {
        var _a, _b;
        if (task.duration && task.due) {
            const duration = (_a = task.duration) === null || _a === void 0 ? void 0 : _a.amount;
            const startTime = new Date(`${(_b = task.due) === null || _b === void 0 ? void 0 : _b.datetime}`).toISOString();
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + duration);
            const endTimeStr = endTime.toISOString();
            return {
                startTime: startTime,
                endTime: endTimeStr,
            };
        }
        else {
            return {
                startTime: undefined,
                endTime: undefined,
            };
        }
    }
    createTask(taskOrTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure input is in an array (even if single value)
            const tasks = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];
            try {
                const results = yield Promise.all(tasks.map((task) => {
                    const { content, dueString, duration, durationUnit, dueLang, priority, projectId, sectionId, } = task;
                    todoist.addTask({
                        content,
                        dueString,
                        duration,
                        durationUnit,
                        dueLang,
                        priority,
                        projectId,
                        sectionId,
                    });
                }));
                console.log(JSON.stringify(results).bgGreen);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    formatTasksForClockify(projectIds) {
        const timeEntries = [];
        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            const { startTime, endTime } = this.getTaskTiming(task);
            if (startTime && endTime) {
                timeEntries.push({
                    billable: false,
                    description: task.content,
                    start: startTime,
                    end: endTime,
                    type: "REGULAR",
                    projectId: projectIds === null || projectIds === void 0 ? void 0 : projectIds[i],
                });
            }
        }
        console.log(`Time entries: ${JSON.stringify(timeEntries, null, 2)}`.bgMagenta);
        return timeEntries;
    }
    closeTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield todoist.closeTask(task.id);
                console.log(`Successfully closed task: ${task.content}`.green);
            }
            catch (error) {
                console.error(`Error closing task: ${error}`.red);
                throw error;
            }
        });
    }
    rescheduleTasks(taskId, dueString) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure input is in an array (even if single value) - allows for single or multiple values
            const taskIds = Array.isArray(taskId) ? taskId : [taskId];
            console.log(`Task IDs: ${JSON.stringify(taskIds)}`);
            try {
                yield Promise.all(taskIds.map((id) => __awaiter(this, void 0, void 0, function* () {
                    yield todoist.updateTask(id, { dueString });
                    console.log(`Task rescheduled successfully: ${id}} rescheduled from ${dueString}`
                        .green);
                })));
            }
            catch (error) {
                console.error(`Error updating task: ${error}`.red);
                throw error;
            }
        });
    }
}
exports.TodoistTaskManager = TodoistTaskManager;
