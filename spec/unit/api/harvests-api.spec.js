import axios from 'axios';
import harvestsApi from '@/api/harvests-api';
import { describeServiceCalls, serviceUrl, withToken } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const harvests = [
    { plantingId: 'planting-1', harvestDate: '2026-07-04', quantity: 3, harvestTypeId: 2 },
];

describe('harvestsApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'upsertHarvests',
            call: () => harvestsApi.upsertHarvests('a-token', harvests),
            verb: 'put',
            url: `${serviceUrl}/harvests`,
            body: { harvests },
        },
        {
            name: 'fetchHarvestSummary',
            call: () => harvestsApi.fetchHarvestSummary('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/harvests/summary`,
            config: withToken({ params: { plantingYear: 2026 } }),
        },
        {
            name: 'searchHarvests',
            call: () => harvestsApi.searchHarvests('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/harvests/search`,
            config: withToken({ params: { year: 2026 } }),
        },
        {
            name: 'fetchHarvestStats',
            call: () => harvestsApi.fetchHarvestStats('a-token', 2026, 'Planting'),
            verb: 'get',
            url: `${serviceUrl}/harvests/stats`,
            config: withToken({ params: { year: 2026, type: 'Planting' } }),
        },
    ]);

    // As params, as fetchHarvestSummary does, so axios leaves a missing year out
    // of the query, where these two once sent the text "null" (backlog B3)
    it.each([
        ['searchHarvests', () => harvestsApi.searchHarvests('a-token', null), `${serviceUrl}/harvests/search`, { year: null }],
        ['fetchHarvestStats', () => harvestsApi.fetchHarvestStats('a-token', null, 'Plant'), `${serviceUrl}/harvests/stats`, { year: null, type: 'Plant' }],
    ])('%s puts a missing year in params, not the URL', async (_, call, url, params) => {
        axios.get.mockResolvedValue({ data: [] });

        await call();

        expect(axios.get).toHaveBeenCalledWith(url, withToken({ params }));
        expect(axios.getUri({ url, params })).not.toContain('null');
    });
});
