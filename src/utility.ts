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

export const getZonedTime = (date: Date): Date => {
  const timeZone = "Europe/London";
  const zonedTime = toZonedTime(date, timeZone);
  return zonedTime;
};

export const getUtcTime = (localDate: Date): Date => {
  const timeZone = "Europe/London";
  const utcTime = fromZonedTime(localDate, timeZone);
  return utcTime;
};
