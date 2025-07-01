<template>
  <v-app-bar app>
    <v-btn v-if="showPlanningLink" :to="planningPagePath">Planning</v-btn>
    <v-btn v-if="showYearSpecificViews" :to="gardenPagePath">Garden</v-btn>
    <v-btn :to="plantsPagePath">Plants</v-btn>
    <v-btn :to="plotsPagePath">Plots</v-btn>
    <v-btn v-if="showYearSpecificViews" :to="plantingsPagePath">Plantings</v-btn>
    <v-btn v-if="showYearSpecificViews" :to="harvestsPagePath">Harvests</v-btn>
    <v-btn v-if="showYearSpecificViews" :to="statsPagePath">Stats</v-btn>
  </v-app-bar>
</template>

<script>
import {views} from "@/utils/constants";

export default {
  name: "DashboardAppBar",

  props: {
    isPlantingYearSelected: {
      type: Boolean,
      required: true,
    },
    plantingYear: {
      type: Object,
    }
  },

  data: () => ({
    gardenPagePath: views.dashboard.path + "/" + views.dashboard.children.garden.path,
    planningPagePath: views.dashboard.path + "/" + views.dashboard.children.planning.path,
    plantsPagePath: views.dashboard.path + "/" + views.dashboard.children.plants.path,
    plotsPagePath: views.dashboard.path + "/" + views.dashboard.children.plots.path,
    plantingsPagePath: views.dashboard.path + "/" + views.dashboard.children.plantings.path,
    harvestsPagePath: views.dashboard.path + "/" + views.dashboard.children.harvests.path,
    statsPagePath: views.dashboard.path + "/" + views.dashboard.children.stats.path,
  }),

  computed: {
    showPlanningLink() {
      if (!this.showYearSpecificViews()) {
        return false;
      }

      if (!this.plantingYear) {
        return false;
      }

      const plantingCounts = this.extractCounts(this.plantingYear.details);

      return plantingCounts.created > 0 || plantingCounts.started > 0;
    },
  },

  methods: {
    showYearSpecificViews() {
      return this.isPlantingYearSelected === true;
    },

    extractCounts(plantingYearDetails) {
      return {
        created: plantingYearDetails?.createdPlantings ?? 0,
        started: plantingYearDetails?.startedPlantings ?? 0,
      };
    },
  },
}
</script>

<style scoped>

</style>
