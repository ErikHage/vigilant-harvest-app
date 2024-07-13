import { defineStore } from 'pinia';

import storageUtils from "@/utils/storage-utils";
import jwtUtils from "@/utils/jwt-utils";

import authenticationApi from "@/api/authentication-api";
import plantsApi from "@/api/plants-api";

const appId = '82d7d287-978b-4df1-bc3d-526838b2465b';

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
        selectPlant(plantId) {
            try {
                this.selectedPlant = this.plants.find(plant => plant.plantId === plantId);
            } catch (err) {
                console.log(err);
                this.setAlertMessage('error', 'error selecting plant');
            }
        },
        clearSelectedPlant() {
            this.selectedPlant = null;
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
            selectedPlant: null,
            alertVisible: false,
            alertType: 'success',
            alertMessage: null,
        };
    },
});