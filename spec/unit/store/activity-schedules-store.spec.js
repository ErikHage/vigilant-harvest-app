import { createPinia, setActivePinia } from 'pinia';
import { useActivitySchedulesStore } from '@/store';
import activitySchedulesApi from '@/api/activity-schedules-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/activity-schedules-api');

const schedule = { activityScheduleId: 'schedule-1', name: 'Tomatoes', description: 'Feed every two weeks' };
const item = { activityScheduleId: 'schedule-1', entryId: 'item-1', activityType: 'Fertilize' };
const activityTypes = [{ id: 1, name: 'Fertilize', subTypes: [] }];

describe('useActivitySchedulesStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = useActivitySchedulesStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no schedules, none selected, and no activity types', () => {
        expect(store.schedules).toEqual([]);
        expect(store.selectedActivitySchedule).toBeNull();
        expect(store.activityTypes).toEqual([]);
    });

    describe.each([
        {
            action: 'fetchSchedules',
            args: [],
            api: 'listActivitySchedules',
            apiArgs: ['a-token'],
            result: [schedule],
            field: 'schedules',
            failure: 'error fetching activity schedules',
        },
        {
            action: 'getScheduleById',
            args: ['schedule-1'],
            api: 'getScheduleById',
            apiArgs: ['a-token', 'schedule-1'],
            result: schedule,
            field: 'selectedActivitySchedule',
            failure: 'error fetching activity schedule by id: schedule-1',
        },
        {
            action: 'updateSchedule',
            args: [schedule],
            api: 'updateActivitySchedule',
            apiArgs: ['a-token', schedule],
            result: { ...schedule, name: 'Peppers' },
            field: 'selectedActivitySchedule',
            failure: 'error updating activity schedule',
        },
        {
            action: 'fetchActivityTypes',
            args: [],
            api: 'fetchActivityTypes',
            apiArgs: [],
            result: activityTypes,
            field: 'activityTypes',
            failure: 'error fetching activity types',
        },
    ])('$action', ({ action, args, api, apiArgs, result, field, failure }) => {
        it(`stores what the service returns in ${field}`, async () => {
            activitySchedulesApi[api].mockResolvedValue(result);

            await store[action](...args);

            expect(activitySchedulesApi[api]).toHaveBeenCalledWith(...apiArgs);
            expect(store[field]).toEqual(result);
            expect(store.alertVisible).toBe(false);
        });

        it('shows an alert and logs, keeping what it had, when it fails', async () => {
            const err = httpError(500);
            activitySchedulesApi[api].mockRejectedValue(err);
            const before = store[field];

            await store[action](...args);

            expect(store.alertMessage).toBe(failure);
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store[field]).toEqual(before);
        });
    });

    describe.each([
        {
            action: 'createSchedule',
            args: [schedule],
            api: 'createActivitySchedule',
            apiArgs: ['a-token', schedule],
            failure: 'error adding activity schedule',
        },
        {
            action: 'addScheduleItem',
            args: ['schedule-1', item],
            api: 'addActivityScheduleItem',
            apiArgs: ['a-token', 'schedule-1', item],
            failure: 'error adding activity schedule item',
        },
        {
            action: 'updateScheduleItem',
            args: [item],
            api: 'updateActivityScheduleItem',
            apiArgs: ['a-token', item],
            failure: 'error updating activity schedule item',
        },
        {
            action: 'deleteScheduleItem',
            args: ['schedule-1', 'item-1'],
            api: 'deleteActivityScheduleItem',
            apiArgs: ['a-token', 'schedule-1', 'item-1'],
            failure: 'error deleting activity schedule item',
        },
    ])('$action', ({ action, args, api, apiArgs, failure }) => {
        it('calls the service, with no alert and no reload', async () => {
            activitySchedulesApi[api].mockResolvedValue({});

            await store[action](...args);

            expect(activitySchedulesApi[api]).toHaveBeenCalledWith(...apiArgs);
            expect(activitySchedulesApi.listActivitySchedules).not.toHaveBeenCalled();
            expect(activitySchedulesApi.getScheduleById).not.toHaveBeenCalled();
            expect(store.alertVisible).toBe(false);
        });

        // DocumentsCurrentBehavior: the failure is swallowed, so the dialog that
        // called it can't tell a failed save from a good one. Should rethrow, as
        // addPlantingYear does, so the dialog can stay open and say why
        it('shows an alert and logs when it fails, and still resolves', async () => {
            const err = httpError(400);
            activitySchedulesApi[api].mockRejectedValue(err);

            await expect(store[action](...args)).resolves.toBeUndefined();

            expect(store.alertMessage).toBe(failure);
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });
});
