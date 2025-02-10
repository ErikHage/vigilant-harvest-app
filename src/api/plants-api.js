import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlant(actorToken, plant) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/plants`, plant, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchPlants(actorToken) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plants`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchPlantById(actorToken, plantId) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plants/${plantId}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function deletePlantById(actorToken, plantId) {
    const response = await axios.delete(`${vigilantHarvestServiceUrl.v0}/plants/${plantId}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    upsertPlant: withApiErrorHandling(upsertPlant),
    fetchPlants: withApiErrorHandling(fetchPlants),
    fetchPlantById: withApiErrorHandling(fetchPlantById),
    deletePlantById: withApiErrorHandling(deletePlantById),
};