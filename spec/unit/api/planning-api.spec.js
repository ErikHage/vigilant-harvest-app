import planningApi from '@/api/planning-api';
import { describeServiceCalls, serviceUrl, withToken } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

describe('planningApi', () => {
    // A New York evening, already the next day in UTC: today is still the 4th
    beforeEach(() => {
        vi.useFakeTimers({ now: new Date('2026-07-04T21:30:00'), toFake: ['Date'] });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'fetchPlanningDetailsByYear',
            call: () => planningApi.fetchPlanningDetailsByYear('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/planning/2026`,
            config: withToken({ params: { today: '2026-07-04' } }),
        },
    ]);
});
