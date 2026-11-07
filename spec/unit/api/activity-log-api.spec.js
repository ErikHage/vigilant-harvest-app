import activityLogApi from '@/api/activity-log-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const entry = { activityType: 'Fertilize', subType: 'Bone Meal', plantingYear: 2026, notes: 'beans' };

describe('activityLogApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'upsertActivityLogEntry',
            call: () => activityLogApi.upsertActivityLogEntry('a-token', entry),
            verb: 'put',
            url: `${serviceUrl}/activity-log`,
            body: entry,
        },
        {
            name: 'fetchActivityLogEntriesByYear',
            call: () => activityLogApi.fetchActivityLogEntriesByYear('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/activity-log/2026`,
        },
    ]);
});
