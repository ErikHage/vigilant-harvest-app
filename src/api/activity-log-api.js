import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertActivityLogEntry(actorToken, activityLogEntry) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/activity-log`, activityLogEntry, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchActivityLogEntriesByYear(actorToken, plantingYear) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/activity-log/${plantingYear}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    upsertActivityLogEntry: withApiErrorHandling(upsertActivityLogEntry),
    fetchActivityLogEntriesByYear: withApiErrorHandling(fetchActivityLogEntriesByYear),
};
