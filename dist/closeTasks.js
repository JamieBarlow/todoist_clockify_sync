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
// Close all scheduled tasks with a 'Done' tag which are in the past. Also close any meetings which are in the past, even if no 'Done' label is present
function closeTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        const todoistTaskManager = new todoist_1.TodoistTaskManager();
        yield todoistTaskManager.fetchTasks("today & (!#Habits & !#Subscriptions & @Done & !(no time) | /Meetings)");
        todoistTaskManager.removeFutureTasks();
        const tasks = todoistTaskManager.getTasks();
        tasks.forEach((task) => {
            // Remove 'Done' label to account for recurring tasks
            todoistTaskManager.removeLabels(task, "Done");
            todoistTaskManager.closeTask(task);
        });
    });
}
closeTasks();
