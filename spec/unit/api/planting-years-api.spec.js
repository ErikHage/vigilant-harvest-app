import axios from 'axios';
import plantingYearsApi from '@/api/planting-years-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';
import { httpError } from '../../helpers/http-errors';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const plantingYearRequest = { plantingYear: 2027, lastFrostDate: '2027-05-10', firstFrostDate: '2027-10-12' };

describe('plantingYearsApi', () => {
    let log;

    beforeEach(() => {
        log = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    describeServiceCalls([
        {
            name: 'fetchPlantingYears',
            call: () => plantingYearsApi.fetchPlantingYears('a-token'),
            verb: 'get',
            url: `${serviceUrl}/planting-years`,
        },
        {
            name: 'fetchPlantingYear',
            call: () => plantingYearsApi.fetchPlantingYear('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/planting-years/2026`,
        },
        {
            name: 'addPlantingYear',
            call: () => plantingYearsApi.addPlantingYear('a-token', plantingYearRequest),
            verb: 'put',
            url: `${serviceUrl}/planting-years`,
            body: plantingYearRequest,
        },
    ]);

    describe('logs each failure', () => {
        beforeEach(() => {
            axios.get.mockRejectedValue(httpError(500));
            axios.put.mockRejectedValue(httpError(500));
        });

        it('when fetching the years', async () => {
            await plantingYearsApi.fetchPlantingYears('a-token').catch(() => {});

            expect(log).toHaveBeenCalledWith('error fetching planting years');
        });

        it('when fetching one year, naming it', async () => {
            await plantingYearsApi.fetchPlantingYear('a-token', 2026).catch(() => {});

            expect(log).toHaveBeenCalledWith('error fetching planting year 2026');
        });

        it('when adding a year, with the request shown as [object Object]', async () => {
            await plantingYearsApi.addPlantingYear('a-token', plantingYearRequest).catch(() => {});

            expect(log).toHaveBeenCalledWith('error adding planting year [object Object]');
        });
    });
});
