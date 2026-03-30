import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { vigilantHarvestServiceUrl } from "@/utils/constants";

async function createActivitySchedule(actorToken, activitySchedule) {
    const response = await axios.post(`${vigilantHarvestServiceUrl.v0}/activity-schedules`, activitySchedule, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function listActivitySchedules(actorToken) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/activity-schedules`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function addActivityScheduleItem(actorToken, activityScheduleId, activityScheduleItem) {
    const response = await axios.post(`${vigilantHarvestServiceUrl.v0}/activity-schedules/${activityScheduleId}`, activityScheduleItem, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

export default {
    createActivitySchedule: withApiErrorHandling(createActivitySchedule),
    listActivitySchedules: withApiErrorHandling(listActivitySchedules),

    addActivityScheduleItem: withApiErrorHandling(addActivityScheduleItem),
};
