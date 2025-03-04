import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

function mapForUpdate(plantingUpdate) {
    return {
        plantId: plantingUpdate.plantId,
        seedSource: plantingUpdate.seedSource,
        lotNumber: plantingUpdate.lotNumber,
        plotId: plantingUpdate.plotId,
        numberTransplanted: plantingUpdate.numberTransplanted,
        leadTimeWeeks: plantingUpdate.leadTimeWeeks,
        sowDate: plantingUpdate.sowDate,
        sowType: plantingUpdate.sowType,
        numberSown: plantingUpdate.numberSown,
        transplantDate: plantingUpdate.transplantDate,
        notes: plantingUpdate.notes,
    };
}

async function updatePlanting(actorToken, plantingId, plantingUpdate) {
    const requestBody = mapForUpdate(plantingUpdate);

    const response = await axios.put(
        `${vigilantHarvestServiceUrl.v0}/plantings/${plantingId}`,
        requestBody,
        {
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
    updatePlanting: withApiErrorHandling(updatePlanting),
    createPlanting: withApiErrorHandling(createPlanting),
    performPlantingAction: withApiErrorHandling(performPlantingAction),
    fetchPlantingsByYear: withApiErrorHandling(fetchPlantingsByYear),
    fetchPlantingById: withApiErrorHandling(fetchPlantingById),
};