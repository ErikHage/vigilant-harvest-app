import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlanting(actorToken, planting) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/plantings`, planting, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function createPlanting(actorToken, planting) {
    const response = await axios.post(`${vigilantHarvestServiceUrl.v0}/plantings`, planting, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function performPlantingAction(actorToken, plantingId, action, actionData) {
    const response = await axios.post(`${vigilantHarvestServiceUrl.v0}/plantings/${plantingId}`,
        {
            actionType: action,
            ...actionData,
        }, {
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

async function fetchPlantingById(actorToken, plantingId) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plantings/${plantingId}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    upsertPlanting: withApiErrorHandling(upsertPlanting),
    createPlanting: withApiErrorHandling(createPlanting),
    performPlantingAction: withApiErrorHandling(performPlantingAction),
    fetchPlantingsByYear: withApiErrorHandling(fetchPlantingsByYear),
    fetchPlantingById: withApiErrorHandling(fetchPlantingById),
};