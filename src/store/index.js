import { defineStore } from 'pinia';

import storageUtils from "@/utils/storage-utils";
import jwtUtils from "@/utils/jwt-utils";

import authenticationApi from "@/api/authentication-api";
import plantsApi from "@/api/plants-api";
import plotsApi from "@/api/plots-api";
import plantingsApi from "@/api/plantings-api";
import harvestsApi from "@/api/harvests-api";

import { applicationId, feralAuthenticationAppUrl } from "@/utils/constants";
import plantingYearsApi from "@/api/planting-years-api";

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
            } catch (err) {
                this.setAlertMessage(null, 'error', 'error fetching planting years');
            }
        },
        selectPlantingYear(year) {
            this.plantingYear = year;
            storageUtils.setLocalStorageEntry(localStorageKeys.plantingYear, year);
        },
        clearPlantingYear() {
            this.plantingYear = null;
            storageUtils.clearLocalStorageEntry(localStorageKeys.plantingYear);
        },
        setAlertMessage(err, type, message) {
            if (err) {
                console.error(err);
            }
            this.alertVisible = true;
            this.alertType = type;
            this.alertMessage = message;
            setTimeout(() => {
                this.alertVisible = false;
            }, 3000);
        },
    },
    state: () => {
        return {
            plantingYearsByYear: {},
            availableYears: [],
            plantingYear: storageUtils.getLocalStorageEntry(localStorageKeys.plantingYear) ?? new Date().getFullYear(),
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
                console.log('got an actor token', actorToken);
                storageUtils.setTokenInLocalStorage(actorToken);
                this.isAuthenticated = true;
                this.showAppBar = true;
            } catch (err) {
                this.isAuthenticated = false;
                this.setAlertMessage(null,'error', 'error authenticating sso token');
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
        setAlertMessage(err, type, message) {
            if (err) {
                console.error(err);
            }
            this.alertVisible = true;
            this.alertType = type;
            this.alertMessage = message;
            setTimeout(() => {
                this.alertVisible = false;
            }, 3000);
        },
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

export const usePlantsStore = defineStore('plants', {
    actions: {
        async upsertPlant(plant) {
            try {
                this.loading = true;
                await plantsApi.upsertPlant(storageUtils.tryToLoadTokenFromStorage(), plant);
            } catch (err) {
                console.log(err);
                this.setAlertMessage(err, 'error', 'error upserting plant');
            } finally {
                this.loading = false;
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
                this.setAlertMessage(err, 'error', 'error deleting plant');
            }
        },
        setAlertMessage(err, type, message) {
            if (err) {
                console.error(err);
            }
            this.alertVisible = true;
            this.alertType = type;
            this.alertMessage = message;
            setTimeout(() => {
                this.alertVisible = false;
            }, 3000);
        },
    },
    state: () => {
        return {
            loading: false,
            plants: [],
            plantsById: {},
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
                this.setAlertMessage(err, 'error', 'error upserting plot');
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
        setAlertMessage(err, type, message) {
            if (err) {
                console.error(err);
            }
            this.alertVisible = true;
            this.alertType = type;
            this.alertMessage = message;
            setTimeout(() => {
                this.alertVisible = false;
            }, 3000);
        }
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
                this.setAlertMessage(err, 'error', 'error updating planting');
            }
        },
        async createPlanting(plantingRequest) {
            try {
                const planting = await plantingsApi.createPlanting(storageUtils.tryToLoadTokenFromStorage(), plantingRequest);
                this.plantingsById[planting.plantingId] = planting;
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error creating planting');
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
                this.setAlertMessage(err, 'error', 'error performing planting action ' + action);
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
        setAlertMessage(err, type, message) {
            if (err) {
                console.error(err);
            }
            this.alertVisible = true;
            this.alertType = type;
            this.alertMessage = message;
            setTimeout(() => {
                this.alertVisible = false;
            }, 3000);
        }
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
                await harvestsApi.upsertHarvests(storageUtils.tryToLoadTokenFromStorage(), harvestsWithYear);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error inserting harvests');
            }
        },
        async fetchHarvestSummariesByYear(plantingYear) {
            try {
                this.harvestSummaries = await harvestsApi.fetchHarvestSummary(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
                this.harvestCounts = this.harvestSummaries.reduce((acc, harvestSummary) => {
                    acc[harvestSummary.plantingId] = harvestSummary.quantity;
                    return acc;
                }, {});
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
        async fetchHarvestStats(year) {
            try {
                this.harvestStats = await harvestsApi
                    .fetchHarvestStats(storageUtils.tryToLoadTokenFromStorage(), year);
            } catch (err) {
                this.setAlertMessage(err, 'error', 'error fetching harvest stats');
            }
        },
        setAlertMessage(err, type, message) {
            if (err) {
                console.error(err);
            }
            this.alertVisible = true;
            this.alertType = type;
            this.alertMessage = message;
            setTimeout(() => {
                this.alertVisible = false;
            }, 3000);
        }
    },
    state: () => {
        return {
            harvests: [],
            harvestSummaries: [],
            harvestCounts: {},
            harvestStats: {},
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});