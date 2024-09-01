<template>
  <v-container>
    <v-row class="justify-center">
      <v-col cols="12" sm="8" md="4">
        <div class="text-center mb-4">
          <v-img
              :src="getAssetPath('ai-owl.jpg')"
              alt="Logo"
              contain
              max-width="250"
              class="mx-auto"
          ></v-img>
        </div>

        <v-card class="text-center">
          <v-card-title>Authenticate with Identity Provider</v-card-title>
          <v-card-text>
            <v-btn @click="goToAuthentication">SSO</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";

import { useAuthenticationStore } from "@/store";
import { views } from "@/utils/constants";
import { getAssetPath } from "@/utils/assets";

export default {
  name: 'LoginPage',

  computed: {
    ...mapState(useAuthenticationStore, [
      'isAuthenticated',
    ]),
  },

  methods: {
    getAssetPath,
    ...mapActions(useAuthenticationStore, [
      'redirectForSso',
      'clearToken',
      'tokenPresent',
      'verifyToken',
    ]),

    goToAuthentication() {
      this.redirectForSso();
    },

    redirectToDashboard() {
      console.log('redirecting to dashboard');
      this.$router.push(views.dashboard.path);
    },
  },

  async mounted() {
    console.log('Login mounted');
    const isTokenPresent = this.tokenPresent();

    if (isTokenPresent) {
      try {
        await this.verifyToken();
        if (this.isAuthenticated) {
          this.redirectToDashboard();
        } else {
          this.clearToken();
        }
      } catch (err) {
        this.clearToken();
      }
    }
  }
}
</script>
