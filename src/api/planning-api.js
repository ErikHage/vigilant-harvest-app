import axios from "axios";
import {vigilantHarvestServiceUrl} from "@/utils/constants";
import {withApiErrorHandling} from "@/api/error-handler";

async function fetchPlanningDetailsByYear(actorToken, plantingYear) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/planning/${plantingYear}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    fetchPlanningDetailsByYear: withApiErrorHandling(fetchPlanningDetailsByYear),
};
