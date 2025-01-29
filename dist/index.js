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
const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
const todoist_api_typescript_1 = require("@doist/todoist-api-typescript");
if (!TODOIST_API_KEY) {
    throw new Error("Missing TODOIST_API_KEY in environment variables");
}
const todoist = new todoist_api_typescript_1.TodoistApi(TODOIST_API_KEY);
function getAllProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const projects = yield todoist.getProjects();
            return projects;
        }
        catch (error) {
            console.log(error);
        }
    });
}
function logProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        const projects = yield getAllProjects();
        const results = projects === null || projects === void 0 ? void 0 : projects.results;
        for (const project of results) {
            console.log(project.id);
        }
    });
}
logProjects();
function getActiveTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tasks = yield todoist.getTasks();
            console.log(tasks.results[0]);
        }
        catch (error) {
            console.log(error);
        }
    });
}
getActiveTasks();
