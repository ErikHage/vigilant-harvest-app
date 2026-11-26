<template>
  <!-- On the pages that need someone signed on, the app runs in FrAppShell:
       the side drawer, and the toolbar with the planting year, the command
       palette, the theme menu and the user's menu. The drawer reads "Feral"
       over the app's name; the window keeps index.html's title, which
       FrAppShell prefers to this one -->
  <fr-app-shell
      v-if="isSignedOnPage"
      title="Feral"
      subtitle="Vigilant Harvest"
      storage-prefix="vigilant-harvest"
      :sections="sections"
      :active-view="activeView"
  >
    <!-- The page's place, as the component playground shows it: its
         section, then the page, then the record on a page under it. None on
         a small screen, where the planting year, centred over the toolbar,
         leaves no room for even the last crumb -->
    <template v-if="!$vuetify.display.smAndDown" #toolbar-start>
      <fr-breadcrumbs
          :items="crumbs"
          density="compact"
          class="pa-0 text-no-wrap overflow-hidden"
          style="min-width: 0"
      />
    </template>
    <template v-if="plantingYear !== null" #toolbar-center>
      <v-toolbar-title class="planting-year">{{ plantingYear }}</v-toolbar-title>
    </template>
    <!-- The name is a placeholder: the app doesn't read the user's from the token -->
    <template #toolbar>
      <fr-app-user-menu name="Gardener">
        <fr-list-item title="Logout" prepend-icon="mdi-logout" @click="logoutUser"/>
      </fr-app-user-menu>
    </template>
    <router-view/>
  </fr-app-shell>

  <!-- Elsewhere (signing on, the login page), only the app's name -->
  <v-app v-else>
    <v-app-bar>
      <v-toolbar-title>Vigilant Harvest</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { FrAppShell, FrAppUserMenu, FrBreadcrumbs, FrListItem } from "@feral-auth/vue-components";
import {
  useActivitySchedulesStore,
  useAuthenticationStore,
  useCommonStore,
  usePlantingsStore,
  usePlantingYearsStore,
  usePlantsStore,
} from "@/store";
import { views } from "@/utils/constants";
import { activeViewFor, crumbsFor, sectionsFor } from "@/utils/navigation";

export default {
  name: 'App',

  components: { FrAppShell, FrAppUserMenu, FrBreadcrumbs, FrListItem },

  computed: {
    // The frame follows the route, not the store: the guard lets only
    // someone signed on reach these pages. Switching frames remounts the
    // page, so following the store would remount the landing page as it
    // signs on (verifying its one-time token again), and a dashboard page as
    // it logs out (loading it again with no token)
    isSignedOnPage() {
      return this.$route.matched.some(record => record.meta.requiresAuthenticated);
    },

    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    // The year-specific links need a planting year
    sections() {
      return sectionsFor(this.plantingYear != null);
    },

    activeView() {
      return activeViewFor(this.$route.path);
    },

    ...mapState(usePlantsStore, [
      'plantsById',
    ]),

    ...mapState(usePlantingsStore, [
      'plantingsById',
    ]),

    ...mapState(usePlantingYearsStore, {
      // the year last fetched, a record: not the common store's year number
      storedPlantingYear: 'plantingYear',
    }),

    ...mapState(useActivitySchedulesStore, [
      'selectedActivitySchedule',
    ]),

    crumbs() {
      return crumbsFor(this.$route.path, {
        isPlantingYearSelected: this.plantingYear != null,
        records: {
          plantsById: this.plantsById,
          plantingsById: this.plantingsById,
          plantingYear: this.storedPlantingYear,
          activitySchedule: this.selectedActivitySchedule,
        },
      });
    },
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'logout',
    ]),

    async logoutUser() {
      await this.logout();
      this.$router.push(views.login.path);
    },
  },
}
</script>

<style scoped>
.planting-year {
  color: forestgreen;
  font-weight: bolder;
}
</style>
