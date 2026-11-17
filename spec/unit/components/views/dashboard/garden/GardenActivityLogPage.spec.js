import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import GardenActivityLogPage from '@/components/views/dashboard/garden/GardenActivityLogPage.vue';
import AddActivityLogEntryDialog from '@/components/views/dashboard/garden/AddActivityLogEntryDialog.vue';
import { useActivityLogStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { httpError } from '../../../../../helpers/http-errors';

// An entry as the service sends it. entryDate is the user's wall-clock time,
// with no timezone; the audit fields are UTC instants
function anEntry(entryId, entryDate, activityType, subType, comments) {
    return { entryId, plantingYear: 2026, entryDate, activityType, subType, comments, dateCreated: '2026-06-10T16:00:00Z', dateModified: '2026-06-10T16:00:00Z' };
}

const entries = [
    anEntry('a-1', '2026-06-01T10:00:00', 'FERTILIZE', 'CalMag', 'Tomatoes only'),
    // already June 3 in UTC
    anEntry('a-2', '2026-06-02T21:30:00', 'TREAT', 'Neem Oil', null),
    anEntry('a-3', '2026-05-20T08:00:00', 'Fertilize', null, 'Before the type names were fixed'),
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
const timeline = wrapper => wrapper.findAll('.timeline-entry').map(item => item.text());
const selected = wrapper => wrapper.find('.timeline-entry.selected').text();
// Each entry of the day shown: its type, as a chip, then its sub-type and
// its comments, each if any
const shownEntries = wrapper => wrapper.findAll('.activity-entry').map(entry => [
    entry.find('.v-chip.activity-type').text(),
    ...(entry.find('.activity-subtype').exists() ? [entry.find('.activity-subtype').text()] : []),
    ...(entry.find('.activity-comments').exists() ? [entry.find('.activity-comments').text()] : []),
]);

async function clickDay(wrapper, day) {
    await wrapper.findAll('.timeline-entry').find(item => item.text() === day).trigger('click');
    await flushPromises();
}

async function logEntry(wrapper, entry) {
    await wrapper.findComponent(AddActivityLogEntryDialog).props('onSubmit')(entry);
    await flushPromises();
}

describe('GardenActivityLogPage', () => {
    it("loads the year's entries", async () => {
        const { store } = await mountPage();

        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledWith(2026);
    });

    // It was a table of every entry, newest first
    it('lists the days with entries, newest first, each on its local day', async () => {
        const { wrapper } = await mountPage();

        expect(timeline(wrapper)).toEqual(['2026-06-02', '2026-06-01', '...', '2026-05-20']);
    });

    it("opens on the newest day, with its entries' type in a chip and sub-type, and no comments when there are none", async () => {
        const { wrapper } = await mountPage();

        expect(selected(wrapper)).toBe('2026-06-02');
        expect(shownEntries(wrapper)).toEqual([['TREAT', 'Neem Oil']]);
    });

    it("shows a day's entries with their comments, and no sub-type when there is none", async () => {
        const { wrapper } = await mountPage();

        await clickDay(wrapper, '2026-06-01');
        expect(shownEntries(wrapper)).toEqual([['FERTILIZE', 'CalMag', 'Tomatoes only']]);

        await clickDay(wrapper, '2026-05-20');
        expect(shownEntries(wrapper)).toEqual([['Fertilize', 'Before the type names were fixed']]);
    });

    it("shows a day's entries by their time, then in the order they were recorded", async () => {
        const later = { ...anEntry('b-1', '2026-06-01T10:00:00', 'WATER', null, 'Then watered'), dateCreated: '2026-06-10T17:00:00Z' };
        const evening = anEntry('b-2', '2026-06-01T19:00:00', 'TREAT', null, 'Evening spray');
        const { wrapper } = await mountPage({ state: { activityLogEntries: [evening, later, entries[0]] } });

        expect(shownEntries(wrapper).map(([type]) => type)).toEqual(['FERTILIZE', 'WATER', 'TREAT']);
    });

    it('says when the year has no entries', async () => {
        const { wrapper } = await mountPage({ state: { activityLogEntries: [] } });

        expect(timeline(wrapper)).toEqual([]);
        expect(wrapper.find('.content-column').text()).toBe('No activities logged in 2026.');
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
        await flushPromises();
        expect(timeline(wrapper)).toEqual(['2026-06-01', '...', '2026-05-20']);
        expect(selected(wrapper)).toBe('2026-06-01');

        await filter(wrapper).setValue(null);
        await flushPromises();
        expect(timeline(wrapper)).toEqual(['2026-06-02', '2026-06-01', '...', '2026-05-20']);
    });

    it('says so when the filter leaves no entries', async () => {
        const { wrapper, store } = await mountPage({ state: { activityLogEntries: [entries[1]] } });

        await filter(wrapper).setValue(store.activityTypes[0]);
        await flushPromises();

        expect(timeline(wrapper)).toEqual([]);
        expect(wrapper.find('.content-column').text()).toBe('No activities logged in 2026.');
    });

    it("saves a new entry with the year, reloads, and shows the entry's day", async () => {
        const { wrapper, store } = await mountPage();
        await clickDay(wrapper, '2026-05-20');
        const entry = { entryDate: '2026-06-05T21:00:00', activityType: 'TREAT', subType: 'Neem Oil', comments: '' };
        store.fetchActivityLogEntriesByYear.mockImplementationOnce(async () => {
            store.activityLogEntries = [...entries, anEntry('a-4', entry.entryDate, 'TREAT', 'Neem Oil', '')];
        });

        await logEntry(wrapper, entry);

        expect(store.upsertActivityLogEntry).toHaveBeenCalledWith({ plantingYear: 2026, ...entry });
        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledTimes(2);
        expect(selected(wrapper)).toBe('2026-06-05');
        expect(shownEntries(wrapper)).toEqual([['TREAT', 'Neem Oil']]);
    });

    it('clears a filter that would hide the new entry', async () => {
        const { wrapper, store } = await mountPage();
        await filter(wrapper).setValue(store.activityTypes[0]);
        const entry = { entryDate: '2026-06-05T08:00:00', activityType: 'TREAT', subType: 'Neem Oil', comments: '' };
        store.fetchActivityLogEntriesByYear.mockImplementationOnce(async () => {
            store.activityLogEntries = [...entries, anEntry('a-4', entry.entryDate, 'TREAT', 'Neem Oil', '')];
        });

        await logEntry(wrapper, entry);

        expect(filter(wrapper).props('modelValue')).toBeNull();
        expect(selected(wrapper)).toBe('2026-06-05');
    });

    it('keeps a filter the new entry matches', async () => {
        const { wrapper, store } = await mountPage();
        await filter(wrapper).setValue(store.activityTypes[0]);
        const entry = { entryDate: '2026-06-05T08:00:00', activityType: 'FERTILIZE', subType: 'CalMag', comments: '' };
        store.fetchActivityLogEntriesByYear.mockImplementationOnce(async () => {
            store.activityLogEntries = [...entries, anEntry('a-4', entry.entryDate, 'FERTILIZE', 'CalMag', '')];
        });

        await logEntry(wrapper, entry);

        expect(filter(wrapper).props('modelValue')).toEqual(store.activityTypes[0]);
        expect(timeline(wrapper)).toEqual(['2026-06-05', '...', '2026-06-01', '...', '2026-05-20']);
        expect(selected(wrapper)).toBe('2026-06-05');
    });

    // So the dialog, which waits for it, stays open and says why
    it('rejects, without reloading, when the save fails', async () => {
        const { wrapper, store } = await mountPage();
        const err = httpError(500);
        store.upsertActivityLogEntry.mockRejectedValue(err);

        await expect(wrapper.findComponent(AddActivityLogEntryDialog).props('onSubmit')({ entryDate: '2026-06-05T08:00:00', activityType: 'TREAT' }))
            .rejects.toBe(err);

        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledTimes(1);
    });

    it("does nothing on the dialog's Cancel", async () => {
        const { wrapper, store } = await mountPage();

        await wrapper.findComponent(AddActivityLogEntryDialog).props('onCancel')();
        await flushPromises();

        expect(store.upsertActivityLogEntry).not.toHaveBeenCalled();
        expect(store.fetchActivityLogEntriesByYear).toHaveBeenCalledTimes(1);
        expect(timeline(wrapper)).toEqual(['2026-06-02', '2026-06-01', '...', '2026-05-20']);
    });

    it("shows the activity-log store's alert", async () => {
        const { wrapper } = await mountPage({
            state: { alertVisible: true, alertType: 'error', alertMessage: 'error upserting activity log entry' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error upserting activity log entry');
    });
});
