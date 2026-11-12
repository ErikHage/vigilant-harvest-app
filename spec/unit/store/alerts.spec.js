import { createPinia, setActivePinia } from 'pinia';
import * as stores from '@/store';

// All 11 stores share one setAlertMessage action (src/store/alerts.js). One
// table tests it in each, here rather than in each store's spec, since each
// store must keep its own timer
const allStores = Object.entries(stores).filter(([name]) => /^use\w+Store$/.test(name));

describe('setAlertMessage', () => {
    it('is defined by all 11 stores', () => {
        expect(allStores.map(([name]) => name)).toEqual([
            'useCommonStore',
            'useAuthenticationStore',
            'usePlantingYearsStore',
            'useActivitySchedulesStore',
            'usePlantsStore',
            'usePlotsStore',
            'usePlantingsStore',
            'useHarvestsStore',
            'useJournalStore',
            'usePlanningStore',
            'useActivityLogStore',
        ]);
    });

    describe.each(allStores)('in %s', (_, useStore) => {
        let store;
        let consoleError;

        beforeEach(() => {
            localStorage.clear();
            setActivePinia(createPinia());
            store = useStore();
            vi.useFakeTimers();
            consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            vi.useRealTimers();
            vi.restoreAllMocks();
        });

        it('starts with no alert', () => {
            expect(store.alertVisible).toBe(false);
            expect(store.alertType).toBe('success');
            expect(store.alertMessage).toBeNull();
        });

        it('shows the alert, then hides it after 3 seconds', () => {
            store.setAlertMessage(null, 'error', 'error fetching plots');

            expect(store.alertVisible).toBe(true);
            expect(store.alertType).toBe('error');
            expect(store.alertMessage).toBe('error fetching plots');

            vi.advanceTimersByTime(2999);
            expect(store.alertVisible).toBe(true);

            vi.advanceTimersByTime(1);
            expect(store.alertVisible).toBe(false);
        });

        it('logs the error it is given, and nothing without one', () => {
            const err = new Error('Request failed with status code 500');

            store.setAlertMessage(null, 'error', 'error fetching plots');
            expect(consoleError).not.toHaveBeenCalled();

            store.setAlertMessage(err, 'error', 'error fetching plots');
            expect(consoleError).toHaveBeenCalledWith(err);
        });

        it('gives a newer alert its own 3 seconds', () => {
            store.setAlertMessage(null, 'success', 'saved');
            vi.advanceTimersByTime(2000);

            store.setAlertMessage(null, 'error', 'error saving');
            vi.advanceTimersByTime(2999);

            expect(store.alertVisible).toBe(true);
            expect(store.alertMessage).toBe('error saving');

            vi.advanceTimersByTime(1);
            expect(store.alertVisible).toBe(false);
        });
    });
});
