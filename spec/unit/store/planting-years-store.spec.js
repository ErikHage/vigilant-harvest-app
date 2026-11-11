import { createPinia, setActivePinia } from 'pinia';
import { usePlantingYearsStore } from '@/store';
import plantingYearsApi from '@/api/planting-years-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/planting-years-api');

const plantingYears = [
    { plantingYear: 2025, lastFrostDate: '2025-05-12', firstFrostDate: '2025-10-10' },
    { plantingYear: 2026, lastFrostDate: '2026-05-10', firstFrostDate: '2026-10-12' },
];
const plantingYearRequest = { plantingYear: 2027, lastFrostDate: '2027-05-10', firstFrostDate: '2027-10-12' };

describe('usePlantingYearsStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = usePlantingYearsStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no years and no year selected', () => {
        expect(store.plantingYears).toEqual([]);
        expect(store.plantingYear).toBeNull();
    });

    describe('fetchPlantingYears', () => {
        it('loads the years', async () => {
            plantingYearsApi.fetchPlantingYears.mockResolvedValue(plantingYears);

            await store.fetchPlantingYears();

            expect(plantingYearsApi.fetchPlantingYears).toHaveBeenCalledWith('a-token');
            expect(store.plantingYears).toEqual(plantingYears);
        });

        it('shows an alert, logs, and keeps the years it had, when the fetch fails', async () => {
            const err = httpError(500);
            plantingYearsApi.fetchPlantingYears.mockResolvedValueOnce(plantingYears);
            await store.fetchPlantingYears();
            plantingYearsApi.fetchPlantingYears.mockRejectedValueOnce(err);

            await store.fetchPlantingYears();

            expect(store.alertMessage).toBe('error fetching planting years');
            expect(store.alertType).toBe('error');
            expect(store.plantingYears).toEqual(plantingYears);
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });

    describe('fetchPlantingYear', () => {
        it('loads one year', async () => {
            plantingYearsApi.fetchPlantingYear.mockResolvedValue(plantingYears[1]);

            await store.fetchPlantingYear(2026);

            expect(plantingYearsApi.fetchPlantingYear).toHaveBeenCalledWith('a-token', 2026);
            expect(store.plantingYear).toEqual(plantingYears[1]);
        });

        it('shows an alert, logs, and keeps the year it had, when the fetch fails', async () => {
            const err = httpError(404);
            plantingYearsApi.fetchPlantingYear.mockResolvedValueOnce(plantingYears[1]);
            await store.fetchPlantingYear(2026);
            plantingYearsApi.fetchPlantingYear.mockRejectedValueOnce(err);

            await store.fetchPlantingYear(2030);

            expect(store.alertMessage).toBe('error fetching planting year');
            expect(store.plantingYear).toEqual(plantingYears[1]);
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });

    describe('addPlantingYear', () => {
        it('adds the year, without an alert or a reload', async () => {
            plantingYearsApi.addPlantingYear.mockResolvedValue(undefined);

            await store.addPlantingYear(plantingYearRequest);

            expect(plantingYearsApi.addPlantingYear).toHaveBeenCalledWith('a-token', plantingYearRequest);
            expect(plantingYearsApi.fetchPlantingYears).not.toHaveBeenCalled();
            expect(store.alertVisible).toBe(false);
        });

        it('shows an alert, logs, and rejects when adding fails', async () => {
            const failure = httpError(400);
            plantingYearsApi.addPlantingYear.mockRejectedValue(failure);

            await expect(store.addPlantingYear(plantingYearRequest)).rejects.toBe(failure);

            expect(store.alertMessage).toBe('error adding planting year');
            expect(consoleError).toHaveBeenCalledWith(failure);
        });
    });
});
