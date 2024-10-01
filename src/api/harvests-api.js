import axios from "axios";

import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function insertHarvests(actorToken, harvests) {
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

async function searchHarvests(actorToken, skip, limit) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvests?skip=${skip}&limit=${limit}`, {
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

export default {
    insertHarvests,
    fetchHarvestSummary,
    searchHarvests,
};