import { defineStore } from 'pinia';

import storageUtils from "@/utils/storage-utils";
import jwtUtils from "@/utils/jwt-utils";

import authenticationApi from "@/api/authentication-api";
import plantsApi from "@/api/plants-api";
import plotsApi from "@/api/plots-api";
import plantingsApi from "@/api/plantings-api";
import harvestsApi from "@/api/harvests-api";

const appId = '82d7d287-978b-4df1-bc3d-526838b2465b';

export const useCommonStore = defineStore('common', {
    actions: {
        async selectPlantingYear(year) {
            this.plantingYear = year;
        },
    },
    state: () => {
        return {
            availableYears: [2024, 2025],
            plantingYear: null,
            // alertVisible: false, // TODO migrate error stuff here
            // alertType: 'success',
            // alertMessage: null,
        };
    },
});

export const useAuthenticationStore = defineStore('authentication', {
    actions: {
        redirectForSso() {
            // send to feral-auth with query param of application id "app=appId"
            window.location.href = `http://localhost:5173/auth/login?app=${appId}`;
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
                console.log(err);
                // TODO redirect to login page
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
                    // show some error
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
                await plantsApi.upsertPlant(storageUtils.tryToLoadTokenFromStorage(), plant);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error upserting plant');
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
                console.log(err);
                this.setAlertMessage('error', 'error fetching plants');
            }
        },
        async deletePlantById(plantId) {
            try {
                await plantsApi.deletePlantById(storageUtils.tryToLoadTokenFromStorage(), plantId);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error deleting plant');
            }
        },
        setAlertMessage(type, message) {
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
                console.log(err);
                this.setAlertMessage('error', 'error upserting plot');
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
                console.log(err);
                this.setAlertMessage('error', 'error fetching plots');
            }
        },
        async deletePlotById(plotId) {
            try {
                await plotsApi.deletePlotById(storageUtils.tryToLoadTokenFromStorage(), plotId);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error deleting plot');
            }
        },
        setAlertMessage(type, message) {
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
        async upsertPlanting(planting) {
            try {
                await plantingsApi.upsertPlanting(storageUtils.tryToLoadTokenFromStorage(), planting);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error upserting planting');
            }
        },
        async fetchPlantingsByYear(plantingYear) {
            try {
                this.plantings = await plantingsApi.fetchPlantingsByYear(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error fetching plantings by year');
            }
        },
        setAlertMessage(type, message) {
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
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});

export const useHarvestsStore = defineStore('harvests', {
    actions: {
        async upsertHarvest(harvest) {
            try {
                await harvestsApi.upsertHarvest(storageUtils.tryToLoadTokenFromStorage(), {
                    plantingYear: this.plantingYear,
                    ...harvest,
                });
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error upserting harvest');
            }
        },
        async fetchHarvestSummariesByYear(plantingYear) {
            try {
                this.harvestSummaries = await harvestsApi.fetchHarvestSummary(storageUtils.tryToLoadTokenFromStorage(), plantingYear);
                console.log('harvestSummaries', this.harvestSummaries);
                this.harvestCounts = this.harvestSummaries.reduce((acc, harvestSummary) => {
                    acc[harvestSummary.plantingId] = harvestSummary.quantity;
                    return acc;
                }, {});
                console.log('harvestCounts', this.harvestCounts);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error fetching harvest summaries by year');
            }
        },
        setAlertMessage(type, message) {
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
            harvestSummaries: [],
            harvestCounts: {},
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});