import planningApi from '@/api/planning-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

describe('planningApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'fetchPlanningDetailsByYear',
            call: () => planningApi.fetchPlanningDetailsByYear('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/planning/2026`,
        },
    ]);
});
