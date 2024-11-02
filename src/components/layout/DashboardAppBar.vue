<template>
  <v-app-bar app>
    <v-btn v-if="showYearSpecificViews" :to="gardenPagePath">Garden</v-btn>
    <v-btn :to="plantsPagePath">Plants</v-btn>
    <v-btn :to="plotsPagePath">Plots</v-btn>
    <v-btn v-if="showYearSpecificViews" :to="plantingsPagePath">Plantings</v-btn>
    <v-btn v-if="showYearSpecificViews" :to="harvestsPagePath">Harvests</v-btn>
  </v-app-bar>
</template>

<script>
import { views } from "@/utils/constants";

export default {
  name: "DashboardAppBar",

  props: [ 'isPlantingYearSelected' ],

  data: () => ({
    dashboardPath: views.dashboard.path,
    gardenPagePath: this.dashboardPath + "/" + views.dashboard.children.garden.path,
    plantsPagePath: this.dashboardPath + "/" + views.dashboard.children.plants.path,
    plotsPagePath: this.dashboardPath + "/" + views.dashboard.children.plots.path,
    plantingsPagePath: this.dashboardPath + "/" + views.dashboard.children.plantings.path,
    harvestsPagePath: this.dashboardPath + "/" + views.dashboard.children.harvests.path,
  }),

  computed: {
    showYearSpecificViews() {
      return this.isPlantingYearSelected === true;
    }
  },
}
</script>

<style scoped>

</style>
