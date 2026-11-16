import HarvestStatsCard from '@/components/harvests/HarvestStatsCard.vue';
import { useHarvestsStore } from '@/store';
import {
    describeStatsTab, harvestStatsOf, mountStatsPage, showTab, statsTab, tabCards, tabSelect,
} from '../../../../../helpers/stats-pages';

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

const plantRows = [
    aPlantRow('plant-2', 'Sungold tomato', 'unspecified', 25),
    aPlantRow('plant-1', 'Provider bush bean', 'pounds', 5),
    aPlantRow('plant-1', 'Provider bush bean', 'count', 12),
    aPlantRow('plant-3', 'Amish paste tomato', 'pounds', 9),
];

describeStatsTab({
    tab: 'plants',
    statsType: 'Plant',
    label: 'Select Plant to View',
    rows: plantRows,
    options: ['Amish paste tomato', 'Provider bush bean', 'Sungold tomato'],
    chosen: { index: 1, types: ['count', 'pounds'] },
});

describeStatsTab({
    tab: 'plantings',
    statsType: 'Planting',
    label: 'Select Planting to View',
    rows: plantingRows,
    options: ['Early beans | North bed | Provider bush bean', 'Sungold | South bed | Sungold tomato'],
    chosen: { index: 0, types: ['count', 'pounds'] },
});

const bothLoaded = { Plant: harvestStatsOf(plantRows), Planting: harvestStatsOf(plantingRows) };

describe('HarvestStatsPage', () => {
    it("asks for the year's plant and planting stats", async () => {
        const { wrapper, pinia } = await mountStatsPage();
        const store = useHarvestsStore(pinia);

        expect(store.fetchHarvestStats).toHaveBeenCalledWith(2026, 'Plant');
        expect(store.fetchHarvestStats).toHaveBeenCalledWith(2026, 'Planting');
        expect(store.fetchHarvestStats).toHaveBeenCalledTimes(2);
        expect(wrapper.find('.page-title').text()).toBe('Harvest Stats');
    });

    it("shows the year's totals above the tabs", async () => {
        const { wrapper } = await mountStatsPage({ harvestStats: bothLoaded });

        expect(wrapper.findComponent(HarvestStatsCard).props('harvestStats')).toEqual(bothLoaded.Plant);
        expect(wrapper.findComponent(HarvestStatsCard).element.closest('.v-window')).toBeNull();
    });

    // The totals are the same whichever type brings them
    it.each(['Plant', 'Planting'])('shows the totals once only the %s stats have loaded', async statsType => {
        const harvestStats = { Plant: null, Planting: null, [statsType]: bothLoaded[statsType] };
        const { wrapper } = await mountStatsPage({ harvestStats });

        expect(wrapper.findComponent(HarvestStatsCard).props('harvestStats')).toEqual(bothLoaded[statsType]);
    });

    // It showed the totals card, empty, with --- for its dates (B29)
    it('shows no totals before the stats load', async () => {
        const { wrapper } = await mountStatsPage();

        expect(wrapper.findComponent(HarvestStatsCard).exists()).toBe(false);
    });

    it('opens on the plants tab, then the plantings tab', async () => {
        const { wrapper } = await mountStatsPage({ harvestStats: bothLoaded });

        expect(wrapper.findAll('.v-tab').map(tab => tab.text())).toEqual(['Plants', 'Plantings']);
        expect(wrapper.find('.v-tab--selected').text()).toBe('Plants');
        expect(statsTab(wrapper, 'plants').isVisible()).toBe(true);
    });

    it('keeps the select in each tab', async () => {
        const { wrapper } = await mountStatsPage({ harvestStats: bothLoaded });

        expect(tabSelect(wrapper, 'plants').element.closest('.v-window-item')).not.toBeNull();
        expect(tabSelect(wrapper, 'plantings').element.closest('.v-window-item')).not.toBeNull();
    });

    it("keeps each tab's choice while the other is shown", async () => {
        const { wrapper } = await mountStatsPage({ harvestStats: bothLoaded });
        await tabSelect(wrapper, 'plants').setValue('plant-1');

        await showTab(wrapper, 'plantings');
        expect(tabCards(wrapper, 'plantings')).toEqual([]);
        await tabSelect(wrapper, 'plantings').setValue('planting-2');
        await showTab(wrapper, 'plants');

        expect(tabSelect(wrapper, 'plants').props('modelValue')).toBe('plant-1');
        expect(tabCards(wrapper, 'plants')).toEqual(['count', 'pounds']);
        expect(tabSelect(wrapper, 'plantings').props('modelValue')).toBe('planting-2');
    });

    // As the store leaves it when one of the two fetches fails
    it('still offers the plantings when the plant stats fail to load', async () => {
        const { wrapper } = await mountStatsPage({
            harvestStats: { Plant: null, Planting: bothLoaded.Planting },
            state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching harvest stats' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching harvest stats');
        expect(wrapper.findComponent(HarvestStatsCard).exists()).toBe(true);
        expect(tabSelect(wrapper, 'plants').props('items')).toEqual([]);
        expect(tabSelect(wrapper, 'plantings').props('items')).toHaveLength(2);
    });

    it("shows the harvests store's alert", async () => {
        const { wrapper } = await mountStatsPage({
            state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching harvest stats' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching harvest stats');
    });
});
