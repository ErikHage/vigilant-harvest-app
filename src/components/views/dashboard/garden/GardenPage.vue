<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Garden Overview"/>
        <v-spacer></v-spacer>
        <strong>Harvest Date:</strong> {{ this.selectedHarvestDateString }}
        <v-spacer></v-spacer>
        <v-btn class="mt-3 mr-3" color="success" @click="openHarvestDateOverrideDialog">Override Date</v-btn>
        <v-btn class="mt-3" color="primary" @click="openDialog">Add Harvests</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="6"
                 v-if="!loading"
                 v-for="hydratedPlot in hydratedPlots">
            <harvest-summary :hydrated-plot="hydratedPlot"/>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <date-picker-dialog
        :show="overrideHarvestDateDialog"
        title="Override Harvest Date"
        :date="selectedHarvestDate"
        :on-submit="confirmHarvestDateOverrideDialog"
        :on-cancel="closeHarvestDateOverrideDialog"
    />

    <v-dialog v-model="dialog" max-width="800px" persistent v-if="!loading">
      <v-card>
        <v-card-title>
          <span class="headline">Add Harvests [{{ this.selectedHarvestDate.toDateString() }}]</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="addHarvestsForm">
            <v-select
                :items="plots"
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
                  <span class="headline">{{ harvestFormRecord.plotName }}: {{ harvestFormRecord.plantName }}</span>
                </v-col>
                <v-col cols="4">
                  <v-text-field v-model.number="harvestsForm[harvestFormRecord.plantingId].quantity"
                                type="number"
                                label="Quantity"
                                required
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" text @click="confirmHarvests" :disabled="this.harvestsEntered.length === 0">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="harvestsConfirmDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">Confirm Harvests [{{ this.selectedHarvestDate.toDateString() }}]</span>
        </v-card-title>
        <v-card-text>
          <div v-for="harvestFormRecord in harvestsEntered"
               :key="harvestFormRecord.plantingId">
            <span class="headline">{{ harvestFormRecord.plotName }}: {{ harvestFormRecord.plantName }}</span>
            &nbsp;
            <v-chip color="yellow">+{{ harvestFormRecord.quantity }}</v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="closeConfirmDialog">Cancel</v-btn>
          <v-btn color="warning" text @click="goBackToHarvestDialog">Back</v-btn>
          <v-btn color="primary" text @click="saveHarvests">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import sorting from "@/utils/sorting";
import PageTitle from "@/components/layout/PageTitle.vue";
import HarvestSummary from "@/components/harvests/HarvestSummary.vue";
import DatePickerDialog from "@/components/utils/DatePickerDialog.vue";

export default {
  name: 'GardenPage',

  components: {
    DatePickerDialog,
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

    hydratedPlots() {
      if (this.initialized) {
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
      } else {
        return {};
      }
    },

    filteredHarvestFormRecords() {
      return Object.values(this.harvestsForm).filter(this.isRecordInSelectedPlot);
    },

    harvestsEntered() {
      return Object.values(this.harvestsForm).filter(harvest => harvest.quantity > 0);
    },

    selectedHarvestDateString() {
      return this.selectedHarvestDate.toDateString();
    }
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

    async onSelectYearChange(year) {
      this.loading = true;
      this.selectPlantingYear(year);
      await this.refreshData();
      this.loading = false;
    },

    async onSelectYearClear() {
      this.clearPlantingYear();
      await this.refreshData();
    },

    openDialog() {
      if (!this.loading) {
        const tempPlots = this.hydratedPlots;

        for (let i = 0; i < tempPlots.length; i++) {
          const plot = tempPlots[i];
          for (let j = 0; j < plot.plantings.length; j++) {
            const tempPlanting = plot.plantings[j];
            this.harvestsForm[tempPlanting.plantingId] = {
              plotId: plot.plotId,
              plantingId: tempPlanting.plantingId,
              plotName: plot.friendlyName,
              plantName: tempPlanting.plant.friendlyName,
              quantity: 0,
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

    openHarvestDateOverrideDialog() {
      this.overrideHarvestDateDialog = true;
    },

    confirmHarvestDateOverrideDialog(date) {
      this.selectedHarvestDate = date;
      this.overrideHarvestDateDialog = false;
    },

    closeHarvestDateOverrideDialog() {
      this.selectedHarvestDate = new Date();
      this.overrideHarvestDateDialog = false;
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
