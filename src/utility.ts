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

// Compares 2 dates/times, if d1 is later than d2 this will return true
export const isAfter = (d1: Date, d2: Date): boolean => {
  return d1.getTime() > d2.getTime() ? true : false;
};
