import axios from "axios";
import {vigilantHarvestServiceUrl} from "@/utils/constants";
import {withApiErrorHandling} from "@/api/error-handler";
import { toLocalDate } from '@/utils/dates';

async function fetchPlanningDetailsByYear(actorToken, plantingYear) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/planning/${plantingYear}`, {
        // the user's own day: the service counts the plan from it
        params: { today: toLocalDate(new Date()) },
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    fetchPlanningDetailsByYear: withApiErrorHandling(fetchPlanningDetailsByYear),
};
