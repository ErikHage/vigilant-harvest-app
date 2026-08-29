import axios from "axios";

import {withApiErrorHandling} from './error-handler';
import {vigilantHarvestServiceUrl} from "@/utils/constants";

async function fetchHarvestTypes(actorToken) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/harvest-types`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    fetchHarvestTypes: withApiErrorHandling(fetchHarvestTypes),
};
