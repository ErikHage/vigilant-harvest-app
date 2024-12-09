import axios from "axios";

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

export default {
    fetchPlantingYears,
};