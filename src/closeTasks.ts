import { TodoistTaskManager } from "./todoist";
import { tasksToTimeEntries } from "./tasksToTimeEntries";
import { logger } from "./utility";

logger();
// Close all scheduled tasks with a 'Done' tag which are in the past. Also close any items from Work Admin /Meetings section which are in the past, even if no 'Done' label is present
async function closeTasks(syncTimeEntries = false) {
  try {
    if (syncTimeEntries) {
      console.log("Syncing time entries before closing tasks...");
      await tasksToTimeEntries();
    }
    console.log("Proceeding to close tasks...");
    const todoistTaskManager = new TodoistTaskManager();
    await todoistTaskManager.fetchTasks(
      "today & (!#Habits & !#Subscriptions & @Done & !(no time) | /Meetings)"
    );
    todoistTaskManager.filterFutureTasks();
    const tasks = todoistTaskManager.getTasks();
    tasks.forEach((task) => {
      // Remove 'Done' label to account for recurring tasks
      todoistTaskManager.removeLabels(task, "Done");
      todoistTaskManager.closeTask(task);
    });
  } catch (error) {
    console.error("Error while closing tasks:", error);
  }
}
const syncTimeEntriesFlag = process.argv.includes("--sync");
closeTasks(syncTimeEntriesFlag);
