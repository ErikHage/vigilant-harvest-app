<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Garden Overview"/>
        <v-spacer></v-spacer>
        <v-btn class="mt-3" color="primary" @click="openAddHarvestDialog">Add Harvests</v-btn>
        <v-btn class="mt-3 ml-3" color="success" @click="goToJournal">Journal</v-btn>
        <v-btn class="mt-3 ml-3" color="success" @click="goToActivityLog">Activity Log</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="12" lg="4" md="6"
                 v-if="!loading"
                 v-for="hydratedPlot in hydratedPlots">
            <harvest-summary :hydrated-plot="hydratedPlot"/>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="800px" persistent v-if="!loading">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="headline mr-4">Add Harvests</span>
          <div class="d-flex align-center justify-end">
            <date-picker-dialog-activator
                :on-submit="confirmHarvestDateOverrideDialog"
                title="Override Harvest Date"
                :date="selectedHarvestDate"/>
            <span class="headline ml-2">{{ selectedHarvestDate.toDateString() }}</span>
          </div>
        </v-card-title>
        <v-card-text>
          <v-form ref="addHarvestsForm">
            <v-select
                :items="filteredPlots"
                :item-title="(plot) => plot.friendlyName"
                :item-value="(plot) => plot.plotId"
                label="Select Plot"
                variant="solo"
                return-object
                @update:model-value="onDialogSelectPlotChange"
            ></v-select>
            <div v-if="selectedPlot && filteredHarvestFormRecords.length === 0">
              <span>There are no plantings to harvest in {{ selectedPlot.friendlyName }}</span>
            </div>
            <div v-if="selectedPlot"
                 v-for="harvestFormRecord in filteredHarvestFormRecords"
                 :key="harvestFormRecord.plantingId">
              <v-row no-gutters>
                <v-col cols="8">
                  <div class="d-flex flex-column align-start justify-center">
                    <span class="text-success">{{ harvestFormRecord.plantingName }}</span>
                    <span class="smaller-text">{{ harvestFormRecord.plantName }}</span>
                  </div>
                </v-col>
                <v-col cols="4">
                  <v-text-field v-model.number="harvestsForm[harvestFormRecord.plantingId].quantity"
                                type="number"
                                label="Quantity"
                                required
                                density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="confirmHarvests" :disabled="this.harvestsEntered.length === 0">Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmHarvestsDialog
        :show="harvestsConfirmDialog"
        :harvest-date="selectedHarvestDate"
        :harvests="harvestsEntered"
        :on-cancel="closeConfirmDialog"
        :on-back="goBackToHarvestDialog"
        :on-confirm="saveHarvests"/>

  </v-container>
</template>

<script>

import {mapActions, mapState} from "pinia";
import {useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore, usePlotsStore} from "@/store";
import sorting from "@/utils/sorting";
import PageTitle from "@/components/layout/PageTitle.vue";
import HarvestSummary from "@/components/harvests/HarvestSummary.vue";
import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";
import ConfirmHarvestsDialog from "@/components/garden/ConfirmHarvestsDialog.vue";

export default {
  name: 'GardenPage',

  components: {
    ConfirmHarvestsDialog,
    DatePickerDialogActivator,
    HarvestSummary,
    PageTitle,
  },

  data: () => ({
    loading: false,
    initialized: false,

    overrideHarvestDateDialog: false,
    selectedHarvestDate: new Date(),

    dialog: false,
    selectedPlot: null,
    harvestsForm: {},

    harvestsConfirmDialog: false,
  }),

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(usePlotsStore, {
      plots: 'plots',
      plotsById: 'plotsById',
    }),

    ...mapState(usePlantsStore, {
      plants: 'plants',
      plantsById: 'plantsById',
    }),

    ...mapState(usePlantingsStore, {
      plantings: 'plantings',
    }),

    ...mapState(useHarvestsStore, {
      harvestCounts: 'harvestCounts',
    }),

    filteredPlots() {
      return this.plots.sort(sorting.sortByPlotFriendlyName);
    },

    hydratedPlots() {
      if (this.initialized) {
        const mappedPlots = this.plantings
            .filter(planting => planting.plotId) // only with assigned
            .reduce((acc, planting) => {
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
      } else {
        return {};
      }
    },

    filteredHarvestFormRecords() {
      return Object.values(this.harvestsForm)
          .filter(this.isRecordInSelectedPlot)
          .filter(this.isRecordNotRetired);
    },

    harvestsEntered() {
      return Object.values(this.harvestsForm).filter(harvest => harvest.quantity > 0);
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
    ]),

    ...mapActions(useHarvestsStore, [
      'upsertHarvests',
      'fetchHarvestSummariesByYear',
    ]),

    goToJournal() {
      this.$router.push({
        name: 'Journal',
      });
    },

    goToActivityLog() {
      this.$router.push({
        name: 'ActivityLog',
      });
    },

    openAddHarvestDialog() {
      if (!this.loading) {
        const tempPlots = this.hydratedPlots;

        for (let i = 0; i < tempPlots.length; i++) {
          const plot = tempPlots[i];
          for (let j = 0; j < plot.plantings.length; j++) {
            const tempPlanting = plot.plantings[j];
            this.harvestsForm[tempPlanting.plantingId] = {
              plotId: plot.plotId,
              plotName: plot.friendlyName,
              plantingId: tempPlanting.plantingId,
              plantingName: tempPlanting.name,
              plantName: tempPlanting.plant.friendlyName,
              quantity: 0,
              currentStatus: tempPlanting.currentStatus,
            }
          }
        }

        this.dialog = true;
      }
    },

    onDialogSelectPlotChange(plot) {
      this.selectedPlot = plot;
    },

    isRecordInSelectedPlot(harvestFormRecord) {
      return this.selectedPlot?.plotId === harvestFormRecord.plotId;
    },

    isRecordNotRetired(harvestFormRecord) {
      return harvestFormRecord.currentStatus !== 'RETIRED';
    },

    confirmHarvestDateOverrideDialog(date) {
      this.selectedHarvestDate = date;
    },

    closeDialog() {
      this.clearHarvestFormState();
    },

    confirmHarvests() {
      this.dialog = false;
      this.harvestsConfirmDialog = true;
    },

    goBackToHarvestDialog() {
      this.harvestsConfirmDialog = false;
      this.dialog = true;
    },

    closeConfirmDialog() {
      this.clearHarvestFormState();
    },

    async saveHarvests() {
      const mappedHarvests = Object.values(this.harvestsForm)
          .filter(h => h.quantity > 0)
          .map(h => ({
            plantingYear: this.plantingYear,
            plantingId: h.plantingId,
            quantity: h.quantity,
            harvestDate: this.selectedHarvestDate,
          }));

      if (mappedHarvests.length > 0) {
        await this.upsertHarvests(mappedHarvests);
      } else {
        console.log('no harvests entered, skipping save');
      }

      this.closeConfirmDialog();
      this.clearHarvestFormState();
      await this.refreshData();
    },

    clearHarvestFormState() {
      this.dialog = false;
      this.harvestsConfirmDialog = false;
      this.harvestsForm = {};
      this.selectedPlot = null;
    },

    async refreshData() {
      await this.fetchPlots();
      await this.fetchPlants();
      await this.fetchPlantingsByYear(this.plantingYear);
      await this.fetchHarvestSummariesByYear(this.plantingYear);
      this.initialized = true;
    },
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
.smaller-text {
  font-size: 0.8rem;
  color: gray;
}
</style>
