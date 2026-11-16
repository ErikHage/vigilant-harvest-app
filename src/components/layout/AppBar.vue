<template>
  <v-app-bar app>
    <template v-if="$vuetify.display.smAndDown">
      <v-app-bar-nav-icon
          v-if="showNavToggle"
          aria-label="Menu"
          @click="toggle($vuetify.display.smAndDown)"
      />
      <v-btn v-if="showAppBar === true" :to="dashboardPath" icon>
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-spacer></v-spacer>

      <v-toolbar-title
          class="planting-year"
          v-if="showPlantingYear"
      >
        {{plantingYear}}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn v-if="showAppBar === true" @click="logoutUser">Logout</v-btn>
    </template>

    <template v-else>
      <v-app-bar-nav-icon
          v-if="showNavToggle"
          aria-label="Menu"
          @click="toggle($vuetify.display.smAndDown)"
      />
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
    </template>

  </v-app-bar>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { useAuthenticationStore, useCommonStore } from "@/store";
import { useNavigationStore } from "@/store/navigation";
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

    // The dashboard's drawer is the only thing it opens
    showNavToggle() {
      return this.showAppBar === true && this.$route.path.startsWith(views.dashboard.path);
    },

    showPlantingYear() {
      return this.showAppBar && this.plantingYear !== null;
    },
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'logout',
    ]),

    ...mapActions(useNavigationStore, [
      'toggle',
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
