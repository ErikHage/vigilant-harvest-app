import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import HarvestStatsPage from '@/components/views/dashboard/stats/HarvestStatsPage.vue';
import HarvestStatsCard from '@/components/harvests/HarvestStatsCard.vue';
import StatsCard from '@/components/harvests/StatsCard.vue';
import { useHarvestsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { describeStatsPage, harvestStatsOf } from '../../../../../helpers/stats-pages';

const typeIds = { unspecified: 1, pounds: 2, count: 3 };

// A planting stats row, one per planting and harvest type. The service joins
// the plot, so a planting with no plot has no stats at all
function aPlantingRow(plantingId, plantingName, plotName, plantName, harvestType, totalQuantity) {
    return { plantingId, plantingName, plotName, plantId: `plant-of-${plantingId}`, plantName, harvestTypeId: typeIds[harvestType], harvestType, totalQuantity };
}

// A plant stats row, one per plant and harvest type, with no planting or plot
function aPlantRow(plantId, plantName, harvestType, totalQuantity) {
    return { plantId, plantName, harvestTypeId: typeIds[harvestType], harvestType, totalQuantity };
}

const plantingRows = [
    aPlantingRow('planting-2', 'Sungold', 'South bed', 'Sungold tomato', 'unspecified', 25),
    aPlantingRow('planting-1', 'Early beans', 'North bed', 'Provider bush bean', 'pounds', 5),
    aPlantingRow('planting-1', 'Early beans', 'North bed', 'Provider bush bean', 'count', 12),
];

describeStatsPage({
    statsType: 'Planting',
    title: 'Planting Stats',
    label: 'Select Planting to View',
    rows: plantingRows,
    options: ['Early beans | North bed | Provider bush bean', 'Sungold | South bed | Sungold tomato'],
    chosen: { index: 0, types: ['count', 'pounds'] },
});

describeStatsPage({
    statsType: 'Plant',
    title: 'Plant Stats',
    label: 'Select Plant to View',
    rows: [
        aPlantRow('plant-2', 'Sungold tomato', 'unspecified', 25),
        aPlantRow('plant-1', 'Provider bush bean', 'pounds', 5),
        aPlantRow('plant-1', 'Provider bush bean', 'count', 12),
        aPlantRow('plant-3', 'Amish paste tomato', 'pounds', 9),
    ],
    options: ['Amish paste tomato', 'Provider bush bean', 'Sungold tomato'],
    chosen: { index: 1, types: ['count', 'pounds'] },
});

// One route's page goes to the other's without being mounted again
describe('HarvestStatsPage, going from one type to the other', () => {
    it("drops the choice, asks for the other type's stats, and shows none of the first's", async () => {
        const pinia = createTestingPinia({
            initialState: {
                common: { plantingYear: 2026 },
                harvests: { harvestStats: harvestStatsOf(plantingRows), harvestStatsType: 'Planting' },
            },
        });
        const store = useHarvestsStore(pinia);
        const wrapper = mountWithPlugins(HarvestStatsPage, { props: { statsType: 'Planting' }, global: { plugins: [pinia] } });
        await flushPromises();
        await wrapper.findComponent({ name: 'VSelect' }).setValue('planting-1');
        expect(wrapper.findAllComponents(StatsCard)).toHaveLength(2);

        await wrapper.setProps({ statsType: 'Plant' });
        await flushPromises();

        expect(store.fetchHarvestStats).toHaveBeenLastCalledWith(2026, 'Plant');
        expect(wrapper.find('.page-title').text()).toBe('Plant Stats');
        expect(wrapper.findComponent({ name: 'VSelect' }).props('modelValue')).toBeNull();
        expect(wrapper.findComponent({ name: 'VSelect' }).props('items')).toEqual([]);
        expect(wrapper.findComponent(HarvestStatsCard).exists()).toBe(false);
        expect(wrapper.findAllComponents(StatsCard)).toHaveLength(0);
    });
});
