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
const clockify_1 = require("./clockify");
const todoist_1 = require("./todoist");
const utility_1 = require("./utility");
// Fetches new Clockify time entries and creates matching Todoist tasks (as meetings)
function syncMeetingsToTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch Clockify API data and use to get today's time entries
        const clockifyManager = new clockify_1.ClockifyManager();
        yield clockifyManager.fetchClockifyWorkspaces();
        const workspaceId = clockifyManager.getWorkspaceId();
        const userId = yield clockifyManager.fetchUserId(workspaceId);
        let timeEntries = yield clockifyManager.fetchTodayTimeEntries(workspaceId, userId);
        timeEntries = clockifyManager.excludePastEntries(timeEntries); // Avoids re-posting items to Todoist that have already been synced from Todoist -> Clockify
        const todoistProjectManager = new todoist_1.TodoistProjectManager();
        const projects = yield todoistProjectManager.fetchProjects();
        const workAdminProject = projects.results.find((project) => {
            return project.name === "Work Admin";
        });
        const fetchIds = () => __awaiter(this, void 0, void 0, function* () {
            const workAdminProjectId = workAdminProject === null || workAdminProject === void 0 ? void 0 : workAdminProject.id;
            let meetingsSectionId;
            if (workAdminProjectId) {
                const projectSections = yield todoistProjectManager.getProjectSections({
                    projectId: workAdminProjectId,
                });
                const meetingsSection = projectSections.find((section) => {
                    return section.name === "Meetings";
                });
                meetingsSectionId = meetingsSection === null || meetingsSection === void 0 ? void 0 : meetingsSection.id;
            }
            return { workAdminProjectId, meetingsSectionId };
        });
        const ids = yield fetchIds();
        const { workAdminProjectId, meetingsSectionId } = ids;
        // Get existing Todoist tasks
        const todoistTaskManager = new todoist_1.TodoistTaskManager();
        yield todoistTaskManager.fetchTasks("today");
        const existingTasks = todoistTaskManager.getTasks();
        function filterTodoistDuplicates(existingTasks, timeEntries) {
            const filteredTasks = timeEntries.filter((newTask) => {
                const newTaskTime = new Date(`${newTask.timeInterval.start}`);
                const matchingTime = existingTasks.find((task) => {
                    var _a;
                    const taskTime = new Date(`${(_a = task.due) === null || _a === void 0 ? void 0 : _a.datetime}`);
                    return (0, utility_1.compareTimes)(taskTime, newTaskTime);
                });
                if (matchingTime) {
                    console.log(`Duplicate found: ${matchingTime.content}`.bgRed);
                    return false;
                }
                else {
                    console.log(`New task added: ${newTask}`.bgGreen);
                    return true;
                }
            });
            return filteredTasks;
        }
        const filteredTasks = filterTodoistDuplicates(existingTasks, timeEntries);
        const newTasks = clockifyManager.formatForTodoist(filteredTasks, workAdminProjectId, meetingsSectionId);
        // Add meetings as Todoist tasks
        yield todoistTaskManager.createTasks(newTasks);
    });
}
syncMeetingsToTasks();
