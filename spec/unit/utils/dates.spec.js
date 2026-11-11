import dayjs from 'dayjs';
import { fromLocalDate, toLocalDate, toLocalDateTime } from '@/utils/dates';

// The suite runs in America/New_York (vitest.config.js), where an evening is
// already the next day in UTC: the case these helpers exist for.
describe('toLocalDate', () => {
    it.each([
        ['a New York evening', new Date(2026, 6, 4, 21, 30), '2026-07-04'],
        ['the night the clocks go back', new Date(2026, 10, 1, 23, 30), '2026-11-01'],
        ['the night the clocks go forward', new Date(2026, 2, 8, 0, 30), '2026-03-08'],
        ['local midnight', new Date(2027, 4, 10), '2027-05-10'],
    ])('sends %s as the local day', (_, date, day) => {
        expect(toLocalDate(date)).toBe(day);
    });

    it('takes a dayjs object', () => {
        expect(toLocalDate(dayjs('2026-07-04T21:30:00'))).toBe('2026-07-04');
    });

    it("keeps a day the service sent, unchanged", () => {
        expect(toLocalDate('2026-07-01')).toBe('2026-07-01');
    });

    it.each([null, undefined])('passes %s through', value => {
        expect(toLocalDate(value)).toBe(value);
    });
});

describe('toLocalDateTime', () => {
    it.each([
        ['a New York evening', new Date(2026, 6, 4, 21, 30, 15), '2026-07-04T21:30:15'],
        ['the hour the clocks go back', new Date(2026, 10, 1, 1, 30), '2026-11-01T01:30:00'],
        ['local midnight', new Date(2026, 6, 1), '2026-07-01T00:00:00'],
    ])('sends %s as the local wall-clock time', (_, date, dateTime) => {
        expect(toLocalDateTime(date)).toBe(dateTime);
    });

    it('takes a dayjs object', () => {
        expect(toLocalDateTime(dayjs('2026-07-04T21:30:00'))).toBe('2026-07-04T21:30:00');
    });

    it('keeps a date and time the service sent, unchanged', () => {
        expect(toLocalDateTime('2026-07-04T21:30:00')).toBe('2026-07-04T21:30:00');
    });

    it.each([null, undefined])('passes %s through', value => {
        expect(toLocalDateTime(value)).toBe(value);
    });
});

describe('fromLocalDate', () => {
    it('reads a day the service sent as its local midnight', () => {
        expect(fromLocalDate('2026-07-04')).toEqual(new Date(2026, 6, 4));
    });

    it('reads the day the clocks go forward', () => {
        expect(fromLocalDate('2026-03-08')).toEqual(new Date(2026, 2, 8));
    });

    it('takes a Date', () => {
        expect(fromLocalDate(new Date(2026, 6, 4, 21, 30))).toEqual(new Date(2026, 6, 4, 21, 30));
    });

    it.each([null, undefined])('passes %s through', value => {
        expect(fromLocalDate(value)).toBe(value);
    });
});
