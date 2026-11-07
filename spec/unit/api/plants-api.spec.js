import plantsApi from '@/api/plants-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const plant = { plantId: 'plant-1', friendlyName: 'Provider bush bean', subcategoryId: 'subcategory-1' };
const scheduleAssignment = { activityScheduleIds: ['schedule-1', 'schedule-2'] };

describe('plantsApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'upsertPlant',
            call: () => plantsApi.upsertPlant('a-token', plant),
            verb: 'put',
            url: `${serviceUrl}/plants`,
            body: plant,
        },
        {
            name: 'updatePlantScheduleAssignment',
            call: () => plantsApi.updatePlantScheduleAssignment('a-token', 'plant-1', scheduleAssignment),
            verb: 'put',
            url: `${serviceUrl}/plants/plant-1/activity-schedules`,
            body: scheduleAssignment,
        },
        {
            name: 'fetchPlants',
            call: () => plantsApi.fetchPlants('a-token'),
            verb: 'get',
            url: `${serviceUrl}/plants`,
        },
        {
            name: 'fetchPlantById',
            call: () => plantsApi.fetchPlantById('a-token', 'plant-1'),
            verb: 'get',
            url: `${serviceUrl}/plants/plant-1`,
        },
        {
            name: 'deletePlantById',
            call: () => plantsApi.deletePlantById('a-token', 'plant-1'),
            verb: 'delete',
            url: `${serviceUrl}/plants/plant-1`,
        },
        {
            name: 'createCategory',
            call: () => plantsApi.createCategory('a-token', { categoryName: 'Legumes' }),
            verb: 'post',
            url: `${serviceUrl}/plant-categories`,
            body: { categoryName: 'Legumes' },
        },
        {
            name: 'createSubcategory, with the category in the path and only the name in the body',
            call: () => plantsApi.createSubcategory('a-token', { categoryId: 'category-1', subcategoryName: 'Beans' }),
            verb: 'post',
            url: `${serviceUrl}/plant-categories/category-1/plant-subcategories`,
            body: { subcategoryName: 'Beans' },
        },
        {
            name: 'fetchPlantCategories',
            call: () => plantsApi.fetchPlantCategories('a-token'),
            verb: 'get',
            url: `${serviceUrl}/plant-categories`,
        },
    ]);
});
