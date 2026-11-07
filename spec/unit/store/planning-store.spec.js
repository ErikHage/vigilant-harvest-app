import { createPinia, setActivePinia } from 'pinia';
import { usePlanningStore } from '@/store';
import planningApi from '@/api/planning-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/planning-api');

const planningDetails = { plantingYear: 2026, plants: [] };

describe('usePlanningStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = usePlanningStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no planning details', () => {
        expect(store.planningDetails).toBeNull();
    });

    describe('fetchPlanningDetailsByYear', () => {
        it("loads the year's planning details", async () => {
            planningApi.fetchPlanningDetailsByYear.mockResolvedValue(planningDetails);

            await store.fetchPlanningDetailsByYear(2026);

            expect(planningApi.fetchPlanningDetailsByYear).toHaveBeenCalledWith('a-token', 2026);
            expect(store.planningDetails).toEqual(planningDetails);
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            planningApi.fetchPlanningDetailsByYear.mockResolvedValueOnce(planningDetails);
            await store.fetchPlanningDetailsByYear(2026);
            const err = httpError(500);
            planningApi.fetchPlanningDetailsByYear.mockRejectedValueOnce(err);

            await store.fetchPlanningDetailsByYear(2026);

            expect(store.alertMessage).toBe('error fetching planning details by year');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.planningDetails).toEqual(planningDetails);
        });
    });
});
