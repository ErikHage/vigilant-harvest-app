import PlantingStatsPage from '@/components/views/dashboard/stats/PlantingStatsPage.vue';
import { describeStatsPage } from '../../../../../helpers/stats-pages';

const typeIds = { unspecified: 1, pounds: 2, count: 3 };

// A planting stats row, one per planting and harvest type. The service joins
// the plot, so a planting with no plot has no stats at all
function aRow(plantingId, plantingName, plotName, plantName, harvestType, totalQuantity) {
    return { plantingId, plantingName, plotName, plantId: `plant-of-${plantingId}`, plantName, harvestTypeId: typeIds[harvestType], harvestType, totalQuantity };
}

describeStatsPage({
    component: PlantingStatsPage,
    title: 'Planting Stats',
    label: 'Select Planting to View',
    statsType: 'Planting',
    rows: [
        aRow('planting-2', 'Sungold', 'South bed', 'Sungold tomato', 'unspecified', 25),
        aRow('planting-1', 'Early beans', 'North bed', 'Provider bush bean', 'pounds', 5),
        aRow('planting-1', 'Early beans', 'North bed', 'Provider bush bean', 'count', 12),
    ],
    options: ['Early beans | North bed | Provider bush bean', 'Sungold | South bed | Sungold tomato'],
    chosen: { index: 0, types: ['count', 'pounds'] },
});
