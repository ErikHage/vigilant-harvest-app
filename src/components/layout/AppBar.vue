<template>
  <v-app-bar app>
    <v-toolbar-title>Vigilant Harvest</v-toolbar-title>
    <v-spacer></v-spacer>
    <div v-if="showAppBar() === true">
      <v-btn :to="dashboardPath">Dashboard</v-btn>
      <v-btn @click="logoutUser">Logout</v-btn>
    </div>
  </v-app-bar>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { useAuthenticationStore } from "@/store";
import { views } from "@/utils/constants";

export default {
  name: "AppBar",

  data: () => ({
    dashboardPath: views.dashboard.path,
  }),

  methods: {
    ...mapActions(useAuthenticationStore, {
      logout: 'logout',
    }),

    ...mapState(useAuthenticationStore, {
      showAppBar: (state) => state.showAppBar,
    }),

    async logoutUser() {
      await this.logout();
      this.$router.push(views.login.path);
    }
  },
}
</script>

<style scoped>

</style>
