import { createPinia, setActivePinia } from 'pinia';
import { useCommonStore } from '@/store';
import plantingYearsApi from '@/api/planting-years-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/planting-years-api');

const plantingYears = [
    { plantingYear: 2025, lastFrostDate: '2025-05-12', firstFrostDate: '2025-10-10' },
    { plantingYear: 2026, lastFrostDate: '2026-05-10', firstFrostDate: '2026-10-12' },
];

// A store created after the year was stored, as on a reload
function storeWithStoredYear(year) {
    localStorage.setItem('planting-year', year);
    setActivePinia(createPinia());
    return useCommonStore();
}

describe('useCommonStore', () => {
    let store;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = useCommonStore();
        vi.useFakeTimers({ now: new Date('2026-11-06T12:00:00') });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
    });

    describe('initial state', () => {
        it('starts on the current year, with no years loaded', () => {
            setActivePinia(createPinia());
            store = useCommonStore();

            expect(store.plantingYear).toBe(2026);
            expect(store.plantingYearsByYear).toEqual({});
            expect(store.availableYears).toEqual([]);
            expect(store.selectedPlantingYear).toBeNull();
        });

        // localStorage gives back a string
        it('starts on the stored year, as a number', () => {
            store = storeWithStoredYear(2025);

            expect(store.plantingYear).toBe(2025);
        });

        it.each(['', 'none', '2025.5', '-1'])('starts on the current year when "%s" is stored', stored => {
            store = storeWithStoredYear(stored);

            expect(store.plantingYear).toBe(2026);
        });
    });

    describe('fetchPlantingYears', () => {
        it('indexes the years, lists them, and selects the current one', async () => {
            plantingYearsApi.fetchPlantingYears.mockResolvedValue(plantingYears);

            await store.fetchPlantingYears();

            expect(plantingYearsApi.fetchPlantingYears).toHaveBeenCalledWith('a-token');
            expect(store.plantingYearsByYear).toEqual({ 2025: plantingYears[0], 2026: plantingYears[1] });
            expect(store.availableYears).toEqual([2025, 2026]);
            expect(store.selectedPlantingYear).toEqual(plantingYears[1]);
        });

        it('selects the stored year', async () => {
            plantingYearsApi.fetchPlantingYears.mockResolvedValue(plantingYears);
            store = storeWithStoredYear(2025);

            await store.fetchPlantingYears();

            expect(store.selectedPlantingYear).toEqual(plantingYears[0]);
        });

        it('selects nothing when the current year has not been added', async () => {
            plantingYearsApi.fetchPlantingYears.mockResolvedValue([plantingYears[0]]);

            await store.fetchPlantingYears();

            expect(store.selectedPlantingYear).toBeUndefined();
        });

        it('shows an alert, logs, and keeps what it had, when the fetch fails', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            const err = httpError(500);
            plantingYearsApi.fetchPlantingYears.mockResolvedValueOnce(plantingYears);
            await store.fetchPlantingYears();
            plantingYearsApi.fetchPlantingYears.mockRejectedValueOnce(err);

            await store.fetchPlantingYears();

            expect(store.alertVisible).toBe(true);
            expect(store.alertType).toBe('error');
            expect(store.alertMessage).toBe('error fetching planting years');
            expect(store.availableYears).toEqual([2025, 2026]);
            expect(consoleError).toHaveBeenCalledWith(err);
            consoleError.mockRestore();
        });
    });

    describe('selectPlantingYear', () => {
        beforeEach(async () => {
            plantingYearsApi.fetchPlantingYears.mockResolvedValue(plantingYears);
            await store.fetchPlantingYears();
        });

        it('selects the year and remembers it', () => {
            store.selectPlantingYear(2025);

            expect(store.plantingYear).toBe(2025);
            expect(store.selectedPlantingYear).toEqual(plantingYears[0]);
            expect(localStorage.getItem('planting-year')).toBe('2025');
        });

        it('selects nothing for a year that has not been added', () => {
            store.selectPlantingYear(2030);

            expect(store.plantingYear).toBe(2030);
            expect(store.selectedPlantingYear).toBeUndefined();
        });
    });

    describe('clearPlantingYear', () => {
        it('clears the year and forgets it', async () => {
            plantingYearsApi.fetchPlantingYears.mockResolvedValue(plantingYears);
            await store.fetchPlantingYears();
            store.selectPlantingYear(2025);

            store.clearPlantingYear();

            expect(store.plantingYear).toBeNull();
            expect(store.selectedPlantingYear).toBeNull();
            expect(localStorage.getItem('planting-year')).toBeNull();
        });

        it('leaves a new store on the current year', () => {
            store.selectPlantingYear(2025);
            store.clearPlantingYear();

            setActivePinia(createPinia());

            expect(useCommonStore().plantingYear).toBe(2026);
        });
    });
});
