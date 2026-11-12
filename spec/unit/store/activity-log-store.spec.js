import { createPinia, setActivePinia } from 'pinia';
import { useActivityLogStore } from '@/store';
import activityLogApi from '@/api/activity-log-api';
import scheduleConstants from '@/api/static-data/activity-schedule';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/activity-log-api');

const entry = { activityType: 'FERTILIZE', subType: 'Bone Meal', plantingYear: 2026, notes: 'beans' };

describe('useActivityLogStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = useActivityLogStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no entries', () => {
        expect(store.activityLogEntries).toEqual([]);
    });

    describe('activityTypes', () => {
        it('are two fixed types with their subtypes', () => {
            expect(store.activityTypes).toEqual([
                {
                    name: 'FERTILIZE',
                    subTypes: [
                        'Miracle Grow',
                        'CalMag',
                        'Blood Meal',
                        'Bone Meal',
                        'Trifecta +',
                        'Crab and Lobster Shell Meal',
                        'True Organic Liquid All Purpose',
                        'Sulphur',
                        'Azomite',
                        'True Organic Tomato & Vegetable',
                        'Combo',
                    ],
                },
                {
                    name: 'TREAT',
                    subTypes: [
                        'Copper Fungicide',
                        'Insecticidal Soap',
                        'BT Thuricide',
                        'Neem Oil',
                        'Captain Jack Dead Bug',
                    ],
                },
            ]);
        });

        // The activity log and the activity schedules each have their own list,
        // with different names for the same kind of activity
        it("share no type names with the schedules' static list", () => {
            const logNames = store.activityTypes.map(type => type.name);
            const scheduleNames = scheduleConstants.activityTypes.map(type => type.name);

            expect(logNames.filter(name => scheduleNames.includes(name))).toEqual([]);
            expect(scheduleNames).toContain('Fertilize');
            expect(logNames).toContain('FERTILIZE');
        });
    });

    describe('fetchActivityLogEntriesByYear', () => {
        it("loads the year's entries", async () => {
            activityLogApi.fetchActivityLogEntriesByYear.mockResolvedValue([entry]);

            await store.fetchActivityLogEntriesByYear(2026);

            expect(activityLogApi.fetchActivityLogEntriesByYear).toHaveBeenCalledWith('a-token', 2026);
            expect(store.activityLogEntries).toEqual([entry]);
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            activityLogApi.fetchActivityLogEntriesByYear.mockResolvedValueOnce([entry]);
            await store.fetchActivityLogEntriesByYear(2026);
            const err = httpError(500);
            activityLogApi.fetchActivityLogEntriesByYear.mockRejectedValueOnce(err);

            await store.fetchActivityLogEntriesByYear(2026);

            expect(store.alertMessage).toBe('error fetching activity log entries by year');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.activityLogEntries).toEqual([entry]);
        });
    });

    describe('upsertActivityLogEntry', () => {
        it('saves the entry, with no alert and no reload', async () => {
            activityLogApi.upsertActivityLogEntry.mockResolvedValue({});

            await store.upsertActivityLogEntry(entry);

            expect(activityLogApi.upsertActivityLogEntry).toHaveBeenCalledWith('a-token', entry);
            expect(activityLogApi.fetchActivityLogEntriesByYear).not.toHaveBeenCalled();
            expect(store.alertVisible).toBe(false);
        });

        // The dialog that called it stays open, and says why
        it('shows an alert, logs, and rejects, when it fails', async () => {
            const err = httpError(400);
            activityLogApi.upsertActivityLogEntry.mockRejectedValue(err);

            await expect(store.upsertActivityLogEntry(entry)).rejects.toBe(err);

            expect(store.alertMessage).toBe('error upserting activity log entry');
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });
});
