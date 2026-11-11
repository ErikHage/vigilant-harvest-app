import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ActivityScheduleDetailsPage from '@/components/views/dashboard/admin/ActivityScheduleDetailsPage.vue';
import EditScheduleDialog from '@/components/admin/schedules/EditScheduleDialog.vue';
import AddScheduleItemDialog from '@/components/admin/schedules/AddScheduleItemDialog.vue';
import EditScheduleItemDialog from '@/components/admin/schedules/EditScheduleItemDialog.vue';
import DeleteScheduleItemDialog from '@/components/admin/schedules/DeleteScheduleItemDialog.vue';
import { useActivitySchedulesStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { activityTypes, aSchedule, aScheduleItem } from '../../../../../helpers/schedules';

const items = [
    aScheduleItem(),
    aScheduleItem({ entryId: 'item-2', activityType: 'Treatment', subType: null, recurrenceRule: null, startDate: '06-15', endDate: '06-15', notes: null }),
];

async function mountPage({ schedule = aSchedule({ items }), routeId = 'schedule-1', state = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: { 'activity-schedules': { selectedActivitySchedule: schedule, activityTypes, ...state } },
    });
    const store = useActivitySchedulesStore(pinia);
    const wrapper = mountWithPlugins(ActivityScheduleDetailsPage, {
        global: {
            plugins: [pinia],
            mocks: { $route: { params: { activityScheduleId: routeId } } },
            // Each dialog has its own spec; here only what they're given matters
            stubs: { EditScheduleDialog: true, AddScheduleItemDialog: true, EditScheduleItemDialog: true, DeleteScheduleItemDialog: true },
        },
    });
    await flushPromises();
    return { wrapper, store };
}

// Each item row: its activity and subcategory, its rule as text and as
// stored, its dates, and its notes
const rows = wrapper => wrapper.findAll('tbody tr').filter(row => row.findAll('td').length === 5).map(row => {
    const [activity, recurrence, dates, notes] = row.findAll('td');
    return [
        activity.findAll('div').map(line => line.text()),
        recurrence.find('code').exists() ? [recurrence.find(':scope > div > div').text(), recurrence.find('code').text()] : recurrence.text(),
        dates.text(),
        notes.text(),
    ];
});

describe('ActivityScheduleDetailsPage', () => {
    it("loads the route's schedule, then the activity types", async () => {
        const { store } = await mountPage();

        expect(store.getScheduleById).toHaveBeenCalledWith('schedule-1');
        expect(store.fetchActivityTypes).toHaveBeenCalledTimes(1);
    });

    it('heads the page with the schedule, its description and how many items it has', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.find('.page-title').text()).toBe('Tomatoes');
        expect(wrapper.text()).toContain('Feed every two weeks');
        expect(wrapper.findAll('.v-card')[0].text()).toContain('Items2');
    });

    it('lists the items: activity, rule as text and as stored, dates and notes, with dashes for what they lack', async () => {
        const { wrapper } = await mountPage();

        expect(rows(wrapper)).toEqual([
            [['Fertilize', 'Blood Meal'], ['every 2 weeks', 'RRULE:FREQ=WEEKLY;INTERVAL=2'], 'May 1 - Sep 30', 'Side-dress the tomatoes'],
            [['Treatment'], '—', 'Jun 15', '—'],
        ]);
    });

    it('says when there are no items', async () => {
        const { wrapper } = await mountPage({ schedule: aSchedule({ items: [] }) });

        expect(wrapper.text()).toContain('No items yet — add one to get started');
    });

    it('gives the dialogs the schedule, the activity types and each item', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.findComponent(EditScheduleDialog).props('activitySchedule')).toMatchObject({ activityScheduleId: 'schedule-1' });
        expect(wrapper.findComponent(AddScheduleItemDialog).props('activityTypes')).toEqual(activityTypes);
        expect(wrapper.findAllComponents(EditScheduleItemDialog).map(d => d.props('scheduleItem').entryId)).toEqual(['item-1', 'item-2']);
        expect(wrapper.findAllComponents(EditScheduleItemDialog)[0].props('activityTypes')).toEqual(activityTypes);
        expect(wrapper.findAllComponents(DeleteScheduleItemDialog).map(d => d.props('scheduleItem').entryId)).toEqual(['item-1', 'item-2']);
    });

    it("shows the activity-schedules store's alert", async () => {
        const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error updating activity schedule' } });

        expect(wrapper.find('.v-alert').text()).toBe('error updating activity schedule');
    });

    // DocumentsCurrentBehavior: the alert sits inside the page's
    // v-if="activitySchedule", so when the first schedule viewed fails to
    // load, the page is blank and says nothing (backlog A10). Should show the
    // alert without a schedule
    it("shows nothing, not even the alert, when the schedule didn't load", async () => {
        const { wrapper } = await mountPage({
            schedule: null,
            state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching activity schedule by id: schedule-1' },
        });

        expect(wrapper.text()).toBe('');
    });

    // DocumentsCurrentBehavior: it renders whatever schedule the store holds,
    // so until the fetch returns, and for good if it fails, another
    // schedule's page shows the last one viewed (backlog A15). Should render
    // only the route's schedule
    it('shows the last schedule viewed while another loads', async () => {
        const { wrapper } = await mountPage({ routeId: 'schedule-2' });

        expect(wrapper.find('.page-title').text()).toBe('Tomatoes');
    });

    describe('saving', () => {
        it('updates the schedule, without reloading: the store keeps what the service sends back', async () => {
            const { wrapper, store } = await mountPage();
            const schedule = { activityScheduleId: 'schedule-1', name: 'Peppers', description: 'Feed weekly' };

            await wrapper.findComponent(EditScheduleDialog).props('onSubmit')(schedule);

            expect(store.updateSchedule).toHaveBeenCalledWith(schedule);
            expect(store.getScheduleById).toHaveBeenCalledTimes(1);
        });

        it("adds an item to the route's schedule, then reloads", async () => {
            const { wrapper, store } = await mountPage();
            const item = { activityType: 'Treatment', subType: 'Neem Oil', notes: 'Undersides' };

            await wrapper.findComponent(AddScheduleItemDialog).props('onSubmit')(item);
            await flushPromises();

            expect(store.addScheduleItem).toHaveBeenCalledWith('schedule-1', item);
            expect(store.getScheduleById).toHaveBeenCalledTimes(2);
            expect(store.fetchActivityTypes).toHaveBeenCalledTimes(2);
        });

        it("deletes an item from the route's schedule, then reloads", async () => {
            const { wrapper, store } = await mountPage();

            await wrapper.findAllComponents(DeleteScheduleItemDialog)[1].props('onSubmit')('item-2');
            await flushPromises();

            expect(store.deleteScheduleItem).toHaveBeenCalledWith('schedule-1', 'item-2');
            expect(store.getScheduleById).toHaveBeenCalledTimes(2);
        });

        // DocumentsCurrentBehavior: the edit dialog submits the item without
        // its schedule's id, and the page passes it on as it is, so the API
        // patches /activity-schedules/undefined/schedule-items/item-1. It works
        // only because the service ignores the schedule in that path (backlog
        // A30). Should send the route's schedule id
        it('updates an item without its schedule id, then reloads', async () => {
            const { wrapper, store } = await mountPage();
            const submitted = { entryId: 'item-1', activityType: 'Fertilize', subType: 'Bone Meal', notes: 'Side-dress' };

            await wrapper.findAllComponents(EditScheduleItemDialog)[0].props('onSubmit')(submitted);
            await flushPromises();

            expect(store.updateScheduleItem).toHaveBeenCalledWith(submitted);
            expect(store.updateScheduleItem.mock.calls[0][0].activityScheduleId).toBeUndefined();
            expect(store.getScheduleById).toHaveBeenCalledTimes(2);
        });

        // DocumentsCurrentBehavior: the store's actions catch a failed save,
        // alert and resolve, so each handler resolves, and its dialog, which
        // waits for it, closes as if it had saved (backlog A6). Should
        // rethrow, so the dialog stays open
        it.each([
            ['the schedule', 'updateSchedule', w => w.findComponent(EditScheduleDialog)],
            ['a new item', 'addScheduleItem', w => w.findComponent(AddScheduleItemDialog)],
            ['an item', 'updateScheduleItem', w => w.findAllComponents(EditScheduleItemDialog)[0]],
            ['a deletion', 'deleteScheduleItem', w => w.findAllComponents(DeleteScheduleItemDialog)[0]],
        ])('resolves when saving %s fails, so its dialog closes', async (_, action, dialog) => {
            const { wrapper, store } = await mountPage();
            store[action].mockImplementation(async () => {
                store.alertVisible = true;
                store.alertMessage = `error in ${action}`;
            });

            await expect(dialog(wrapper).props('onSubmit')({ entryId: 'item-1' })).resolves.toBeUndefined();
            await flushPromises();

            expect(wrapper.find('.v-alert').text()).toBe(`error in ${action}`);
        });
    });
});
