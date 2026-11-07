import harvestTypesApi from '@/api/harvest-types-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

describe('harvestTypesApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'fetchHarvestTypes',
            call: () => harvestTypesApi.fetchHarvestTypes('a-token'),
            verb: 'get',
            url: `${serviceUrl}/harvest-types`,
        },
    ]);
});
