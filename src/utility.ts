import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Check for match between 2 dates (day/month/year)
export const compareDates = (d1: Date, d2: Date): boolean => {
  if (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  ) {
    return true;
  } else {
    return false;
  }
};

// Check for exact match between 2 dates and times
export const compareTimes = (d1: Date, d2: Date): boolean => {
  return d1.getTime() === d2.getTime() ? true : false;
};

export const getZonedTime = (date: Date | string | number): Date => {
  const timeZone = "Europe/London";
  const zonedTime = toZonedTime(date, timeZone);
  return zonedTime;
};

// Useful default for creating dates using a string. Handles conversion of non-UTC strings to UTC, or keeping UTC strings intact (can safely be used on UTC strings without double-conversion)
export const getUtcTime = (
  input: Date | string,
  timezone?: string | null | undefined
): Date => {
  if (input instanceof Date) return input;
  const isUtc = input.endsWith("Z");
  if (isUtc) {
    return new Date(input);
  } else {
    timezone ||= "Europe/London";
    return fromZonedTime(input, timezone);
  }
};

// Silent logging dependent on environment (use in combo with GitHub workflow actions)
export const logger = () => {
  if (process.env.LOG_LEVEL === "silent") {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
  }
};
