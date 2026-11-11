/**
 * Days as the harvests, stats and planning pages show them, worked out from
 * `YYYY-MM-DD` without the zone the suite runs in, so a driver can say what
 * a page should read.
 */

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parts = day => day.split('-').map(Number);
const utc = day => {
    const [year, month, date] = parts(day);
    return new Date(Date.UTC(year, month - 1, date));
};
const ymd = date => date.toISOString().slice(0, 10);

/**
 * Today in New York, where the browser runs (the config's `timezoneId`), as
 * the service does: `YYYY-MM-DD`.
 */
export const todayInNewYork = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

/** The day `count` days after `day` (before, if negative). */
export const daysAfter = (day, count) => ymd(new Date(utc(day).getTime() + count * MILLIS_PER_DAY));

/** The days from `from` to `to`, below zero if `to` is earlier. */
export const daysBetween = (from, to) => (utc(to) - utc(from)) / MILLIS_PER_DAY;

/** As `Date.toDateString()` shows it: `Tue Jul 07 2026`. */
export const dateString = day => {
    const date = utc(day);
    return `${WEEKDAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, '0')} ${date.getUTCFullYear()}`;
};

/** As dayjs's `MMM D` shows it: `Mar 20`. */
export const monthAndDay = day => `${MONTHS[utc(day).getUTCMonth()]} ${utc(day).getUTCDate()}`;
