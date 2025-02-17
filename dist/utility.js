"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareTimes = exports.compareDates = void 0;
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
exports.compareDates = compareDates;
const compareTimes = (d1, d2) => {
    return d1.getTime() === d2.getTime() ? true : false;
};
exports.compareTimes = compareTimes;
