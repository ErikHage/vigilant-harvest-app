import { createPinia, setActivePinia } from 'pinia';
import { usePlantsStore } from '@/store';
import plantsApi from '@/api/plants-api';
import harvestTypesApi from '@/api/harvest-types-api';
import { apiError, httpError, serviceErrorBody } from '../../helpers/http-errors';

vi.mock('@/api/plants-api');
vi.mock('@/api/harvest-types-api');

const bean = { plantId: 'plant-1', friendlyName: 'Provider bush bean', subcategoryId: 'subcategory-1' };
const pea = { plantId: 'plant-2', friendlyName: 'Sugar snap pea', subcategoryId: 'subcategory-1' };
const categories = [{ categoryId: 'category-1', categoryName: 'Legumes', subcategories: [] }];
const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
];

describe('usePlantsStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = usePlantsStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts empty and not loading', () => {
        expect(store.loading).toBe(false);
        expect(store.plants).toEqual([]);
        expect(store.plantsById).toEqual({});
        expect(store.categories).toEqual([]);
        expect(store.harvestTypes).toEqual([]);
    });

    describe('fetchPlants', () => {
        it('loads the plants, and indexes them by id', async () => {
            plantsApi.fetchPlants.mockResolvedValue([bean, pea]);

            await store.fetchPlants();

            expect(plantsApi.fetchPlants).toHaveBeenCalledWith('a-token');
            expect(store.plants).toEqual([bean, pea]);
            expect(store.plantsById).toEqual({ 'plant-1': bean, 'plant-2': pea });
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            plantsApi.fetchPlants.mockResolvedValueOnce([bean]);
            await store.fetchPlants();
            const err = httpError(500);
            plantsApi.fetchPlants.mockRejectedValueOnce(err);

            await store.fetchPlants();

            expect(store.alertMessage).toBe('error fetching plants');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.plants).toEqual([bean]);
        });
    });

    describe('fetchPlantById', () => {
        it('loads one plant into the index, loading meanwhile', async () => {
            let loadingDuringCall;
            plantsApi.fetchPlantById.mockImplementation(async () => {
                loadingDuringCall = store.loading;
                return bean;
            });

            await store.fetchPlantById('plant-1');

            expect(plantsApi.fetchPlantById).toHaveBeenCalledWith('a-token', 'plant-1');
            expect(loadingDuringCall).toBe(true);
            expect(store.loading).toBe(false);
            expect(store.plantsById['plant-1']).toEqual(bean);
        });

        it('updates the index but not the list', async () => {
            plantsApi.fetchPlants.mockResolvedValue([bean]);
            await store.fetchPlants();
            const renamed = { ...bean, friendlyName: 'Provider' };
            plantsApi.fetchPlantById.mockResolvedValue(renamed);

            await store.fetchPlantById('plant-1');

            expect(store.plantsById['plant-1']).toEqual(renamed);
            expect(store.plants).toEqual([bean]);
        });

        it('shows an alert, and stops loading, when the fetch fails', async () => {
            plantsApi.fetchPlantById.mockRejectedValue(httpError(404));

            await store.fetchPlantById('plant-9');

            expect(store.alertMessage).toBe('error fetching plant');
            expect(store.loading).toBe(false);
            expect(store.plantsById).toEqual({});
        });
    });

    describe('upsertPlant', () => {
        it('saves the plant, loading meanwhile', async () => {
            let loadingDuringCall;
            plantsApi.upsertPlant.mockImplementation(async () => {
                loadingDuringCall = store.loading;
            });

            await expect(store.upsertPlant(bean)).resolves.toBeUndefined();

            expect(plantsApi.upsertPlant).toHaveBeenCalledWith('a-token', bean);
            expect(loadingDuringCall).toBe(true);
            expect(store.loading).toBe(false);
            expect(store.alertVisible).toBe(false);
        });

        // The page or dialog that called it stays put, and says why
        it('rejects, and stops loading, when the save fails', async () => {
            const err = apiError(500, '<html>Internal Server Error</html>');
            plantsApi.upsertPlant.mockRejectedValue(err);

            await expect(store.upsertPlant(bean)).rejects.toBe(err);

            expect(store.loading).toBe(false);
            expect(store.alertType).toBe('error');
            expect(store.alertMessage).toBe('error upserting plant');
            expect(consoleError).toHaveBeenCalledWith(err);
        });

        it.each([
            'subcategoryId is required',
            'Friendly name already in use',
        ])("shows the service's reason for a refused plant: %s", async message => {
            plantsApi.upsertPlant.mockRejectedValue(apiError(400, serviceErrorBody(400, message)));

            await store.upsertPlant(bean).catch(() => {});

            expect(store.alertMessage).toBe(message);
        });
    });

    describe('fetchPlantCategories', () => {
        it('loads the categories', async () => {
            plantsApi.fetchPlantCategories.mockResolvedValue(categories);

            await store.fetchPlantCategories();

            expect(plantsApi.fetchPlantCategories).toHaveBeenCalledWith('a-token');
            expect(store.categories).toEqual(categories);
        });

        it('shows an alert, keeping what it had, when the fetch fails', async () => {
            plantsApi.fetchPlantCategories.mockRejectedValue(httpError(500));

            await store.fetchPlantCategories();

            expect(store.alertMessage).toBe('error fetching plant categories');
            expect(store.categories).toEqual([]);
        });
    });

    describe('fetchHarvestTypes', () => {
        it('loads the harvest types', async () => {
            harvestTypesApi.fetchHarvestTypes.mockResolvedValue(harvestTypes);

            await store.fetchHarvestTypes();

            expect(harvestTypesApi.fetchHarvestTypes).toHaveBeenCalledWith('a-token');
            expect(store.harvestTypes).toEqual(harvestTypes);
        });

        it('fetches them only once, since the list changes only with a migration', async () => {
            harvestTypesApi.fetchHarvestTypes.mockResolvedValue(harvestTypes);

            await store.fetchHarvestTypes();
            await store.fetchHarvestTypes();

            expect(harvestTypesApi.fetchHarvestTypes).toHaveBeenCalledTimes(1);
        });

        it('shows an alert when the fetch fails, and tries again next time', async () => {
            harvestTypesApi.fetchHarvestTypes.mockRejectedValueOnce(httpError(500));
            harvestTypesApi.fetchHarvestTypes.mockResolvedValueOnce(harvestTypes);

            await store.fetchHarvestTypes();
            expect(store.alertMessage).toBe('error fetching harvest types');

            await store.fetchHarvestTypes();
            expect(store.harvestTypes).toEqual(harvestTypes);
        });
    });

    describe.each([
        {
            action: 'updatePlantScheduleAssignment',
            args: ['plant-1', { activityScheduleIds: ['schedule-1'] }],
            api: 'updatePlantScheduleAssignment',
            apiArgs: ['a-token', 'plant-1', { activityScheduleIds: ['schedule-1'] }],
            failure: 'error updating plant schedule assignments',
        },
        {
            action: 'deletePlantById',
            args: ['plant-1'],
            api: 'deletePlantById',
            apiArgs: ['a-token', 'plant-1'],
            failure: 'error deleting plant',
        },
        {
            action: 'createCategory',
            args: [{ categoryName: 'Legumes' }],
            api: 'createCategory',
            apiArgs: ['a-token', { categoryName: 'Legumes' }],
            failure: 'error creating category',
        },
        {
            action: 'createSubcategory',
            args: [{ categoryId: 'category-1', subcategoryName: 'Beans' }],
            api: 'createSubcategory',
            apiArgs: ['a-token', { categoryId: 'category-1', subcategoryName: 'Beans' }],
            failure: 'error creating subcategory',
        },
    ])('$action', ({ action, args, api, apiArgs, failure }) => {
        it('calls the service, with no alert and no reload', async () => {
            plantsApi[api].mockResolvedValue({});

            await store[action](...args);

            expect(plantsApi[api]).toHaveBeenCalledWith(...apiArgs);
            expect(plantsApi.fetchPlants).not.toHaveBeenCalled();
            expect(plantsApi.fetchPlantCategories).not.toHaveBeenCalled();
            expect(store.alertVisible).toBe(false);
        });

        // The page or dialog that called it stays put, and says why
        it('shows an alert, logs, and rejects, when it fails', async () => {
            const err = httpError(400);
            plantsApi[api].mockRejectedValue(err);

            await expect(store[action](...args)).rejects.toBe(err);

            expect(store.alertMessage).toBe(failure);
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });

    it('deletePlantById leaves the plant in the list and the index', async () => {
        plantsApi.fetchPlants.mockResolvedValue([bean]);
        await store.fetchPlants();
        plantsApi.deletePlantById.mockResolvedValue({});

        await store.deletePlantById('plant-1');

        expect(store.plants).toEqual([bean]);
        expect(store.plantsById['plant-1']).toEqual(bean);
    });
});
