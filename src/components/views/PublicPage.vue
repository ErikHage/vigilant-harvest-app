<template>
  <v-container>
    <v-app-bar app v-if="!showAppBar">
      <v-btn :to="loginPath">Login</v-btn>
    </v-app-bar>
    <div class="text-center mb-4">
      <v-img
          src="/apps/vigilant-harvest/assets/ai-owl.jpg"
          alt="Logo"
          contain
          max-width="500"
          class="mx-auto"
      ></v-img>
    </div>
  </v-container>
</template>

<script>

import { views } from "@/utils/constants";
import { mapState } from "pinia";
import { useAuthenticationStore } from "@/store";

export default {
  name: 'PublicPage',

  data: () => ({
    loginPath: views.login.path,
  }),

  computed: {
    ...mapState(useAuthenticationStore, [
      'showAppBar',
    ]),
  },

  methods: {

  },
}
</script>
