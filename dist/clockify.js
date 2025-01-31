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
require("colors");
const CLOCKIFY_API_KEY = process.env.CLOCKIFY_API_KEY;
if (!CLOCKIFY_API_KEY) {
    throw new Error("Missing CLOCKIFY_API_KEY in environment variables");
}
class ClockifyManager {
    fetchClockifyWorkspaces() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const headers = {
                    "x-api-key": `${CLOCKIFY_API_KEY}`,
                    "Content-Type": "application/json",
                };
                const response = yield fetch("https://api.clockify.me/api/v1/workspaces", {
                    method: "GET",
                    headers: headers,
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch workspaces: ${response.statusText}`.red);
                }
                const workspaces = yield response.json();
                workspaces.forEach((workspace) => {
                    console.log(`Workspace name: ${workspace.name}. Workspace ID: ${workspace.id}`
                        .bgMagenta);
                });
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
        return this.workspaces;
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const clockifyManager = new ClockifyManager();
        yield clockifyManager.fetchClockifyWorkspaces();
        console.log(`${clockifyManager.getWorkspaceId()}`.bgWhite);
    });
}
main();
