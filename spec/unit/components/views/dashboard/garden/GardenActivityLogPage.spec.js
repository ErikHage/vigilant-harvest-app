import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import GardenActivityLogPage from '@/components/views/dashboard/garden/GardenActivityLogPage.vue';
import AddActivityLogEntryDialog from '@/components/views/dashboard/garden/AddActivityLogEntryDialog.vue';
import { useActivityLogStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { tableHeaders, tableRows } from '../../../../../helpers/tables';

// An entry as the service sends it. entryDate is a TIMESTAMP, so it comes as
// the UTC instant it was given
function anEntry(entryId, entryDate, activityType, subType, comments) {
    return { entryId, plantingYear: 2026, entryDate, activityType, subType, comments, dateCreated: entryDate, dateModified: entryDate };
}

const entries = [
    anEntry('a-1', '2026-06-01T14:00:00.000Z', 'FERTILIZE', 'CalMag', 'Tomatoes only'),
    // 21:30 on June 2 in New York
    anEntry('a-2', '2026-06-03T01:30:00.000Z', 'TREAT', 'Neem Oil', null),
    anEntry('a-3', '2026-05-20T12:00:00.000Z', 'Fertilize', null, 'Before the type names were fixed'),
];

async function mountPage({ state = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear: 2026 },
            // activityTypes is left as the store's own fixed list
            'activity-log': { activityLogEntries: entries, ...state },
        },
    });
    const store = useActivityLogStore(pinia);
    const wrapper = mountWithPlugins(GardenActivityLogPage, {
        global: {
            plugins: [pinia],
            // Its own spec drives it; here only its props matter
            stubs: { AddActivityLogEntryDialog: true },
        },
    });
    await flushPromises();
    return { wrapper, store };
}

const filter = wrapper => wrapper.findComponent(VSelect);

describe('GardenActivityLogPage', () => {
    it("loads the year's entries", async () => {
        const { store } = await mountPage();

        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledWith(2026);
    });

    it('lists the entries, newest first, each on its local day', async () => {
        const { wrapper } = await mountPage();

        expect(tableHeaders(wrapper)).toEqual(['Date', 'Type', 'Sub-Type', 'Comments']);
        expect(tableRows(wrapper)).toEqual([
            ['2026-06-02', 'TREAT', 'Neem Oil', ''],
            ['2026-06-01', 'FERTILIZE', 'CalMag', 'Tomatoes only'],
            ['2026-05-20', 'Fertilize', '', 'Before the type names were fixed'],
        ]);
    });

    it("offers the store's activity types as a filter, and to the dialog", async () => {
        const { wrapper, store } = await mountPage();

        expect(filter(wrapper).props('items')).toEqual(store.activityTypes);
        expect(filter(wrapper).props('clearable')).toBe(true);
        expect(wrapper.findComponent(AddActivityLogEntryDialog).props('activityTypes')).toEqual(store.activityTypes);
    });

    // It compares the entry's type upper-cased, so a type stored in another
    // case still matches
    it('filters by activity, in any case, and shows all again when cleared', async () => {
        const { wrapper, store } = await mountPage();

        await filter(wrapper).setValue(store.activityTypes[0]);
        expect(tableRows(wrapper).map(row => row[1])).toEqual(['FERTILIZE', 'Fertilize']);

        await filter(wrapper).setValue(null);
        expect(tableRows(wrapper)).toHaveLength(3);
    });

    it('saves a new entry with the year, then reloads', async () => {
        const { wrapper, store } = await mountPage();
        const entry = { entryDate: '2026-06-05T12:00:00.000Z', activityType: 'TREAT', subType: 'Neem Oil', comments: '' };

        await wrapper.findComponent(AddActivityLogEntryDialog).props('onSubmit')(entry);
        await flushPromises();

        expect(store.upsertActivityLogEntry).toHaveBeenCalledWith({ plantingYear: 2026, ...entry });
        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledTimes(2);
    });

    it("does nothing on the dialog's Cancel", async () => {
        const { wrapper, store } = await mountPage();

        await wrapper.findComponent(AddActivityLogEntryDialog).props('onCancel')();
        await flushPromises();

        expect(store.upsertActivityLogEntry).not.toHaveBeenCalled();
        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledTimes(1);
        expect(tableRows(wrapper)).toHaveLength(3);
    });

    // DocumentsCurrentBehavior: nothing binds the activity-log store's alert,
    // so a failed load or save shows nothing (backlog A10). Should show it
    it("doesn't show the activity-log store's alert", async () => {
        const { wrapper } = await mountPage({
            state: { alertVisible: true, alertType: 'error', alertMessage: 'error upserting activity log entry' },
        });

        expect(wrapper.find('.v-alert').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('error upserting activity log entry');
    });
});
