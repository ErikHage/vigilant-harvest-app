import PlantStatsPage from '@/components/views/dashboard/stats/PlantStatsPage.vue';
import { describeStatsPage } from '../../../../../helpers/stats-pages';

const typeIds = { unspecified: 1, pounds: 2, count: 3 };

// A plant stats row, one per plant and harvest type, with no planting or plot
function aRow(plantId, plantName, harvestType, totalQuantity) {
    return { plantId, plantName, harvestTypeId: typeIds[harvestType], harvestType, totalQuantity };
}

describeStatsPage({
    component: PlantStatsPage,
    title: 'Plant Stats',
    label: 'Select Plant to View',
    statsType: 'Plant',
    rows: [
        aRow('plant-2', 'Sungold tomato', 'unspecified', 25),
        aRow('plant-1', 'Provider bush bean', 'pounds', 5),
        aRow('plant-1', 'Provider bush bean', 'count', 12),
        aRow('plant-3', 'Amish paste tomato', 'pounds', 9),
    ],
    options: ['Amish paste tomato', 'Provider bush bean', 'Sungold tomato'],
    chosen: { index: 1, types: ['count', 'pounds'] },
});
