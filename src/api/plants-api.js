import axios from "axios";

import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlant(actorToken, plant) {
    try {
        const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/plants`, plant, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error upserting plant');
        throw err;
    }
}

async function fetchPlants(actorToken) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plants`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching plants');
        throw err;
    }
}

async function fetchPlantById(actorToken, plantId) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plants/${plantId}`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching plant by id');
        throw err;
    }
}

async function deletePlantById(actorToken, plantId) {
    try {
        const response = await axios.delete(`${vigilantHarvestServiceUrl.v0}/plants/${plantId}`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error deleting plant by id');
        throw err;
    }
}

export default {
    upsertPlant,
    fetchPlants,
    fetchPlantById,
    deletePlantById,
};