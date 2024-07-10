<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
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

export default {
  name: 'LoginPage',

  computed: {
    ...mapState(useAuthenticationStore, [
      'isAuthenticated',
    ]),
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'redirectForSso',
    ]),

    goToAuthentication() {
      this.redirectForSso();
    },
  },

  async mounted() {
    // check for token? redirect to dashboard maybe?
    console.log('Login mounted');
  }
}
</script>
