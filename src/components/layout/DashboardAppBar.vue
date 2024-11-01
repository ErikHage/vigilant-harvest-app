<template>
  <v-app-bar app>
    <v-btn v-if="showYearSpecificViews" to="/dashboard/garden">Garden</v-btn>
    <v-btn to="/dashboard/plants">Plants</v-btn>
    <v-btn to="/dashboard/plots">Plots</v-btn>
    <v-btn v-if="showYearSpecificViews" to="/dashboard/plantings">Plantings</v-btn>
    <v-btn v-if="showYearSpecificViews" to="/dashboard/harvests">Harvests</v-btn>
  </v-app-bar>
</template>

<script>
import { views } from "@/utils/constants";

export default {
  name: "DashboardAppBar",

  props: [ 'isPlantingYearSelected' ],

  data: () => ({
    dashboardPath: views.dashboard.path,
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
