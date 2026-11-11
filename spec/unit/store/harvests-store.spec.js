import { createPinia, setActivePinia } from 'pinia';
import { useHarvestsStore } from '@/store';
import harvestsApi from '@/api/harvests-api';
import { apiError, httpError, serviceErrorBody } from '../../helpers/http-errors';

vi.mock('@/api/harvests-api');

const harvest = { plantingYear: 2026, plantingId: 'planting-1', quantity: 3, harvestDate: '2026-07-04', harvestTypeId: 2 };

describe('useHarvestsStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = useHarvestsStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no harvests, summaries or stats', () => {
        expect(store.harvests).toEqual([]);
        expect(store.harvestSummaries).toEqual([]);
        expect(store.harvestQuantitiesByPlanting).toEqual({});
        expect(store.harvestStats).toEqual({});
    });

    describe('upsertHarvests', () => {
        it('saves the harvests and returns what the service returns', async () => {
            harvestsApi.upsertHarvests.mockResolvedValue([{ ...harvest, harvestId: 'harvest-1' }]);

            const saved = await store.upsertHarvests([harvest]);

            expect(harvestsApi.upsertHarvests).toHaveBeenCalledWith('a-token', [harvest]);
            expect(saved).toEqual([{ ...harvest, harvestId: 'harvest-1' }]);
            expect(store.alertVisible).toBe(false);
        });

        // Both callers send their own plantingYear. The store's default reads
        // this.plantingYear, which isn't in its state, so it is always undefined
        it("adds an undefined plantingYear to a harvest that doesn't have one", async () => {
            const { plantingYear: _, ...withoutYear } = harvest;
            harvestsApi.upsertHarvests.mockResolvedValue([]);

            await store.upsertHarvests([withoutYear]);

            // toStrictEqual, because toEqual would also pass with no plantingYear key at all
            const [, sent] = harvestsApi.upsertHarvests.mock.calls[0];
            expect(sent).toStrictEqual([{ plantingYear: undefined, ...withoutYear }]);
            expect(sent[0]).toHaveProperty('plantingYear');
        });

        it("shows the service's message for a 400, and rejects", async () => {
            const err = apiError(400, serviceErrorBody(400, 'harvests[0].quantity must be greater than 0'));
            harvestsApi.upsertHarvests.mockRejectedValue(err);

            await expect(store.upsertHarvests([harvest])).rejects.toBe(err);

            expect(store.alertType).toBe('error');
            expect(store.alertMessage).toBe('harvests[0].quantity must be greater than 0');
            expect(consoleError).toHaveBeenCalledWith(err);
        });

        it('shows the generic message for any other failure, and rejects', async () => {
            const err = apiError(500, '<html>Internal Server Error</html>');
            harvestsApi.upsertHarvests.mockRejectedValue(err);

            await expect(store.upsertHarvests([harvest])).rejects.toBe(err);

            expect(store.alertMessage).toBe('error inserting harvests');
        });
    });

    describe('fetchHarvestSummariesByYear', () => {
        // Three types for planting-1, in an order that neither sorting nor
        // reversing leaves as it is
        const summaries = [
            { plantingId: 'planting-1', harvestTypeId: 2, harvestType: 'pounds', quantity: 4 },
            { plantingId: 'planting-2', harvestTypeId: 1, harvestType: 'unspecified', quantity: 7 },
            { plantingId: 'planting-1', harvestTypeId: 1, harvestType: 'unspecified', quantity: 12 },
            { plantingId: 'planting-1', harvestTypeId: 3, harvestType: 'ounces', quantity: 9 },
        ];

        it("loads the year's summaries", async () => {
            harvestsApi.fetchHarvestSummary.mockResolvedValue(summaries);

            await store.fetchHarvestSummariesByYear(2026);

            expect(harvestsApi.fetchHarvestSummary).toHaveBeenCalledWith('a-token', 2026);
            expect(store.harvestSummaries).toEqual(summaries);
        });

        it('groups the quantities by planting, one per harvest type, largest first, never summed', async () => {
            harvestsApi.fetchHarvestSummary.mockResolvedValue(summaries);

            await store.fetchHarvestSummariesByYear(2026);

            expect(store.harvestQuantitiesByPlanting).toEqual({
                'planting-1': [
                    { harvestTypeId: 1, harvestType: 'unspecified', quantity: 12 },
                    { harvestTypeId: 3, harvestType: 'ounces', quantity: 9 },
                    { harvestTypeId: 2, harvestType: 'pounds', quantity: 4 },
                ],
                'planting-2': [
                    { harvestTypeId: 1, harvestType: 'unspecified', quantity: 7 },
                ],
            });
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            harvestsApi.fetchHarvestSummary.mockResolvedValueOnce(summaries);
            await store.fetchHarvestSummariesByYear(2026);
            const err = httpError(500);
            harvestsApi.fetchHarvestSummary.mockRejectedValueOnce(err);

            await store.fetchHarvestSummariesByYear(2026);

            expect(store.alertMessage).toBe('error fetching harvest summaries by year');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.harvestSummaries).toEqual(summaries);
        });
    });

    describe.each([
        {
            action: 'searchHarvests',
            args: [2026],
            api: 'searchHarvests',
            apiArgs: ['a-token', 2026],
            result: [harvest],
            field: 'harvests',
            failure: 'error searching harvests page',
        },
        {
            action: 'fetchHarvestStats',
            args: [2026, 'Planting'],
            api: 'fetchHarvestStats',
            apiArgs: ['a-token', 2026, 'Planting'],
            result: { stats: [] },
            field: 'harvestStats',
            failure: 'error fetching harvest stats',
        },
    ])('$action', ({ action, args, api, apiArgs, result, field, failure }) => {
        it(`stores what the service returns in ${field}`, async () => {
            harvestsApi[api].mockResolvedValue(result);

            await store[action](...args);

            expect(harvestsApi[api]).toHaveBeenCalledWith(...apiArgs);
            expect(store[field]).toEqual(result);
        });

        it('shows an alert and logs, keeping what it had, when it fails', async () => {
            const err = httpError(500);
            harvestsApi[api].mockRejectedValue(err);
            const before = store[field];

            await store[action](...args);

            expect(store.alertMessage).toBe(failure);
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store[field]).toEqual(before);
        });
    });
});
