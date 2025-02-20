"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAfter = exports.compareTimes = exports.compareDates = void 0;
// Check for match between 2 dates (day/month/year)
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
// Check for exact match between 2 dates and times
const compareTimes = (d1, d2) => {
    return d1.getTime() === d2.getTime() ? true : false;
};
exports.compareTimes = compareTimes;
// Compares 2 dates/times, if d1 is later than d2 this will return true
const isAfter = (d1, d2) => {
    return d1.getTime() > d2.getTime() ? true : false;
};
exports.isAfter = isAfter;
