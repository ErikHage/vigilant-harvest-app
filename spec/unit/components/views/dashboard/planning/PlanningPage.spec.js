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
// 137 is May 17 in 2026. The service counts currentDay from the app's today,
// as its number in today's year, so the page doesn't read it
function planningDetails(overrides = {}) {
    return { plantingYear: 2026, targetPlantingDay: 137, currentDay: 100, toStart: { plantings: toStart }, toPlant: { plantings: toPlant }, ...overrides };
}

// Today is April 10, 2026, unless a test says otherwise
async function mountPage({ plantingYear = 2026, today = '2026-04-10', state = {} } = {}) {
    vi.useFakeTimers({ now: new Date(`${today}T09:00:00`), toFake: ['Date'] });
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
    afterEach(() => {
        vi.useRealTimers();
    });

    it("asks for the year's plan", async () => {
        const { wrapper, store } = await mountPage();

        expect(store.fetchPlanningDetailsByYear).toHaveBeenCalledWith(2026);
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

    // Today's number, 100, is April 9 in 2028, and May 16 there is 767 days
    // away: the service's currentDay would say April 9, and 37 days
    it('shows today, and counts from it, in another year', async () => {
        const { wrapper } = await mountPage({ plantingYear: 2028 });

        expect(chips(wrapper)).toEqual([
            ['Today: Apr 10', 'primary'],
            ['Planting Day: May 16', 'primary'],
            ['767 days until planting!', 'success'],
        ]);
    });

    // Past the planting day it counts down below zero
    it.each([
        ['2026-04-17', 30, 'primary'],
        ['2026-05-10', 7, 'warning'],
        ['2026-05-17', 0, 'error'],
        ['2026-05-20', -3, 'error'],
    ])('colours the countdown on %s, %i days out, as %s', async (today, days, colour) => {
        const { wrapper } = await mountPage({ today });

        expect(chips(wrapper)[2]).toEqual([`${days} days until planting!`, colour]);
    });

    it('shows a dash for a planting day it was not given', async () => {
        const { wrapper } = await mountPage({ state: { planningDetails: planningDetails({ targetPlantingDay: undefined }) } });

        expect(chips(wrapper)[1][0]).toBe('Planting Day: —');
    });

    it('lists what to start, by sowing day, and what to plant, by planting day', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.findAll('.v-tab').map(tab => tab.text())).toEqual(['To Start', 'To Plant']);
        // The To Plant table renders once its tab is chosen
        expect(wrapper.findAllComponents(PlanningTable)).toHaveLength(1);
        expect(wrapper.findComponent(PlanningTable).props()).toMatchObject({ items: toStart, year: 2026, actionDayTitle: 'Sowing Day' });

        await wrapper.findAll('.v-tab')[1].trigger('click');
        await flushPromises();

        expect(wrapper.findAllComponents(PlanningTable)[1].props()).toMatchObject({ items: toPlant, year: 2026, actionDayTitle: 'Planting Day' });
    });

    it("shows the planning store's alert", async () => {
        const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching planning details by year' } });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching planning details by year');
    });
});
