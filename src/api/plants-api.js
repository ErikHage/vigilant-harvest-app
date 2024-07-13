import axios from "axios";

import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function fetchPlants(actorToken) {
    try {
        const response = await axios.get(`${vigilantHarvestServiceUrl.v0.api}/plants`, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
        return response.data;
    } catch (err) {
        console.log('token is invalid');
        throw err;
    }
}

export default {
    fetchPlants,
};