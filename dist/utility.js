"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUtcTime = exports.getZonedTime = exports.compareTimes = exports.compareDates = void 0;
const date_fns_tz_1 = require("date-fns-tz");
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
const getZonedTime = (date) => {
    const timeZone = "Europe/London";
    const zonedTime = (0, date_fns_tz_1.toZonedTime)(date, timeZone);
    return zonedTime;
};
exports.getZonedTime = getZonedTime;
const getUtcTime = (localDate) => {
    const timeZone = "Europe/London";
    const utcTime = (0, date_fns_tz_1.fromZonedTime)(localDate, timeZone);
    return utcTime;
};
exports.getUtcTime = getUtcTime;
