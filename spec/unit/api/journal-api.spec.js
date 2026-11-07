import journalApi from '@/api/journal-api';
import { describeServiceCalls, serviceUrl } from '../../helpers/service-calls';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

const entry = { plantingYear: 2026, title: 'First frost', body: 'Covered the peppers' };

describe('journalApi', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describeServiceCalls([
        {
            name: 'upsertJournalEntry',
            call: () => journalApi.upsertJournalEntry('a-token', entry),
            verb: 'put',
            url: `${serviceUrl}/journal`,
            body: entry,
        },
        {
            name: 'fetchJournalEntriesByYear',
            call: () => journalApi.fetchJournalEntriesByYear('a-token', 2026),
            verb: 'get',
            url: `${serviceUrl}/journal/2026`,
        },
    ]);
});
