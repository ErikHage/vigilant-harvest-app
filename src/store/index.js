import {defineStore} from 'pinia';

import storageUtils from "@/utils/storage-utils";
import jwtUtils from "@/utils/jwt-utils";

import authenticationApi from "@/api/authentication-api";
import plantsApi from "@/api/plants-api";
import plotsApi from "@/api/plots-api";
import plantingsApi from "@/api/plantings-api";
import harvestsApi from "@/api/harvests-api";
import journalApi from "@/api/journal-api";
import activityLogApi from "@/api/activity-log-api";
import harvestTypesApi from "@/api/harvest-types-api";

import harvestUtils from "@/utils/harvest-utils";
import { setAlertMessage } from "./alerts";

import {applicationId, feralAuthenticationAppUrl} from "@/utils/constants";
import plantingYearsApi from "@/api/planting-years-api";
import planningApi from "@/api/planning-api";
import activitySchedulesApi from "@/api/activity-schedules-api";

const localStorageKeys = {
    plantingYear: 'planting-year',
};

export const useCommonStore = defineStore('common', {
    actions: {
        async fetchPlantingYears() {
            try {
                const result = await plantingYearsApi.fetchPlantingYears(storageUtils.tryToLoadTokenFromStorage());
                this.plantingYearsByYear = result.reduce((acc, py) => {
                    acc[py.plantingYear] = py;
                    return acc;
                }, {});
                this.availableYears = Object.keys(this.plantingYearsByYear);
                this.selectedPlantingYear = this.plantingYearsByYear[this.plantingYear];
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching planting years');
            }
        },
        selectPlantingYear(year) {
            this.plantingYear = year;
            this.selectedPlantingYear = this.plantingYearsByYear[year];
            storageUtils.setLocalStorageEntry(localStorageKeys.plantingYear, year);
        },
        clearPlantingYear() {
            this.plantingYear = null;
            this.selectedPlantingYear = null;
            storageUtils.clearLocalStorageEntry(localStorageKeys.plantingYear);
        },
        setAlertMessage,
    },
    state: () => {
        return {
            plantingYearsByYear: {},
            availableYears: [],
            plantingYear: storageUtils.getLocalStorageEntry(localStorageKeys.plantingYear) ?? new Date().getFullYear(),
            selectedPlantingYear: null,
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const useAuthenticationStore = defineStore('authentication', {
    actions: {
        redirectForSso() {
            // send to feral-auth with query param of application id "app=appId"
            window.location.href = `${feralAuthenticationAppUrl}/login?app=${applicationId}`;
        },
        async authenticate(ssoToken) {
            try {
                const actorToken = await authenticationApi.verifySsoToken(ssoToken);
                storageUtils.setTokenInLocalStorage(actorToken);
                this.isAuthenticated = true;
                this.showAppBar = true;
            } catch (err) {
                this.isAuthenticated = false;
                this.setAlertMessage(err, 'error', 'error authenticating sso token');
            }
        },
        async verifyToken() {
            this.isAuthenticated = await authenticationApi.verifyActorToken(storageUtils.tryToLoadTokenFromStorage());
        },
        async logout() {
            try {
                await authenticationApi.logout(storageUtils.tryToLoadTokenFromStorage());
            } catch (err) {
                if (err.status === 401) {
                    // token must already be expired, don't worry about it
                } else {
                    this.setAlertMessage(err, 'error', 'error logging out');
                }
            }
            this.clearToken();
            this.showAppBar = false;
            this.isAuthenticated = false;
        },
        tokenPresent() {
            const maybeToken = storageUtils.tryToLoadTokenFromStorage();
            return maybeToken !== null;
        },
        clearToken() {
            storageUtils.clearTokenFromStorage();
        },
        setAlertMessage,
    },
    state: () => {
        return {
            isAuthenticated: false,
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
            showAppBar: storageUtils.tryToLoadTokenFromStorage() !== null,
        };
    },
    getters: {
        actor() {
            const token = storageUtils.tryToLoadTokenFromStorage();

            if (token !== null) {
                return jwtUtils.parseActorToken(token);
            }
            return null;
        },
    },
});

export const usePlantingYearsStore = defineStore('plantingYears', {
    actions: {
        async fetchPlantingYears() {
            try {
                this.plantingYears = await plantingYearsApi.fetchPlantingYears(storageUtils.tryToLoadTokenFromStorage());
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching planting years');
            }
        },
        async fetchPlantingYear(year) {
            try {
                this.plantingYear = await plantingYearsApi.fetchPlantingYear(storageUtils.tryToLoadTokenFromStorage(), year);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching planting year');
            }
        },
        async addPlantingYear(plantingYearRequest) {
            try {
                await plantingYearsApi.addPlantingYear(storageUtils.tryToLoadTokenFromStorage(), plantingYearRequest);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error adding planting year');
                throw err;
            }
        },
        setAlertMessage,
    },

    state: () => {
        return {
            plantingYears: [],
            plantingYear: null,
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const useActivitySchedulesStore = defineStore('activity-schedules', {
    actions: {
        async createSchedule(activitySchedule) {
            try {
                await activitySchedulesApi.createActivitySchedule(storageUtils.tryToLoadTokenFromStorage(), activitySchedule);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error adding activity schedule'));
                throw err;
            }
        },
        async fetchSchedules() {
            try {
                this.schedules = await activitySchedulesApi.listActivitySchedules(storageUtils.tryToLoadTokenFromStorage());
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching activity schedules');
            }
        },
        async getScheduleById(activityScheduleId) {
            try {
                this.selectedActivitySchedule = await activitySchedulesApi.getScheduleById(storageUtils.tryToLoadTokenFromStorage(), activityScheduleId);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching activity schedule by id: ' + activityScheduleId);
            }
        },
        async updateSchedule(activitySchedule) {
            try {
                this.selectedActivitySchedule = await activitySchedulesApi.updateActivitySchedule(storageUtils.tryToLoadTokenFromStorage(), activitySchedule);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error updating activity schedule'));
                throw err;
            }
        },
        async fetchActivityTypes() {
            try {
                this.activityTypes = await activitySchedulesApi.fetchActivityTypes();
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching activity types');
            }
        },
        async addScheduleItem(activityScheduleId, activityScheduleItem) {
            try {
                await activitySchedulesApi.addActivityScheduleItem(storageUtils.tryToLoadTokenFromStorage(), activityScheduleId, activityScheduleItem);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error adding activity schedule item'));
                throw err;
            }
        },
        async updateScheduleItem(activityScheduleItem) {
            try {
                await activitySchedulesApi.updateActivityScheduleItem(storageUtils.tryToLoadTokenFromStorage(), activityScheduleItem);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error updating activity schedule item'));
                throw err;
            }
        },
        async deleteScheduleItem(activityScheduleId, entryId) {
            try {
                await activitySchedulesApi.deleteActivityScheduleItem(storageUtils.tryToLoadTokenFromStorage(), activityScheduleId, entryId);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error deleting activity schedule item'));
                throw err;
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            schedules: [],
            selectedActivitySchedule: null,
            activityTypes: [],
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const usePlantsStore = defineStore('plants', {
    actions: {
        async upsertPlant(plant) {
            try {
                this.loading = true;
                await plantsApi.upsertPlant(storageUtils.tryToLoadTokenFromStorage(), plant);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error upserting plant'));
                throw err;
            } finally {
                this.loading = false;
            }
        },
        async updatePlantScheduleAssignment(plantId, plantScheduleAssignment) {
            try {
                await plantsApi.updatePlantScheduleAssignment(storageUtils.tryToLoadTokenFromStorage(), plantId, plantScheduleAssignment);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error updating plant schedule assignments'));
                throw err;
            }
        },
        async fetchPlants() {
            try {
                this.plants = await plantsApi.fetchPlants(storageUtils.tryToLoadTokenFromStorage());
                this.plantsById = this.plants.reduce((acc, plant) => {
                    acc[plant.plantId] = plant;
                    return acc;
                }, {});
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching plants');
            }
        },
        async fetchPlantById(plantId) {
            try {
                this.loading = true;
                this.plantsById[plantId] = await plantsApi.fetchPlantById(storageUtils.tryToLoadTokenFromStorage(), plantId);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching plant');
            } finally {
                this.loading = false;
            }
        },
        async deletePlantById(plantId) {
            try {
                await plantsApi.deletePlantById(storageUtils.tryToLoadTokenFromStorage(), plantId);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error deleting plant'));
                throw err;
            }
        },
        async createCategory(category) {
            try {
                await plantsApi.createCategory(storageUtils.tryToLoadTokenFromStorage(), category);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error creating category'));
                throw err;
            }
        },
        async createSubcategory(subcategory) {
            try {
                await plantsApi.createSubcategory(storageUtils.tryToLoadTokenFromStorage(), subcategory);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error creating subcategory'));
                throw err;
            }
        },
        async fetchPlantCategories() {
            try {
                this.categories = await plantsApi.fetchPlantCategories(storageUtils.tryToLoadTokenFromStorage());
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching plant categories');
            }
        },
        async fetchHarvestTypes() {
            // fixed, server-seeded list, only changes with a service migration
            if (this.harvestTypes.length > 0) {
                return;
            }
            try {
                this.harvestTypes = await harvestTypesApi.fetchHarvestTypes(storageUtils.tryToLoadTokenFromStorage());
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching harvest types');
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            loading: false,
            plants: [],
            plantsById: {},
            categories: [],
            harvestTypes: [],
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const usePlotsStore = defineStore('plots', {
    actions: {
        async upsertPlot(plot) {
            try {
                await plotsApi.upsertPlot(storageUtils.tryToLoadTokenFromStorage(), plot);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error upserting plot'));
                throw err;
            }
        },
        async fetchPlots() {
            try {
                this.plots = await plotsApi.fetchPlots(storageUtils.tryToLoadTokenFromStorage());
                this.plotsById = this.plots.reduce((acc, plot) => {
                    acc[plot.plotId] = plot;
                    return acc;
                }, {});
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching plots');
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            plots: [],
            plotsById: {},
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const usePlantingsStore = defineStore('plantings', {
    actions: {
        async updatePlanting(plantingId, plantingUpdate) {
            try {
                this.plantingsById[plantingId] = await plantingsApi.updatePlanting(storageUtils.tryToLoadTokenFromStorage(), plantingId, plantingUpdate);
                this.setAlertMessage(null, 'success', 'planting updated successfully');
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error updating planting'));
                throw err;
            }
        },
        async createPlanting(plantingRequest) {
            try {
                const planting = await plantingsApi.createPlanting(storageUtils.tryToLoadTokenFromStorage(), plantingRequest);
                this.plantingsById[planting.plantingId] = planting;
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error creating planting'));
                throw err;
            }
        },
        async performPlantingAction(plantingId, action, actionData) {
            try {
                this.plantingsById[plantingId] = await plantingsApi.performPlantingAction(
                    storageUtils.tryToLoadTokenFromStorage(),
                    plantingId,
                    action,
                    actionData);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error performing planting action ' + action));
                throw err;
            }
        },
        async fetchPlantingsByYear(plantingYear) {
            try {
                this.plantings = await plantingsApi.fetchPlantingsByYear(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
                this.plantingsById = this.plantings.reduce((acc, planting) => {
                    acc[planting.plantingId] = planting;
                    return acc;
                }, {});
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching plantings by year');
            }
        },
        async fetchPlantingById(plantingId) {
            try {
                this.plantingsById[plantingId] = await plantingsApi.fetchPlantingById(storageUtils.tryToLoadTokenFromStorage(), plantingId);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching planting by id: ' + plantingId);
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            plantings: [],
            plantingsById: {},
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const useHarvestsStore = defineStore('harvests', {
    actions: {
        async upsertHarvests(harvests) {
            try {
                const harvestsWithYear = harvests.map(harvest => ({
                    plantingYear: this.plantingYear,
                    ...harvest,
                }));
                return await harvestsApi.upsertHarvests(storageUtils.tryToLoadTokenFromStorage(), harvestsWithYear);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error inserting harvests'));
                throw err;
            }
        },
        async fetchHarvestSummariesByYear(plantingYear) {
            try {
                this.harvestSummaries = await harvestsApi.fetchHarvestSummary(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
                // the summary returns one row per planting x harvest type, so a planting can have
                // several quantities. never sum across types, they are not the same unit.
                this.harvestQuantitiesByPlanting = this.harvestSummaries.reduce((acc, harvestSummary) => {
                    if (!acc[harvestSummary.plantingId]) {
                        acc[harvestSummary.plantingId] = [];
                    }
                    acc[harvestSummary.plantingId].push({
                        harvestTypeId: harvestSummary.harvestTypeId,
                        harvestType: harvestSummary.harvestType,
                        quantity: harvestSummary.quantity,
                    });
                    return acc;
                }, {});
                Object.values(this.harvestQuantitiesByPlanting)
                    .forEach(quantities => quantities.sort(harvestUtils.sortByQuantityDescending));
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching harvest summaries by year');
            }
        },
        async searchHarvests(year) {
            try {
                this.harvests = await harvestsApi
                    .searchHarvests(storageUtils.tryToLoadTokenFromStorage(), year);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error searching harvests page');
            }
        },
        async fetchHarvestStats(year, statType) {
            try {
                this.harvestStats = await harvestsApi
                    .fetchHarvestStats(storageUtils.tryToLoadTokenFromStorage(), year, statType);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching harvest stats');
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            harvests: [],
            harvestSummaries: [],
            harvestQuantitiesByPlanting: {},
            harvestStats: {},
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const useJournalStore = defineStore('journal', {
    actions: {
        async upsertJournalEntry(journalEntry) {
            try {
                await journalApi.upsertJournalEntry(storageUtils.tryToLoadTokenFromStorage(), journalEntry);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error upserting journal entry'));
                throw err;
            }
        },
        async fetchJournalEntriesByYear(plantingYear) {
            try {
                this.journalEntries = await journalApi.fetchJournalEntriesByYear(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching journal entries by year');
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            journalEntries: [],
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const usePlanningStore = defineStore('planning', {
    actions: {
        async fetchPlanningDetailsByYear(plantingYear) {
            try {
                this.planningDetails = await planningApi.fetchPlanningDetailsByYear(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching planning details by year');
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            planningDetails: null,
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const useActivityLogStore = defineStore('activity-log', {
    actions: {
        async upsertActivityLogEntry(activityLogEntry) {
            try {
                await activityLogApi.upsertActivityLogEntry(storageUtils.tryToLoadTokenFromStorage(), activityLogEntry);
            } catch (err) {
                this.setAlertMessage(err, 'error', harvestUtils.upsertErrorMessage(err, 'error upserting activity log entry'));
                throw err;
            }
        },
        async fetchActivityLogEntriesByYear(plantingYear) {
            try {
                this.activityLogEntries = await activityLogApi.fetchActivityLogEntriesByYear(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching activity log entries by year');
            }
        },
        setAlertMessage,
    },
    state: () => {
        return {
            // TODO select activity type (source from backend)
            // TODO select sub type (source from backend)
            activityTypes: [
                {
                    name: 'FERTILIZE',
                    subTypes: [
                        'Miracle Grow',
                        'CalMag',
                        'Blood Meal',
                        'Bone Meal',
                        'Trifecta +',
                        'Crab and Lobster Shell Meal',
                        'True Organic Liquid All Purpose',
                        'Sulphur',
                        'Azomite',
                        'True Organic Tomato & Vegetable',
                        'Combo',
                    ]
                },
                {
                    name: 'TREAT',
                    subTypes: [
                        'Copper Fungicide',
                        'Insecticidal Soap',
                        'BT Thuricide',
                        'Neem Oil',
                        'Captain Jack Dead Bug',
                    ]
                },
            ],
            activityLogEntries: [],
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});
