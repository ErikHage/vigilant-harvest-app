import axios from "axios";

import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlot(actorToken, plot) {
    try {
        const response = await axios.put(`${vigilantHarvestServiceUrl.v0.api}/plots`, plot, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error upserting plot');
        throw err;
    }
}

async function fetchPlots(actorToken) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0.api}/plots`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching plots');
        throw err;
    }
}

async function deletePlotById(actorToken, plotId) {
    try {
        const response = await axios.delete(`${vigilantHarvestServiceUrl.v0.api}/plots/${plotId}`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error deleting plot by id');
        throw err;
    }
}

export default {
    upsertPlot,
    fetchPlots,
    deletePlotById,
};