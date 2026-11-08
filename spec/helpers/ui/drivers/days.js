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

/** Today in New York, where the service runs: `YYYY-MM-DD`. */
export const todayInNewYork = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

/** The day's number in its year, January 1 being 1. */
export const dayOfYear = day => (utc(day) - Date.UTC(parts(day)[0], 0, 1)) / MILLIS_PER_DAY + 1;

/** The day `count` days after `day` (before, if negative). */
export const daysAfter = (day, count) => ymd(new Date(utc(day).getTime() + count * MILLIS_PER_DAY));

/** The day numbered `number` in `year`, as `YYYY-MM-DD`. */
export const numberedDay = (year, number) => daysAfter(`${String(year).padStart(4, '0')}-01-01`, number - 1);

/** As `Date.toDateString()` shows it: `Tue Jul 07 2026`. */
export const dateString = day => {
    const date = utc(day);
    return `${WEEKDAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, '0')} ${date.getUTCFullYear()}`;
};

/** As dayjs's `MMM D` shows it: `Mar 20`. */
export const monthAndDay = day => `${MONTHS[utc(day).getUTCMonth()]} ${utc(day).getUTCDate()}`;
