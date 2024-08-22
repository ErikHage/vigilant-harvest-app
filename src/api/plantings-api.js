import axios from "axios";

import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlanting(actorToken, plant) {
    try {
        const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/plantings`, plant, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error upserting planting');
        throw err;
    }
}

async function fetchPlantingsByYear(actorToken, plantingYear) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plantings`, {
            params: {
                plantingYear,
            },
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching plantings');
        throw err;
    }
}

export default {
    upsertPlanting,
    fetchPlantingsByYear,
};