import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ActivitySchedulesPage from '@/components/views/dashboard/admin/ActivitySchedulesPage.vue';
import { useActivitySchedulesStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { apiError, serviceErrorBody } from '../../../../../helpers/http-errors';
import { inputLabelled } from '../../../../../helpers/fields';
import { isOpen, openAction, press } from '../../../../../helpers/action-dialogs';
import { aSchedule } from '../../../../../helpers/schedules';

// As GET /activity-schedules sends them
const schedules = [
    aSchedule(),
    aSchedule({ activityScheduleId: 'schedule-2', name: 'Peppers', description: 'Calcium monthly', items: [] }),
];

// An error thrown by a render goes to `errorHandler`, as an app's would
async function mountPage({ state = {}, errorHandler } = {}) {
    const pinia = createTestingPinia({ initialState: { 'activity-schedules': { schedules, ...state } } });
    const store = useActivitySchedulesStore(pinia);
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(ActivitySchedulesPage, {
        global: { plugins: [pinia], mocks: { $router }, ...(errorHandler ? { config: { errorHandler } } : {}) },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, store, $router };
}

const rows = wrapper => wrapper.findAll('tbody tr').filter(row => row.findAll('td').length === 2)
    .map(row => row.findAll('td').map(cell => cell.text()));
const count = wrapper => wrapper.find('.text-body-2').text();

async function filterBy(wrapper, text) {
    await inputLabelled(wrapper, 'Filter schedules').setValue(text);
    await flushPromises();
}

async function createSchedule(wrapper) {
    const dialog = await openAction(wrapper, 'Create Activity Schedule', 'Create Activity Schedule');
    await inputLabelled(dialog, 'Activity Schedule Name').setValue('Squash');
    await inputLabelled(dialog, 'Description').setValue('Watch for borers');
    await press(dialog, 'Create');
}

describe('ActivitySchedulesPage', () => {
    it('loads the schedules', async () => {
        const { store } = await mountPage();

        expect(store.fetchSchedules).toHaveBeenCalledTimes(1);
    });

    it('lists the schedules as they come, with their descriptions', async () => {
        const { wrapper } = await mountPage();

        expect(rows(wrapper)).toEqual([['Tomatoes', 'Feed every two weeks'], ['Peppers', 'Calcium monthly']]);
        expect(count(wrapper)).toBe('2 of 2 activity schedules');
    });

    it('filters by name or description, in any case', async () => {
        const { wrapper } = await mountPage();

        await filterBy(wrapper, 'CALCIUM');

        expect(rows(wrapper)).toEqual([['Peppers', 'Calcium monthly']]);
        expect(count(wrapper)).toBe('1 of 2 activity schedules');
    });

    // The name and description are run together: "Tomatoes" and "Feed" make
    // "oesfee"
    it('matches across the name and the description', async () => {
        const { wrapper } = await mountPage();

        await filterBy(wrapper, 'oesfee');

        expect(rows(wrapper).map(([name]) => name)).toEqual(['Tomatoes']);
    });

    it('says when nothing matches', async () => {
        const { wrapper } = await mountPage();

        await filterBy(wrapper, 'zzz');

        expect(rows(wrapper)).toEqual([]);
        expect(wrapper.text()).toContain('No schedules found');
    });

    // The service takes a schedule with no description, though the app always
    // sends one; the filter reads it without a guard
    it('throws on filtering a schedule with no description', async () => {
        const errorHandler = vi.fn();
        const { wrapper } = await mountPage({ state: { schedules: [aSchedule({ description: null })] }, errorHandler });

        await filterBy(wrapper, 'tom');

        expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(TypeError);
    });

    it("goes to a schedule's details from its name", async () => {
        const { wrapper, $router } = await mountPage();

        await wrapper.findAll('.clickable')[1].trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'ActivityScheduleDetailsPage', params: { activityScheduleId: 'schedule-2' } });
    });

    it("shows the activity-schedules store's alert", async () => {
        const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching activity schedules' } });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching activity schedules');
    });

    it('creates a schedule, then reloads', async () => {
        const { wrapper, store } = await mountPage();

        await createSchedule(wrapper);

        expect(store.createSchedule).toHaveBeenCalledWith({ name: 'Squash', description: 'Watch for borers' });
        expect(store.fetchSchedules).toHaveBeenCalledTimes(2);
        expect(isOpen()).toBe(false);
    });

    // createSchedule alerts, and rejects, so the dialog, which waits for the
    // page's handler, stays open and says why
    it('keeps the dialog open, and says why, when the save fails', async () => {
        const { wrapper, store } = await mountPage();
        store.createSchedule.mockImplementation(async () => {
            store.alertVisible = true;
            store.alertType = 'error';
            store.alertMessage = 'name is required';
            throw apiError(400, serviceErrorBody(400, 'name is required'));
        });

        await createSchedule(wrapper);

        expect(isOpen()).toBe(true);
        expect(document.querySelector('.v-overlay--active').textContent).toContain('name is required');
        expect(wrapper.find('.v-alert').text()).toBe('name is required');
        expect(store.fetchSchedules).toHaveBeenCalledTimes(1);
    });
});
