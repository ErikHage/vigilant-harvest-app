import { createPinia, setActivePinia } from 'pinia';
import { useJournalStore } from '@/store';
import journalApi from '@/api/journal-api';
import { httpError } from '../../helpers/http-errors';

vi.mock('@/api/journal-api');

const entry = { plantingYear: 2026, title: 'First frost', body: 'Covered the peppers' };

describe('useJournalStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('vigilant-token', 'a-token');
        setActivePinia(createPinia());
        store = useJournalStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it('starts with no entries', () => {
        expect(store.journalEntries).toEqual([]);
    });

    describe('fetchJournalEntriesByYear', () => {
        it("loads the year's entries", async () => {
            journalApi.fetchJournalEntriesByYear.mockResolvedValue([entry]);

            await store.fetchJournalEntriesByYear(2026);

            expect(journalApi.fetchJournalEntriesByYear).toHaveBeenCalledWith('a-token', 2026);
            expect(store.journalEntries).toEqual([entry]);
        });

        it('shows an alert and logs, keeping what it had, when the fetch fails', async () => {
            journalApi.fetchJournalEntriesByYear.mockResolvedValueOnce([entry]);
            await store.fetchJournalEntriesByYear(2026);
            const err = httpError(400);
            journalApi.fetchJournalEntriesByYear.mockRejectedValueOnce(err);

            await store.fetchJournalEntriesByYear(null);

            expect(store.alertMessage).toBe('error fetching journal entries by year');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(store.journalEntries).toEqual([entry]);
        });
    });

    describe('upsertJournalEntry', () => {
        it('saves the entry, with no alert and no reload', async () => {
            journalApi.upsertJournalEntry.mockResolvedValue({});

            await store.upsertJournalEntry(entry);

            expect(journalApi.upsertJournalEntry).toHaveBeenCalledWith('a-token', entry);
            expect(journalApi.fetchJournalEntriesByYear).not.toHaveBeenCalled();
            expect(store.alertVisible).toBe(false);
        });

        // The dialog that called it stays open, and says why
        it('shows an alert, logs, and rejects, when it fails', async () => {
            const err = httpError(400);
            journalApi.upsertJournalEntry.mockRejectedValue(err);

            await expect(store.upsertJournalEntry(entry)).rejects.toBe(err);

            expect(store.alertMessage).toBe('error upserting journal entry');
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });
});
