import "dotenv/config";

const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;

import { GetTasksResponse, TodoistApi } from "@doist/todoist-api-typescript";

if (!TODOIST_API_KEY) {
  throw new Error("Missing TODOIST_API_KEY in environment variables");
}
const todoist = new TodoistApi(TODOIST_API_KEY);

async function getAllProjects() {
  try {
    const projects = await todoist.getProjects();
    return projects;
  } catch (error) {
    console.log(error);
  }
}

async function logProjects() {
  const projects = await getAllProjects();
  const results = projects?.results;
  for (const project of results!) {
    console.log(project.id);
  }
}
logProjects();

async function getActiveTasks() {
  try {
    const tasks = await todoist.getTasks({ filter: "today" });
    console.log(`Number of tasks with due date today: ${tasks.results.length}`);
    console.log(tasks);
    return tasks;
  } catch (error) {
    console.log(error);
  }
}
getActiveTasks();
