<template>
  <v-app-bar app>

    <template v-if="$vuetify.display.smAndDown">
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item v-if="showPlanningLink" :to="planningPagePath" link>
            <v-list-item-title>Planning</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="showYearSpecificViews" :to="gardenPagePath" link>
            <v-list-item-title>Garden</v-list-item-title>
          </v-list-item>
          <v-list-item :to="plantsPagePath" link>
            <v-list-item-title>Plants</v-list-item-title>
          </v-list-item>
          <v-list-item :to="plotsPagePath" link>
            <v-list-item-title>Plots</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="showYearSpecificViews" :to="plantingsPagePath" link>
            <v-list-item-title>Plantings</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="showYearSpecificViews" :to="harvestsPagePath" link>
            <v-list-item-title>Harvests</v-list-item-title>
          </v-list-item>
          <v-list-group v-if="showYearSpecificViews" value="stats">
            <template #activator="{ props }">
              <v-list-item v-bind="props">
                <v-list-item-title>Stats</v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item :to="statsPlantPagePath" link>
              <v-list-item-title>Plant</v-list-item-title>
            </v-list-item>
            <v-list-item :to="statsPlantingPagePath" link>
              <v-list-item-title>Planting</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-menu>
    </template>

    <template v-else>
      <v-btn v-if="showPlanningLink" :to="planningPagePath">Planning</v-btn>
      <v-btn v-if="showYearSpecificViews" :to="gardenPagePath">Garden</v-btn>
      <v-btn :to="plantsPagePath">Plants</v-btn>
      <v-btn :to="plotsPagePath">Plots</v-btn>
      <v-btn v-if="showYearSpecificViews" :to="plantingsPagePath">Plantings</v-btn>
      <v-btn v-if="showYearSpecificViews" :to="harvestsPagePath">Harvests</v-btn>
      <v-menu v-if="showYearSpecificViews" offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props">
            Stats
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item :to="statsPlantPagePath" link>
            <v-list-item-title>Plant</v-list-item-title>
          </v-list-item>
          <v-list-item :to="statsPlantingPagePath" link>
            <v-list-item-title>Planting</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

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
    statsPlantPagePath: views.dashboard.path + "/" + views.dashboard.children.stats.plant.path,
    statsPlantingPagePath: views.dashboard.path + "/" + views.dashboard.children.stats.planting.path,
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
