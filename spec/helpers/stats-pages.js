import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import HarvestStatsPage from '@/components/views/dashboard/stats/HarvestStatsPage.vue';
import HarvestStatsTab from '@/components/harvests/HarvestStatsTab.vue';
import StatsCard from '@/components/harvests/StatsCard.vue';
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

// Mounts HarvestStatsPage for 2026, with `harvestStats` (by type) and any
// other harvests store `state`
export async function mountStatsPage({ harvestStats = { Plant: null, Planting: null }, state = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear: 2026 },
            harvests: { harvestStats, ...state },
        },
    });
    const wrapper = mountWithPlugins(HarvestStatsPage, { global: { plugins: [pinia] } });
    await flushPromises();
    return { wrapper, pinia };
}

// The page's tab for `tab` (plants or plantings), and the parts of it
const tabs = { plants: 0, plantings: 1 };
export const statsTab = (wrapper, tab) => wrapper.findAllComponents(HarvestStatsTab)[tabs[tab]];
export const tabSelect = (wrapper, tab) => statsTab(wrapper, tab).findComponent(VSelect);
export const tabCards = (wrapper, tab) => statsTab(wrapper, tab).findAllComponents(StatsCard)
    .map(card => card.props('stats').harvestType);

export async function showTab(wrapper, tab) {
    await wrapper.findAll('.v-tab').find(button => button.text().toLowerCase() === tab).trigger('click');
    await flushPromises();
}

// One of HarvestStatsPage's tabs. They were two pages, PlantingStatsPage and
// PlantStatsPage, the same apart from the title, the select's label and the
// stats type they asked for (B29). Given:
// - `tab`, and the `statsType` it shows, under the select's `label`;
// - `rows`: the stats rows the service sends for that type, in its order;
// - `options`: the select's titles, for those rows;
// - `chosen`: an option's index and the rows its cards show, by type.
export function describeStatsTab({ tab, statsType, label, rows, options, chosen }) {
    const loaded = { Plant: null, Planting: null, [statsType]: harvestStatsOf(rows) };

    async function mountTab(options) {
        const mounted = await mountStatsPage(options ?? { harvestStats: loaded });
        await showTab(mounted.wrapper, tab);
        return mounted;
    }

    const select = wrapper => tabSelect(wrapper, tab);
    const optionTitles = wrapper => select(wrapper).props('items').map(item => select(wrapper).props('itemTitle')(item));
    const cards = wrapper => tabCards(wrapper, tab);

    describe(`HarvestStatsPage, its ${tab} tab`, () => {
        it('offers nothing before its stats load', async () => {
            const { wrapper } = await mountTab({ harvestStats: { Plant: null, Planting: null } });

            expect(select(wrapper).props('items')).toEqual([]);
        });

        it('offers each one with stats, by name, once whatever its types', async () => {
            const { wrapper } = await mountTab();

            expect(select(wrapper).props('label')).toBe(label);
            expect(select(wrapper).props('clearable')).toBe(true);
            expect(optionTitles(wrapper)).toEqual(options);
        });

        it('shows nothing until one is chosen', async () => {
            const { wrapper } = await mountTab();

            expect(cards(wrapper)).toEqual([]);
            expect(statsTab(wrapper, tab).text()).toContain('No stats selected.');
        });

        it("shows a card for each of the chosen one's harvest types, the largest total first", async () => {
            const { wrapper } = await mountTab();

            await select(wrapper).setValue(select(wrapper).props('items')[chosen.index].key);

            expect(cards(wrapper)).toEqual(chosen.types);
            expect(statsTab(wrapper, tab).text()).not.toContain('No stats selected.');
        });

        it('shows nothing again when cleared', async () => {
            const { wrapper } = await mountTab();
            await select(wrapper).setValue(select(wrapper).props('items')[chosen.index].key);

            await select(wrapper).setValue(null);

            expect(cards(wrapper)).toEqual([]);
        });
    });
}
