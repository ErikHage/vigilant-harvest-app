import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlanting(actorToken, plant) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/plantings`, plant, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchPlantingsByYear(actorToken, plantingYear) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plantings`, {
        params: {
            plantingYear,
        },
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    upsertPlanting: withApiErrorHandling(upsertPlanting),
    fetchPlantingsByYear: withApiErrorHandling(fetchPlantingsByYear),
};