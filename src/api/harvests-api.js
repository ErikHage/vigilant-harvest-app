import axios from "axios";

import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertHarvests(actorToken, harvests) {
    try {
        const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/harvests`, { harvests }, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error inserting harvests');
        throw err;
    }
}

async function fetchHarvestSummary(actorToken, plantingYear) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvests/summary`, {
            params: {
                plantingYear,
            },
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching harvest summaries');
        throw err;
    }
}

async function searchHarvests(actorToken, year) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvests/search?year=${year}`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error searching harvests');
        throw err;
    }
}

async function fetchHarvestStats(actorToken, year) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvests/stats?year=${year}`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching harvest stats');
        throw err;
    }
}

export default {
    upsertHarvests,
    fetchHarvestSummary,
    searchHarvests,
    fetchHarvestStats,
};