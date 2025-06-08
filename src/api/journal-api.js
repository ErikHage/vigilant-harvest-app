import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertJournalEntry(actorToken, journalEntry) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/journal`, journalEntry, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchJournalEntriesByYear(actorToken, plantingYear) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/journal/${plantingYear}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    upsertJournalEntry: withApiErrorHandling(upsertJournalEntry),
    fetchJournalEntriesByYear: withApiErrorHandling(fetchJournalEntriesByYear),
};
