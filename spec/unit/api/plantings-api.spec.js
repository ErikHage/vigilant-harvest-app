import plantingsApi from '@/api/plantings-api';
import { describeServiceCalls, serviceUrl, withToken } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const planting = { plantId: 'plant-1', plantingYear: 2026, name: 'Early beans', numSown: 12 };
const plantingUpdate = { name: 'Late beans', leadTimeWeeks: 2 };

describe('plantingsApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'updatePlanting',
            call: () => plantingsApi.updatePlanting('a-token', 'planting-1', plantingUpdate),
            verb: 'put',
            url: `${serviceUrl}/plantings/planting-1`,
            body: plantingUpdate,
        },
        {
            name: 'createPlanting',
            call: () => plantingsApi.createPlanting('a-token', planting),
            verb: 'post',
            url: `${serviceUrl}/plantings`,
            body: planting,
        },
        {
            name: 'performPlantingAction, with the action and its data in one body',
            call: () => plantingsApi.performPlantingAction('a-token', 'planting-1', 'PLANT', { plotId: 'plot-1' }),
            verb: 'post',
            url: `${serviceUrl}/plantings/planting-1`,
            body: { actionType: 'PLANT', plotId: 'plot-1' },
        },
        {
            name: 'performPlantingAction, with no data',
            call: () => plantingsApi.performPlantingAction('a-token', 'planting-1', 'RETIRE', undefined),
            verb: 'post',
            url: `${serviceUrl}/plantings/planting-1`,
            body: { actionType: 'RETIRE' },
        },
        {
            name: 'fetchPlantingsByYear',
            call: () => plantingsApi.fetchPlantingsByYear('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/plantings`,
            config: withToken({ params: { plantingYear: 2026 } }),
        },
        {
            name: 'fetchPlantingById',
            call: () => plantingsApi.fetchPlantingById('a-token', 'planting-1'),
            verb: 'get',
            url: `${serviceUrl}/plantings/planting-1`,
        },
    ]);
});
