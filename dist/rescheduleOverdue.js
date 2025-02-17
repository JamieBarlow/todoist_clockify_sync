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
// Reschedules overdue Todoist tasks to today's date (without a start time)
function rescheduleOverdue() {
    return __awaiter(this, void 0, void 0, function* () {
        const todoistTaskManager = new todoist_1.TodoistTaskManager();
        const overdueTasks = yield todoistTaskManager.fetchTasks("overdue & !#Habits & !#Subscriptions");
        const taskIds = overdueTasks.results.map((task) => task.id);
        yield todoistTaskManager.rescheduleTasks(taskIds, "today");
    });
}
rescheduleOverdue();
