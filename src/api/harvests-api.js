import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertHarvests(actorToken, harvests) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/harvests`, { harvests }, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchHarvestSummary(actorToken, plantingYear) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvests/summary`, {
        params: {
            plantingYear,
        },
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function searchHarvests(actorToken, year) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvests/search?year=${year}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchHarvestStats(actorToken, year, statsType) {
    const response = await axios.get(
        `${vigilantHarvestServiceUrl.v0}/harvests/stats?year=${year}&type=${statsType}`,
        {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
    return response.data;
}

export default {
    upsertHarvests: withApiErrorHandling(upsertHarvests),
    fetchHarvestSummary: withApiErrorHandling(fetchHarvestSummary),
    searchHarvests: withApiErrorHandling(searchHarvests),
    fetchHarvestStats: withApiErrorHandling(fetchHarvestStats),
};
