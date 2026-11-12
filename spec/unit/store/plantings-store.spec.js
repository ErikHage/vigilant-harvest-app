import { createPinia, setActivePinia } from 'pinia';
import { usePlantingsStore } from '@/store';
import plantingsApi from '@/api/plantings-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/plantings-api');

const early = { plantingId: 'planting-1', name: 'Early beans', status: 'CREATED' };
const late = { plantingId: 'planting-2', name: 'Late beans', status: 'STARTED' };

describe('usePlantingsStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = usePlantingsStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no plantings', () => {
        expect(store.plantings).toEqual([]);
        expect(store.plantingsById).toEqual({});
    });

    describe('fetchPlantingsByYear', () => {
        it("loads the year's plantings, and indexes them by id", async () => {
            plantingsApi.fetchPlantingsByYear.mockResolvedValue([early, late]);

            await store.fetchPlantingsByYear(2026);

            expect(plantingsApi.fetchPlantingsByYear).toHaveBeenCalledWith('a-token', 2026);
            expect(store.plantings).toEqual([early, late]);
            expect(store.plantingsById).toEqual({ 'planting-1': early, 'planting-2': late });
        });

        it('replaces the index, dropping plantings from another year', async () => {
            plantingsApi.fetchPlantingsByYear.mockResolvedValueOnce([early]);
            await store.fetchPlantingsByYear(2025);
            plantingsApi.fetchPlantingsByYear.mockResolvedValueOnce([late]);

            await store.fetchPlantingsByYear(2026);

            expect(store.plantingsById).toEqual({ 'planting-2': late });
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            plantingsApi.fetchPlantingsByYear.mockResolvedValueOnce([early]);
            await store.fetchPlantingsByYear(2026);
            const err = httpError(500);
            plantingsApi.fetchPlantingsByYear.mockRejectedValueOnce(err);

            await store.fetchPlantingsByYear(2026);

            expect(store.alertMessage).toBe('error fetching plantings by year');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.plantings).toEqual([early]);
        });
    });

    // For the year details page, which shows a year that may not be the
    // chosen one (backlog B20)
    describe('plantingsOfYear', () => {
        it("returns the year's plantings, leaving the store's list alone", async () => {
            plantingsApi.fetchPlantingsByYear.mockResolvedValueOnce([early]);
            await store.fetchPlantingsByYear(2026);
            plantingsApi.fetchPlantingsByYear.mockResolvedValueOnce([late]);

            await expect(store.plantingsOfYear(2025)).resolves.toEqual([late]);

            expect(plantingsApi.fetchPlantingsByYear).toHaveBeenLastCalledWith('a-token', 2025);
            expect(store.plantings).toEqual([early]);
            expect(store.plantingsById).toEqual({ 'planting-1': early });
        });

        it('returns none, with an alert, and logs, when the fetch fails', async () => {
            const err = httpError(500);
            plantingsApi.fetchPlantingsByYear.mockRejectedValueOnce(err);

            await expect(store.plantingsOfYear(2025)).resolves.toEqual([]);

            expect(store.alertMessage).toBe('error fetching plantings by year');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });

    describe('fetchPlantingById', () => {
        it('loads one planting into the index', async () => {
            plantingsApi.fetchPlantingById.mockResolvedValue(early);

            await store.fetchPlantingById('planting-1');

            expect(plantingsApi.fetchPlantingById).toHaveBeenCalledWith('a-token', 'planting-1');
            expect(store.plantingsById['planting-1']).toEqual(early);
            expect(store.plantings).toEqual([]);
        });

        it('shows an alert naming the planting when the fetch fails', async () => {
            plantingsApi.fetchPlantingById.mockRejectedValue(httpError(404));

            await store.fetchPlantingById('planting-9');

            expect(store.alertMessage).toBe('error fetching planting by id: planting-9');
            expect(store.plantingsById).toEqual({});
        });
    });

    describe('updatePlanting', () => {
        it('saves the planting, keeps what the service returns, and says so', async () => {
            const renamed = { ...early, name: 'Earliest beans' };
            plantingsApi.updatePlanting.mockResolvedValue(renamed);

            await store.updatePlanting('planting-1', { name: 'Earliest beans' });

            expect(plantingsApi.updatePlanting).toHaveBeenCalledWith('a-token', 'planting-1', { name: 'Earliest beans' });
            expect(store.plantingsById['planting-1']).toEqual(renamed);
            expect(store.alertType).toBe('success');
            expect(store.alertMessage).toBe('planting updated successfully');
        });
    });

    describe('createPlanting', () => {
        it('creates the planting and adds it to the index', async () => {
            plantingsApi.createPlanting.mockResolvedValue(early);

            await store.createPlanting({ name: 'Early beans', plantId: 'plant-1' });

            expect(plantingsApi.createPlanting).toHaveBeenCalledWith('a-token', { name: 'Early beans', plantId: 'plant-1' });
            expect(store.plantingsById['planting-1']).toEqual(early);
            expect(store.alertVisible).toBe(false);
        });
    });

    describe('performPlantingAction', () => {
        it('performs the action and keeps the planting the service returns', async () => {
            const planted = { ...early, status: 'PLANTED' };
            plantingsApi.performPlantingAction.mockResolvedValue(planted);

            await store.performPlantingAction('planting-1', 'PLANT', { plotId: 'plot-1' });

            expect(plantingsApi.performPlantingAction)
                .toHaveBeenCalledWith('a-token', 'planting-1', 'PLANT', { plotId: 'plot-1' });
            expect(store.plantingsById['planting-1']).toEqual(planted);
            expect(store.alertVisible).toBe(false);
        });
    });

    // The writes and the single fetch keep the index current, but leave the
    // list as it was, so a page reading `plantings` shows the old planting
    it('changes to one planting reach the index but not the list', async () => {
        plantingsApi.fetchPlantingsByYear.mockResolvedValue([early]);
        await store.fetchPlantingsByYear(2026);
        plantingsApi.performPlantingAction.mockResolvedValue({ ...early, status: 'STARTED' });
        plantingsApi.createPlanting.mockResolvedValue(late);

        await store.performPlantingAction('planting-1', 'START', {});
        await store.createPlanting({ name: 'Late beans' });

        expect(store.plantingsById['planting-1'].status).toBe('STARTED');
        expect(store.plantingsById['planting-2']).toEqual(late);
        expect(store.plantings).toEqual([early]);
    });

    describe.each([
        {
            action: 'updatePlanting',
            args: ['planting-1', { name: '' }],
            api: 'updatePlanting',
            failure: 'error updating planting',
        },
        {
            action: 'createPlanting',
            args: [{ name: '', plantId: 'plant-1' }],
            api: 'createPlanting',
            failure: 'error creating planting',
        },
    ])('$action', ({ action, args, api, failure }) => {
        // The page or dialog that called it stays put, and says why
        it('shows an alert, logs, and rejects, when it fails', async () => {
            plantingsApi.fetchPlantingsByYear.mockResolvedValue([early]);
            await store.fetchPlantingsByYear(2026);
            const err = httpError(400);
            plantingsApi[api].mockRejectedValue(err);

            await expect(store[action](...args)).rejects.toBe(err);

            expect(store.alertMessage).toBe(failure);
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.plantingsById['planting-1']).toEqual(early);
        });
    });

    describe('performPlantingAction', () => {
        // The dialog that called it stays open, and says why
        it('shows an alert, logs, and rejects, when it fails', async () => {
            plantingsApi.fetchPlantingsByYear.mockResolvedValue([early]);
            await store.fetchPlantingsByYear(2026);
            const err = httpError(400);
            plantingsApi.performPlantingAction.mockRejectedValue(err);

            await expect(store.performPlantingAction('planting-1', 'SPLIT', { splits: [{ name: '', count: 0 }] }))
                .rejects.toBe(err);

            expect(store.alertMessage).toBe('error performing planting action SPLIT');
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.plantingsById['planting-1']).toEqual(early);
        });
    });
});
