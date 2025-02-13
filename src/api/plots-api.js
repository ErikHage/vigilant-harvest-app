import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function upsertPlot(actorToken, plot) {
    const response = await axios.put(`${vigilantHarvestServiceUrl.v0}/plots`, plot, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function fetchPlots(actorToken) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/plots`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    upsertPlot: withApiErrorHandling(upsertPlot),
    fetchPlots: withApiErrorHandling(fetchPlots),
};