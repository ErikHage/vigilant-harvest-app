import axios from 'axios';
import activitySchedulesApi from '@/api/activity-schedules-api';
import scheduleConstants from '@/api/static-data/activity-schedule';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const schedule = {
    activityScheduleId: 'schedule-1',
    name: 'Tomatoes',
    description: 'Feed every two weeks',
    scheduleItems: [{ entryId: 'item-1' }],
};

// The fields an item is sent with, plus two that only say where it lives
const itemFields = {
    activityType: 'Fertilize',
    subType: 'Fish Emulsion',
    recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2',
    startDate: '05-15',
    startDateYearOffset: 0,
    endDate: '09-01',
    endDateYearOffset: 0,
    notes: 'half strength',
};
const item = { ...itemFields, activityScheduleId: 'schedule-1', entryId: 'item-1' };

describe('activitySchedulesApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'createActivitySchedule',
            call: () => activitySchedulesApi.createActivitySchedule('a-token', schedule),
            verb: 'post',
            url: `${serviceUrl}/activity-schedules`,
            body: schedule,
        },
        {
            name: 'listActivitySchedules',
            call: () => activitySchedulesApi.listActivitySchedules('a-token'),
            verb: 'get',
            url: `${serviceUrl}/activity-schedules`,
        },
        {
            name: 'getScheduleById',
            call: () => activitySchedulesApi.getScheduleById('a-token', 'schedule-1'),
            verb: 'get',
            url: `${serviceUrl}/activity-schedules/schedule-1`,
        },
        {
            name: 'updateActivitySchedule, sending only the name and description',
            call: () => activitySchedulesApi.updateActivitySchedule('a-token', schedule),
            verb: 'patch',
            url: `${serviceUrl}/activity-schedules/schedule-1`,
            body: { name: 'Tomatoes', description: 'Feed every two weeks' },
        },
        {
            name: 'addActivityScheduleItem, sending only the item fields',
            call: () => activitySchedulesApi.addActivityScheduleItem('a-token', 'schedule-1', item),
            verb: 'post',
            url: `${serviceUrl}/activity-schedules/schedule-1/schedule-items`,
            body: itemFields,
        },
        {
            name: "updateActivityScheduleItem, with the item's ids in the path",
            call: () => activitySchedulesApi.updateActivityScheduleItem('a-token', item),
            verb: 'patch',
            url: `${serviceUrl}/activity-schedules/schedule-1/schedule-items/item-1`,
            body: itemFields,
        },
        {
            name: 'deleteActivityScheduleItem',
            call: () => activitySchedulesApi.deleteActivityScheduleItem('a-token', 'schedule-1', 'item-1'),
            verb: 'delete',
            url: `${serviceUrl}/activity-schedules/schedule-1/schedule-items/item-1`,
        },
    ]);

    describe('fetchActivityTypes', () => {
        it('resolves the static list, without calling the service', async () => {
            await expect(activitySchedulesApi.fetchActivityTypes()).resolves.toBe(scheduleConstants.activityTypes);

            for (const verb of ['get', 'post', 'put', 'patch', 'delete']) {
                expect(axios[verb]).not.toHaveBeenCalled();
            }
        });
    });
});
