import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import HarvestStatsPage from '@/components/views/dashboard/stats/HarvestStatsPage.vue';
import HarvestStatsCard from '@/components/harvests/HarvestStatsCard.vue';
import StatsCard from '@/components/harvests/StatsCard.vue';
import { useHarvestsStore } from '@/store';
import { mountWithPlugins } from './mount';
import { filedOn } from './harvests';

// The year's stats as the service sends them, with these `rows`. Its
// statsType always says Planting
export function harvestStatsOf(rows) {
    return {
        firstHarvestDate: filedOn('2026-07-02'),
        lastHarvestDate: filedOn('2026-07-11'),
        numberOfHarvests: 6,
        numberOfDays: 10,
        statsType: 'Planting',
        stats: rows,
    };
}

// HarvestStatsPage, for one stats type. It was two pages, PlantingStatsPage
// and PlantStatsPage, the same apart from the title, the select's label and
// the stats type they asked for (B29). Given:
// - `statsType`, and the `title` and `label` it shows;
// - `rows`: the stats rows the service sends for that type, in its order;
// - `options`: the select's titles, for those rows;
// - `chosen`: an option's index and the rows its cards show, by type.
export function describeStatsPage({ title, label, statsType, rows, options, chosen }) {
    const harvestStats = harvestStatsOf(rows);

    async function mountPage({ state = {} } = {}) {
        const pinia = createTestingPinia({
            initialState: {
                common: { plantingYear: 2026 },
                harvests: { harvestStats, harvestStatsType: statsType, ...state },
            },
        });
        const store = useHarvestsStore(pinia);
        const wrapper = mountWithPlugins(HarvestStatsPage, { props: { statsType }, global: { plugins: [pinia] } });
        await flushPromises();
        return { wrapper, store };
    }

    const select = wrapper => wrapper.findComponent(VSelect);
    const optionTitles = wrapper => select(wrapper).props('items').map(item => select(wrapper).props('itemTitle')(item));
    const cards = wrapper => wrapper.findAllComponents(StatsCard).map(card => card.props('stats').harvestType);

    describe(`HarvestStatsPage, by ${statsType}`, () => {
        it(`asks for the year's ${statsType} stats`, async () => {
            const { wrapper, store } = await mountPage();

            expect(store.fetchHarvestStats).toHaveBeenCalledWith(2026, statsType);
            expect(wrapper.find('.page-title').text()).toBe(title);
        });

        it("shows the year's totals", async () => {
            const { wrapper } = await mountPage();

            expect(wrapper.findComponent(HarvestStatsCard).props('harvestStats')).toEqual(harvestStats);
        });

        // It showed the totals card, empty, with --- for its dates (B29)
        it('shows no totals, and offers nothing, before the stats load', async () => {
            const { wrapper } = await mountPage({ state: { harvestStats: {}, harvestStatsType: null } });

            expect(wrapper.findComponent(HarvestStatsCard).exists()).toBe(false);
            expect(select(wrapper).props('items')).toEqual([]);
        });

        it("shows none of the other type's stats, left in the store", async () => {
            const other = statsType === 'Plant' ? 'Planting' : 'Plant';
            const { wrapper } = await mountPage({ state: { harvestStatsType: other } });

            expect(wrapper.findComponent(HarvestStatsCard).exists()).toBe(false);
            expect(select(wrapper).props('items')).toEqual([]);
        });

        it('offers each one with stats, by name, once whatever its types', async () => {
            const { wrapper } = await mountPage();

            expect(select(wrapper).props('label')).toBe(label);
            expect(select(wrapper).props('clearable')).toBe(true);
            expect(optionTitles(wrapper)).toEqual(options);
        });

        it('shows nothing until one is chosen', async () => {
            const { wrapper } = await mountPage();

            expect(cards(wrapper)).toEqual([]);
            expect(wrapper.text()).toContain('No stats selected.');
        });

        it("shows a card for each of the chosen one's harvest types, the largest total first", async () => {
            const { wrapper } = await mountPage();

            await select(wrapper).setValue(select(wrapper).props('items')[chosen.index].key);

            expect(cards(wrapper)).toEqual(chosen.types);
            expect(wrapper.text()).not.toContain('No stats selected.');
        });

        it('shows nothing again when cleared', async () => {
            const { wrapper } = await mountPage();
            await select(wrapper).setValue(select(wrapper).props('items')[chosen.index].key);

            await select(wrapper).setValue(null);

            expect(cards(wrapper)).toEqual([]);
        });

        it("shows the harvests store's alert", async () => {
            const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching harvest stats' } });

            expect(wrapper.find('.v-alert').text()).toBe('error fetching harvest stats');
        });
    });
}
