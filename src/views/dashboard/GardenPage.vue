<template>
  <v-container>
    <v-row class="text-center" v-if="selectedYear == null">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-select
                v-model="selectedYear"
                :items="availableYears"
                :item-title="(year) => year"
                :item-value="(year) => year"
                label="Select Year"
                variant="solo"
                @update:model-value="onSelectYearChange"
            ></v-select>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="selectedYear != null">
      <v-col cols="12">
        <div>
          <!-- TODO make this a better looking and centered title -->
          <h2>Garden {{ this.selectedYear }}</h2>
        </div>
        <v-row>
        <v-col cols="6" v-for="hydratedPlot in hydratedPlots">
          <v-card>
            <v-card-title>
              {{ hydratedPlot.friendlyName }}
            </v-card-title>
            <v-card-text>
              <v-card v-for="planting in hydratedPlot.plantings">
                <v-card-text>
                  {{ planting.plant.friendlyName }} [ {{ planting.numPlants }} ]
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>
        </v-col>
        </v-row>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import sorting from "@/utils/sorting";

export default {
  name: 'GardenPage',

  components: {},

  data: () => ({
    availableYears: [2024, 2025], // TODO source from backend
    selectedYear: null,
    loading: false,
  }),

  computed: {
    ...mapState(usePlotsStore, [
      'plots', 'plotsById',
    ]),

    ...mapState(usePlantsStore, [
      'plants', 'plantsById',
    ]),

    ...mapState(usePlantingsStore, [
      'plantings',
    ]),

    hydratedPlots() {
      const mappedPlots = this.plantings.reduce((acc, planting) => {
        if (!acc[planting.plotId]) {
          const plot = this.plotsById[planting.plotId];

          acc[planting.plotId] = {
            ...plot,
            plantings: [],
          };
        }

        const plant = this.plantsById[planting.plantId];

        acc[planting.plotId].plantings.push({
          ...planting,
          plant,
        });

        return acc;
      }, {});

      const toList = Object.values(mappedPlots);

      // TODO why is sorting failing? do we need to wait for data to be populated?
      // return toList.sort(sorting.sortByPlotFriendlyName);
      return toList;
    },
  },

  methods: {
    ...mapActions(usePlotsStore, [
      'fetchPlots',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
      'selectPlantingYear',
    ]),

    async onSelectYearChange(year) {
      this.loading = true;
      await this.selectPlantingYear(year);
      await this.refreshData();
      this.loading = false;
    },

    async refreshData() {
      if (this.selectedYear) {
        await this.fetchPlots();
        await this.fetchPlants();
        await this.fetchPlantingsByYear(this.selectedYear);
      }
    },
  },

  async mounted() {
    // load available years
  }
}
</script>
