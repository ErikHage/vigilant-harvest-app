import { createPinia, setActivePinia } from 'pinia';
import { usePlotsStore } from '@/store';
import plotsApi from '@/api/plots-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/plots-api');

const north = { plotId: 'plot-1', friendlyName: 'North bed' };
const south = { plotId: 'plot-2', friendlyName: 'South bed' };

describe('usePlotsStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = usePlotsStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no plots', () => {
        expect(store.plots).toEqual([]);
        expect(store.plotsById).toEqual({});
    });

    describe('fetchPlots', () => {
        it('loads the plots, and indexes them by id', async () => {
            plotsApi.fetchPlots.mockResolvedValue([north, south]);

            await store.fetchPlots();

            expect(plotsApi.fetchPlots).toHaveBeenCalledWith('a-token');
            expect(store.plots).toEqual([north, south]);
            expect(store.plotsById).toEqual({ 'plot-1': north, 'plot-2': south });
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            plotsApi.fetchPlots.mockResolvedValueOnce([north]);
            await store.fetchPlots();
            const err = httpError(500);
            plotsApi.fetchPlots.mockRejectedValueOnce(err);

            await store.fetchPlots();

            expect(store.alertMessage).toBe('error fetching plots');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.plots).toEqual([north]);
        });
    });

    describe('upsertPlot', () => {
        it('saves the plot, with no alert and no reload', async () => {
            plotsApi.upsertPlot.mockResolvedValue({});

            await store.upsertPlot(north);

            expect(plotsApi.upsertPlot).toHaveBeenCalledWith('a-token', north);
            expect(plotsApi.fetchPlots).not.toHaveBeenCalled();
            expect(store.alertVisible).toBe(false);
        });

        // DocumentsCurrentBehavior: the failure is swallowed, so the dialog that
        // called it can't tell a failed save from a good one. Should rethrow, as
        // addPlantingYear does, so the dialog can stay open and say why
        it('shows an alert and logs when it fails, and still resolves', async () => {
            const err = httpError(400);
            plotsApi.upsertPlot.mockRejectedValue(err);

            await expect(store.upsertPlot(north)).resolves.toBeUndefined();

            expect(store.alertMessage).toBe('error upserting plot');
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });
});
