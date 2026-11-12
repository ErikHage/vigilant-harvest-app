import dayjs from 'dayjs';

// The service takes and sends the user's own wall-clock values, with no
// timezone: a day as YYYY-MM-DD, and a day and time as YYYY-MM-DDTHH:mm:ss.
// dayjs reads either as local time. Each helper takes a Date, a dayjs object
// or a string the service sent, and passes null and undefined through, so a
// field the user left alone goes out as it came in.

export function toLocalDate(date) {
    return date == null ? date : dayjs(date).format('YYYY-MM-DD');
}

export function toLocalDateTime(date) {
    return date == null ? date : dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
}

// A day the service sent, as the Date of its local midnight, for a component
// that takes a Date, such as a date picker
export function fromLocalDate(date) {
    return date == null ? date : dayjs(date).toDate();
}

// The planning service counts each day as its number in its own year,
// January 1 being 1. That number, as the day it is in `year`
export function dayOfYearIn(year, number) {
    return dayjs(`${year}-01-01`).add(number - 1, 'day');
}

// Whole days from the user's today to `day`, below zero once it's past
export function daysFromToday(day) {
    return dayjs(day).startOf('day').diff(dayjs().startOf('day'), 'day');
}
