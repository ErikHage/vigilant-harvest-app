import dayjs from 'dayjs';

// The service takes the user's own wall-clock values, with no timezone: a day
// as YYYY-MM-DD, and a day and time as YYYY-MM-DDTHH:mm:ss. Each helper takes
// a Date, a dayjs object or a YYYY-MM-DD string the service sent (which dayjs
// reads as that local day), and passes null and undefined through, so a field
// the user left alone goes out as it came in.

export function toLocalDate(date) {
    return date == null ? date : dayjs(date).format('YYYY-MM-DD');
}

export function toLocalDateTime(date) {
    return date == null ? date : dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
}
