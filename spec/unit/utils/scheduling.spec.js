import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { RRule } from 'rrule';
import scheduling from '@/utils/scheduling';

describe('scheduling', () => {
    describe('iCal frequencies', () => {
        it('lists the five frequencies', () => {
            expect(scheduling.iCal.frequencies).toEqual(['yearly', 'monthly', 'weekly', 'daily', 'hourly']);
        });

        it.each([
            ['yearly', RRule.YEARLY],
            ['monthly', RRule.MONTHLY],
            ['weekly', RRule.WEEKLY],
            ['daily', RRule.DAILY],
            ['hourly', RRule.HOURLY],
        ])('maps %s to its RRule frequency and back', (label, frequency) => {
            expect(scheduling.iCal.labelToRRuleFrequency(label)).toBe(frequency);
            expect(scheduling.iCal.rRuleFrequencyToLabel(frequency)).toBe(label);
        });

        it('maps an unknown label or frequency to undefined', () => {
            expect(scheduling.iCal.labelToRRuleFrequency('fortnightly')).toBeUndefined();
            expect(scheduling.iCal.rRuleFrequencyToLabel(RRule.MINUTELY)).toBeUndefined();
        });
    });

    describe('year offsets', () => {
        it('offers previous, current and next', () => {
            expect(scheduling.yearOffset.items).toEqual([
                { label: 'previous', value: -1 },
                { label: 'current', value: 0 },
                { label: 'next', value: 1 },
            ]);
        });

        it('maps each label to its offset', () => {
            expect(scheduling.yearOffset.labelToYearOffset).toEqual({ previous: -1, current: 0, next: 1 });
        });
    });

    // DocumentsCurrentBehavior: throws unless something else has loaded dayjs's
    // utc plugin. Should load the plugin itself. It works in the app only because
    // PlantingYearsTable and PlantingYearDetailsPage extend dayjs with it, and the
    // router imports both before anything formats a range. These two blocks run
    // in order: the first before the plugin is loaded, the second after
    describe('getFormattedDateRange, before anything loads the utc plugin', () => {
        it('throws', () => {
            expect(() => scheduling.getFormattedDateRange('05-15', '06-01')).toThrow(/\.utc is not a function/);
        });
    });

    describe('getFormattedDateRange, once the utc plugin is loaded', () => {
        beforeAll(() => {
            dayjs.extend(utc);
        });

        it('shows a range as two month-day dates', () => {
            expect(scheduling.getFormattedDateRange('05-15', '06-01')).toBe('May 15 - Jun 1');
        });

        it('shows one date when start and end are the same', () => {
            expect(scheduling.getFormattedDateRange('05-15', '05-15')).toBe('May 15');
        });

        it('reads the dates as UTC, so the timezone cannot shift them a day', () => {
            expect(scheduling.getFormattedDateRange('01-01', '12-31')).toBe('Jan 1 - Dec 31');
        });

        it('takes Feb 29, since the year it formats in is a leap year', () => {
            expect(scheduling.getFormattedDateRange('02-29', '02-29')).toBe('Feb 29');
        });

        it.each([
            ['no end', '05-15', null],
            ['no start', null, '06-01'],
            ['neither', undefined, undefined],
            ['an empty start', '', '06-01'],
        ])('is empty with %s', (_, start, end) => {
            expect(scheduling.getFormattedDateRange(start, end)).toBe('');
        });
    });
});
