import axios from "axios";

import {withApiErrorHandling} from './error-handler';
import {vigilantHarvestServiceUrl} from "@/utils/constants";
import scheduleConstants from './static-data/activity-schedule';

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

async function getScheduleById(actorToken, activityScheduleId) {
    const response = await axios.get(`${vigilantHarvestServiceUrl.v0}/activity-schedules/${activityScheduleId}`, {
        headers: {
            'x-feral-auth-token': actorToken,
        },
    });
    return response.data;
}

async function updateActivitySchedule(actorToken, activitySchedule) {
    const response = await axios.patch(`${vigilantHarvestServiceUrl.v0}/activity-schedules/${activitySchedule.activityScheduleId}`,
        {
            name: activitySchedule.name,
            description: activitySchedule.description,
        },
        {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
    return response.data;
}

async function fetchActivityTypes() {
    // maybe an api in the future?
    return Promise.resolve(scheduleConstants.activityTypes);
}

async function addActivityScheduleItem(actorToken, activityScheduleId, activityScheduleItem) {
    const response = await axios.post(
        `${vigilantHarvestServiceUrl.v0}/activity-schedules/${activityScheduleId}/schedule-items`,
        {
            activityType: activityScheduleItem.activityType,
            subType: activityScheduleItem.subType,
            recurrenceRule: activityScheduleItem.recurrenceRule,
            startDate: activityScheduleItem.startDate.toDate(),
            endDate: activityScheduleItem.endDate.toDate(),
            notes: activityScheduleItem.notes,
        },
        {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
    return response.data;
}

async function updateActivityScheduleItem(actorToken, activityScheduleItem) {
    const response = await axios.patch(
        `${vigilantHarvestServiceUrl.v0}/activity-schedules/${activityScheduleItem.activityScheduleId}/schedule-items/${activityScheduleItem.entryId}`,
        {
            activityType: activityScheduleItem.activityType,
            subType: activityScheduleItem.subType,
            recurrenceRule: activityScheduleItem.recurrenceRule,
            startDate: activityScheduleItem.startDate.toDate(),
            endDate: activityScheduleItem.endDate.toDate(),
            notes: activityScheduleItem.notes,
        },
        {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
    return response.data;
}

export default {
    createActivitySchedule: withApiErrorHandling(createActivitySchedule),
    listActivitySchedules: withApiErrorHandling(listActivitySchedules),
    getScheduleById: withApiErrorHandling(getScheduleById),
    updateActivitySchedule: withApiErrorHandling(updateActivitySchedule),

    fetchActivityTypes,

    addActivityScheduleItem: withApiErrorHandling(addActivityScheduleItem),
    updateActivityScheduleItem: withApiErrorHandling(updateActivityScheduleItem),
};
