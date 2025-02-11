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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const clockifyManager = new clockify_1.ClockifyManager();
        yield clockifyManager.fetchClockifyWorkspaces();
        const workspaceId = clockifyManager.getWorkspaceId();
        const userId = yield clockifyManager.fetchUserIds(workspaceId);
        const timeEntries = yield clockifyManager.fetchTodayTimeEntries(workspaceId, userId);
    });
}
main();
