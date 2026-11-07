import plotsApi from '@/api/plots-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const plot = { plotId: '', friendlyName: 'North bed', length: 10, width: 4 };

describe('plotsApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'upsertPlot',
            call: () => plotsApi.upsertPlot('a-token', plot),
            verb: 'put',
            url: `${serviceUrl}/plots`,
            body: plot,
        },
        {
            name: 'fetchPlots',
            call: () => plotsApi.fetchPlots('a-token'),
            verb: 'get',
            url: `${serviceUrl}/plots`,
        },
    ]);
});
