<template>
  <v-container>
    <v-row class="text-center" v-if="plantingYear == null">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-select
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

    <v-row v-if="plantingYear != null">
      <v-col cols="12">
        <div>
          <h2 class="mb-2">Garden {{ this.plantingYear }}</h2>
          <v-btn class="mb-3" color="blue darken-1" text @click="openDialog">Add Harvests</v-btn>
        </div>
        <v-row>
          <v-col cols="6"
                 v-if="!loading"
                 v-for="hydratedPlot in hydratedPlots">
            <v-card>
              <v-card-title>
                {{ hydratedPlot.friendlyName }}
              </v-card-title>
              <v-card-text>
                <v-card v-for="planting in hydratedPlot.plantings">
                  <v-card-text>
                    <span>{{ planting.plant.friendlyName }}</span>
                    <v-chip class="ml-2 mr-2"
                            color="green">
                      {{ planting.numPlants }} &nbsp;
                      <v-icon>mdi-leaf</v-icon>
                    </v-chip>
                    <v-chip v-if="planting.harvestQuantity > 0"
                            color="yellow">
                      {{ planting.harvestQuantity }} &nbsp;
                      <v-icon>mdi-basket-fill</v-icon>
                    </v-chip>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent v-if="!loading">
      <v-card>
        <v-card-title>
          <span class="headline">Add Harvests</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="addHarvestsForm">
            <div v-for="harvestFormRecord in Object.values(harvestsForm)">
              <span>{{ harvestFormRecord.plotName }} | {{ harvestFormRecord.plantName }}</span>
              <v-text-field v-model.number="harvestsForm[harvestFormRecord.plantingId].quantity"
                            type="number"
                            label="Quantity"
                            required
              ></v-text-field>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="saveHarvests">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import sorting from "@/utils/sorting";

export default {
  name: 'GardenPage',

  components: {},

  data: () => ({
    loading: false,
    dialog: false,
    harvestsForm: {},
  }),

  computed: {
    ...mapState(useCommonStore, [
      'availableYears', 'plantingYear',
    ]),

    ...mapState(usePlotsStore, [
      'plots', 'plotsById',
    ]),

    ...mapState(usePlantsStore, [
      'plants', 'plantsById',
    ]),

    ...mapState(usePlantingsStore, [
      'plantings',
    ]),

    ...mapState(useHarvestsStore, [
      'harvestCounts',
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
          harvestQuantity: this.harvestCounts[planting.plantingId] ?? 0,
        });

        return acc;
      }, {});

      return Object.values(mappedPlots).sort(sorting.sortByPlotFriendlyName);
    },
  },

  methods: {
    ...mapActions(useCommonStore, [
      'selectPlantingYear',
    ]),

    ...mapActions(usePlotsStore, [
      'fetchPlots',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
    ]),

    ...mapActions(useHarvestsStore, [
      'insertHarvests',
      'fetchHarvestSummariesByYear',
    ]),

    async onSelectYearChange(year) {
      this.loading = true;
      await this.selectPlantingYear(year);
      await this.refreshData();
      this.loading = false;
    },

    openDialog() {
      if (!this.loading) {
        const tempPlots = this.hydratedPlots;

        for (let i = 0; i < tempPlots.length; i++) {
          const plot = tempPlots[i];
          for (let j = 0; j < plot.plantings.length; j++) {
            const tempPlanting = plot.plantings[j];
            this.harvestsForm[tempPlanting.plantingId] = {
              plantingId: tempPlanting.plantingId,
              plotName: plot.friendlyName,
              plantName: tempPlanting.plant.friendlyName,
              quantity: 0,
            }
          }
        }

        console.log('harvestsForm', this.harvestsForm);

        this.dialog = true;
      }
    },

    closeDialog() {
      this.dialog = false;
      this.harvestsForm = {};
    },

    async saveHarvests() {
      const mappedHarvests = Object.values(this.harvestsForm)
          .filter(h => h.quantity > 0)
          .map(h => ({
            plantingYear: this.plantingYear,
            plantingId: h.plantingId,
            quantity: h.quantity,
          }));

      if (mappedHarvests.length > 0) {
        await this.insertHarvests(mappedHarvests);
      } else {
        console.log('no harvests entered, skipping save');
      }

      this.closeDialog();
      await this.refreshData();
    },

    async refreshData() {
      if (this.plantingYear) {
        await this.fetchPlots();
        await this.fetchPlants();
        await this.fetchPlantingsByYear(this.plantingYear);
        await this.fetchHarvestSummariesByYear(this.plantingYear);
      }
    },
  },

  async mounted() {
    // load available years
  }
}
</script>
