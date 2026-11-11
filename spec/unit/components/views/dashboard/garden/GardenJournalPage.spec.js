import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import GardenJournalPage from '@/components/views/dashboard/garden/GardenJournalPage.vue';
import AddJournalEntryDialog from '@/components/views/dashboard/garden/AddJournalEntryDialog.vue';
import { useJournalStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';

// An entry as the service sends it. entryDate is the user's wall-clock time,
// with no timezone; the audit fields are UTC instants
function anEntry(entryId, entryDate, entry) {
    return { entryId, plantingYear: 2026, entry, entryDate, dateCreated: '2026-06-10T16:00:00Z', dateModified: '2026-06-10T16:00:00Z' };
}

const morning = anEntry('e-1', '2026-06-01T10:00:00', 'Planted the beans.');
// already June 2 in UTC
const evening = anEntry('e-2', '2026-06-01T21:30:00', 'Late watering.');
const nextDay = anEntry('e-3', '2026-06-02T08:00:00', 'First sprouts.');
const weekLater = anEntry('e-4', '2026-06-10T08:00:00', 'Thinned the carrots.');

// In the service's order: its query has no ORDER BY
const entries = [nextDay, evening, weekLater, morning];

async function mountPage({ journalEntries = entries, state = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear: 2026 },
            journal: { journalEntries, ...state },
        },
    });
    const store = useJournalStore(pinia);
    const wrapper = mountWithPlugins(GardenJournalPage, {
        global: {
            plugins: [pinia],
            // Its own spec drives it; here only its onSubmit matters
            stubs: { AddJournalEntryDialog: true },
        },
    });
    await flushPromises();
    return { wrapper, store };
}

const timeline = wrapper => wrapper.findAll('.timeline-entry').map(item => item.text());
const selected = wrapper => wrapper.find('.timeline-entry.selected').text();
const shownEntries = wrapper => wrapper.findAll('.journal-entry p').map(p => p.text());
const heading = wrapper => wrapper.find('h2').text();

async function clickDay(wrapper, day) {
    await wrapper.findAll('.timeline-entry').find(item => item.text() === day).trigger('click');
    await flushPromises();
}

async function press(wrapper, label) {
    await buttonLabelled(wrapper, label).trigger('click');
    await flushPromises();
}

describe('GardenJournalPage', () => {
    it("loads the year's entries", async () => {
        const { store } = await mountPage();

        expect(store.fetchJournalEntriesByYear).toHaveBeenCalledWith(2026);
    });

    it('lists the days with entries, newest first, with a gap where days are skipped', async () => {
        const { wrapper } = await mountPage();

        expect(timeline(wrapper)).toEqual(['2026-06-10', '...', '2026-06-02', '2026-06-01']);
    });

    it('files an entry under its local day', async () => {
        const { wrapper } = await mountPage();

        await clickDay(wrapper, '2026-06-01');

        expect(shownEntries(wrapper)).toContain('Late watering.');
    });

    it('opens on the newest day', async () => {
        const { wrapper } = await mountPage();

        expect(selected(wrapper)).toBe('2026-06-10');
        expect(heading(wrapper)).toBe('2026-06-10');
        expect(shownEntries(wrapper)).toEqual(['Thinned the carrots.']);
    });

    // The service sends them in no set order, and the page doesn't sort them,
    // so the evening's entry comes before the morning's
    it("shows a day's entries in the order they came", async () => {
        const { wrapper } = await mountPage();

        await clickDay(wrapper, '2026-06-01');

        expect(selected(wrapper)).toBe('2026-06-01');
        expect(shownEntries(wrapper)).toEqual(['Late watering.', 'Planted the beans.']);
    });

    it('does nothing on a click on a gap', async () => {
        const { wrapper } = await mountPage();

        await clickDay(wrapper, '...');

        expect(selected(wrapper)).toBe('2026-06-10');
    });

    // Previous and Next follow the timeline, newest first: Previous goes to
    // the later day, and Next to the earlier one
    it('moves between days with Previous and Next', async () => {
        const { wrapper } = await mountPage();
        expect(buttonLabelled(wrapper, 'Previous').attributes('disabled')).toBeDefined();

        await press(wrapper, 'Next');
        expect(heading(wrapper)).toBe('2026-06-02');
        await press(wrapper, 'Next');
        expect(heading(wrapper)).toBe('2026-06-01');
        expect(buttonLabelled(wrapper, 'Next').attributes('disabled')).toBeDefined();

        await press(wrapper, 'Previous');
        expect(heading(wrapper)).toBe('2026-06-02');
    });

    it('says when there are no entries', async () => {
        const { wrapper } = await mountPage({ journalEntries: [] });

        expect(timeline(wrapper)).toEqual([]);
        expect(wrapper.text()).toContain('No entry selected.');
    });

    it("saves a new entry with the year, reloads, and shows the entry's day", async () => {
        const { wrapper, store } = await mountPage();
        const entry = { entryDate: '2026-06-04T21:00:00', entry: 'Evening frost.' };
        store.fetchJournalEntriesByYear.mockImplementationOnce(async () => {
            store.journalEntries = [...entries, anEntry('e-5', entry.entryDate, entry.entry)];
        });

        await wrapper.findComponent(AddJournalEntryDialog).props('onSubmit')(entry);
        await flushPromises();

        expect(store.upsertJournalEntry).toHaveBeenCalledWith({ plantingYear: 2026, ...entry });
        expect(store.fetchJournalEntriesByYear).toHaveBeenCalledTimes(2);
        expect(selected(wrapper)).toBe('2026-06-04');
        expect(shownEntries(wrapper)).toEqual(['Evening frost.']);
    });

    // DocumentsCurrentBehavior: upsertJournalEntry swallows a failed save,
    // so the page reloads and goes to the new entry's day anyway, which has
    // nothing in it, with no message (backlog A6, and A10 for the alert).
    // Should stay on the day it was on, and show why
    it("goes to the entry's day even when the save failed", async () => {
        const { wrapper } = await mountPage();

        await wrapper.findComponent(AddJournalEntryDialog).props('onSubmit')({ entryDate: '2026-06-05T08:00:00', entry: 'Lost.' });
        await flushPromises();

        expect(wrapper.find('.timeline-entry.selected').exists()).toBe(false);
        expect(wrapper.text()).toContain('No entry selected.');
    });

    it("does nothing on the dialog's Cancel", async () => {
        const { wrapper, store } = await mountPage();
        const before = timeline(wrapper);

        await wrapper.findComponent(AddJournalEntryDialog).props('onCancel')();
        await flushPromises();

        expect(store.upsertJournalEntry).not.toHaveBeenCalled();
        expect(store.fetchJournalEntriesByYear).toHaveBeenCalledTimes(1);
        expect(timeline(wrapper)).toEqual(before);
    });

    it("shows the journal store's alert", async () => {
        const { wrapper } = await mountPage({
            state: { alertVisible: true, alertType: 'error', alertMessage: 'error upserting journal entry' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error upserting journal entry');
    });
});
