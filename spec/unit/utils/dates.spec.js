import dayjs from 'dayjs';
import { dayOfYearIn, daysFromToday, fromLocalDate, toLocalDate, toLocalDateTime } from '@/utils/dates';

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

describe('dayOfYearIn', () => {
    it.each([
        [2026, 1, '2026-01-01'],
        [2026, 60, '2026-03-01'],
        [2028, 60, '2028-02-29'],
        [2026, 365, '2026-12-31'],
        [2026, -5, '2025-12-26'],
        [8123, 121, '8123-05-01'],
    ])('reads day %i of %i as %s', (year, number, day) => {
        expect(toLocalDate(dayOfYearIn(year, number))).toBe(day);
    });
});

describe('daysFromToday', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    const at = now => vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });

    it.each([
        ['2026-07-04', 0],
        ['2026-07-05', 1],
        ['2026-07-01', -3],
        ['2027-07-04', 365],
    ])('counts the days to %s as %i', (day, days) => {
        at('2026-07-04T09:00:00');

        expect(daysFromToday(day)).toBe(days);
    });

    it('counts whole days, late in the evening', () => {
        at('2026-07-04T23:30:00');

        expect(daysFromToday('2026-07-05')).toBe(1);
    });

    it('counts the day the clocks go forward as one', () => {
        at('2026-03-07T12:00:00');

        expect(daysFromToday('2026-03-09')).toBe(2);
    });

    it('takes a dayjs object', () => {
        at('2026-07-04T09:00:00');

        expect(daysFromToday(dayjs('2026-07-14'))).toBe(10);
    });
});
