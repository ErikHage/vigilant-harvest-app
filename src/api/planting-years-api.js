import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function fetchPlantingYears(actorToken) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/planting-years`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching planting years');
        throw err;
    }
}

async function fetchPlantingYear(actorToken, year) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/planting-years/${year}`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('error fetching planting year ' + year);
        throw err;
    }
}

export default {
    fetchPlantingYears: withApiErrorHandling(fetchPlantingYears),
    fetchPlantingYear: withApiErrorHandling(fetchPlantingYear),
};
