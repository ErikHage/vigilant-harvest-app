<template>
  <v-app-bar app>
    <v-toolbar-title>Vigilant Harvest</v-toolbar-title>

    <v-spacer></v-spacer>

    <v-toolbar-title
        class="planting-year"
        v-if="showPlantingYear"
    >
      {{plantingYear}}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <div v-if="showAppBar === true">
      <v-btn :to="dashboardPath">Dashboard</v-btn>
      <v-btn @click="logoutUser">Logout</v-btn>
    </div>
  </v-app-bar>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { useAuthenticationStore, useCommonStore } from "@/store";
import { views } from "@/utils/constants";

export default {
  name: "AppBar",

  data: () => ({
    dashboardPath: views.dashboard.path,
  }),

  computed: {
    ...mapState(useAuthenticationStore, [
      'showAppBar',
    ]),

    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    showPlantingYear() {
      return this.showAppBar && this.plantingYear !== null;
    },
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'logout',
    ]),

    async logoutUser() {
      await this.logout();
      this.$router.push(views.login.path);
    }
  },
}
</script>

<style scoped>
.planting-year {
  color: forestgreen;
  font-weight: bolder;
}
</style>
