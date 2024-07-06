import { defineStore } from 'pinia';

import storageUtils from "@/utils/storage-utils";
import jwtUtils from "@/utils/jwt-utils";

import authenticationApi from "@/api/authentication-api";

export const useAuthenticationStore = defineStore('authentication', {
    actions: {
        async authenticate(token) {
            try {
                this.loading = true;
                await authenticationApi.verifyApplicationToken(token);
                storageUtils.setTokenInLocalStorage(token);
                this.isAuthenticated = true;
                this.showAppBar = true;
                this.loading = false;
            } catch (err) {
                this.isAuthenticated = false;
                this.loading = false;
                console.log(err);
                // TODO redirect to feral-auth login
            }
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
            this.loading = false;
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
            loading: false,
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