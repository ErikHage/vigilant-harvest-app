import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VChip } from 'vuetify/components';
import PlanningPage from '@/components/views/dashboard/planning/PlanningPage.vue';
import PlanningTable from '@/components/planning/PlanningTable.vue';
import { usePlanningStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';

const toStart = [{ plantingId: 'planting-1', plantingName: 'Sungold', plantName: 'Sungold tomato', plannedActionDay: 95, daysUntilAction: -5 }];
const toPlant = [{ plantingId: 'planting-2', plantingName: 'Early beans', plantName: 'Provider bush bean', plannedActionDay: 137, daysUntilAction: 37 }];

// GET /planning/:year. The days are days of the year: 100 is April 10 and
// 137 is May 17 in 2026. The service counts currentDay from its own clock
function planningDetails(overrides = {}) {
    return { plantingYear: 2026, targetPlantingDay: 137, currentDay: 100, toStart: { plantings: toStart }, toPlant: { plantings: toPlant }, ...overrides };
}

// The year as the common store holds it once it's been read from
// localStorage: a string (B6). As a number, PlanningTable warns (its spec)
async function mountPage({ plantingYear = '2026', state = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear },
            planning: { planningDetails: planningDetails(), ...state },
        },
    });
    const store = usePlanningStore(pinia);
    const wrapper = mountWithPlugins(PlanningPage, { global: { plugins: [pinia] } });
    await flushPromises();
    return { wrapper, store };
}

const chips = wrapper => wrapper.findAllComponents(VChip).map(chip => [chip.text(), chip.props('color')]);

describe('PlanningPage', () => {
    it("asks for the year's plan", async () => {
        const { wrapper, store } = await mountPage();

        expect(store.fetchPlanningDetailsByYear).toHaveBeenCalledWith('2026');
        expect(wrapper.find('.page-title').text()).toBe('Planting Plan - 2026');
    });

    it('shows nothing but the title until the plan loads', async () => {
        const { wrapper } = await mountPage({ state: { planningDetails: null } });

        expect(wrapper.findAllComponents(VChip)).toHaveLength(0);
        expect(wrapper.findAllComponents(PlanningTable)).toHaveLength(0);
    });

    it('shows today, the planting day, and the days until it', async () => {
        const { wrapper } = await mountPage();

        expect(chips(wrapper)).toEqual([
            ['Today: Apr 10', 'primary'],
            ['Planting Day: May 17', 'primary'],
            ['37 days until planting!', 'success'],
        ]);
    });

    // Past the planting day it counts down below zero
    it.each([
        [107, 30, 'primary'],
        [130, 7, 'warning'],
        [137, 0, 'error'],
        [140, -3, 'error'],
    ])('colours the countdown from day %i, %i days out, as %s', async (currentDay, days, colour) => {
        const { wrapper } = await mountPage({ state: { planningDetails: planningDetails({ currentDay }) } });

        expect(chips(wrapper)[2]).toEqual([`${days} days until planting!`, colour]);
    });

    it('shows a dash for a day it was not given', async () => {
        const { wrapper } = await mountPage({ state: { planningDetails: planningDetails({ currentDay: undefined }) } });

        expect(chips(wrapper)[0][0]).toBe('Today: —');
    });

    it('lists what to start, by sowing day, and what to plant, by planting day', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.findAll('.v-tab').map(tab => tab.text())).toEqual(['To Start', 'To Plant']);
        // The To Plant table renders once its tab is chosen
        expect(wrapper.findAllComponents(PlanningTable)).toHaveLength(1);
        expect(wrapper.findComponent(PlanningTable).props()).toMatchObject({ items: toStart, year: '2026', actionDayTitle: 'Sowing Day' });

        await wrapper.findAll('.v-tab')[1].trigger('click');
        await flushPromises();

        expect(wrapper.findAllComponents(PlanningTable)[1].props()).toMatchObject({ items: toPlant, year: '2026', actionDayTitle: 'Planting Day' });
    });

    it("shows the planning store's alert", async () => {
        const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching planning details by year' } });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching planning details by year');
    });
});
