<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Garden Overview"/>
        <v-spacer></v-spacer>
        <!-- the dialog offers the plots' plantings, so it waits for the first load -->
        <v-btn class="mt-3" color="primary" :disabled="!initialized" @click="openAddHarvestDialog">Add Harvests</v-btn>
        <v-btn class="mt-3 ml-3" color="success" @click="goToJournal">Journal</v-btn>
        <v-btn class="mt-3 ml-3" color="success" @click="goToActivityLog">Activity Log</v-btn>
        <v-btn class="mt-3 ml-3" color="default" @click="toggleShowRetired">{{ showRetired ? "Hide Retired" : "Show Retired" }}</v-btn>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="12" lg="4" md="6"
                 v-for="hydratedPlot in hydratedPlots">
            <harvest-summary :hydrated-plot="hydratedPlot" :show-retired="showRetired"/>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="800px" persistent>
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
          <v-alert v-if="saveErrorMessage"
                   type="error"
                   density="compact"
                   class="mb-4">{{ saveErrorMessage }}
          </v-alert>

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
              <v-row no-gutters class="harvest-row">
                <v-col cols="5">
                  <div class="d-flex flex-column align-start justify-center">
                    <span class="text-success">{{ harvestFormRecord.plantingName }}</span>
                    <span class="smaller-text">{{ harvestFormRecord.plantName }}</span>
                  </div>
                </v-col>
                <v-col cols="4">
                  <v-select v-model="harvestsForm[harvestFormRecord.plantingId].harvestTypeId"
                            :items="harvestTypes"
                            item-title="harvestTypeName"
                            item-value="harvestTypeId"
                            label="Type"
                            density="compact"
                            variant="solo"
                  ></v-select>
                </v-col>
                <v-col cols="3">
                  <v-text-field v-model.number="harvestsForm[harvestFormRecord.plantingId].quantity"
                                type="number"
                                step="1"
                                label="Quantity"
                                required
                                density="compact"
                                :error-messages="quantityError(harvestsForm[harvestFormRecord.plantingId].quantity)"
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="confirmHarvests" :disabled="!canSave">Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmHarvestsDialog
        :show="harvestsConfirmDialog"
        :harvest-date="selectedHarvestDate"
        :harvests="harvestsEntered"
        :harvest-types="harvestTypes"
        :on-cancel="closeConfirmDialog"
        :on-back="goBackToHarvestDialog"
        :saving="saving"
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
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import harvestUtils from "@/utils/harvest-utils";
import { toLocalDate } from '@/utils/dates';
import { alertOf } from '@/store/alerts';

export default {
  name: 'GardenPage',

  components: {
    ConfirmHarvestsDialog,
    DatePickerDialogActivator,
    FadeOutAlert,
    HarvestSummary,
    PageTitle,
  },

  data: () => ({
    initialized: false,
    showRetired: false,

    selectedHarvestDate: new Date(),

    dialog: false,
    selectedPlot: null,
    harvestsForm: {},

    harvestsConfirmDialog: false,
    saveErrorMessage: '',
    // a save in flight: Confirm waits for it, so a second press can't file the harvests twice
    saving: false,
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
      plantsById: 'plantsById',
      harvestTypes: 'harvestTypes',
    }),

    ...mapState(usePlantingsStore, {
      plantings: 'plantings',
    }),

    ...mapState(useHarvestsStore, {
      harvestQuantitiesByPlanting: 'harvestQuantitiesByPlanting',
    }),

    alerts() {
      return [useHarvestsStore(), usePlotsStore(), usePlantsStore(), usePlantingsStore()].map(alertOf);
    },

    filteredPlots() {
      return [...this.plots].sort(sorting.sortByFriendlyName);
    },

    hydratedPlots() {
      if (this.initialized) {
        const mappedPlots = this.plantings
            // only with a plot, and one that's loaded: the garden is laid out
            // by plot, and the plots store's alert says when they didn't load
            .filter(planting => planting.plotId && this.plotsById[planting.plotId])
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
                harvestQuantities: this.harvestQuantitiesByPlanting[planting.plantingId] ?? [],
              });

              return acc;
            }, {});

        return Object.values(mappedPlots).sort(sorting.sortByFriendlyName);
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

    // at least one, and each a whole number: the service stores a quantity
    // as one, rounding a fraction
    canSave() {
      return this.harvestsEntered.length > 0 && this.harvestsEntered.every(harvest => Number.isInteger(harvest.quantity));
    },
  },

  methods: {
    ...mapActions(usePlotsStore, [
      'fetchPlots',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
      'fetchHarvestTypes',
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
      this.saveErrorMessage = '';
      // harvested today, the day it's opened: an override from before, and
      // the day the page was opened, are gone
      this.selectedHarvestDate = new Date();
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
            // a plant that didn't load: the planting is offered without it
            plantName: tempPlanting.plant?.friendlyName,
            harvestTypeId: tempPlanting.plant?.harvesting?.defaultHarvestTypeId
                ?? harvestUtils.unspecifiedHarvestTypeId,
            quantity: 0,
            currentStatus: tempPlanting.currentStatus,
          }
        }
      }

      this.dialog = true;
    },

    // a fraction is the one case worth saying why: the box takes it, and
    // Save waits
    quantityError(quantity) {
      return typeof quantity === 'number' && quantity > 0 && !Number.isInteger(quantity) ? 'A whole number' : [];
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

    toggleShowRetired() {
      this.showRetired = !this.showRetired;
    },

    closeConfirmDialog() {
      this.clearHarvestFormState();
    },

    async saveHarvests() {
      if (this.saving) {
        return;
      }
      const mappedHarvests = Object.values(this.harvestsForm)
          .filter(h => h.quantity > 0)
          .map(h => ({
            plantingYear: this.plantingYear,
            plantingId: h.plantingId,
            quantity: h.quantity,
            harvestDate: toLocalDate(this.selectedHarvestDate),
            harvestTypeId: h.harvestTypeId,
          }));

      // Save is offered only once a quantity is entered, so there's always one
      this.saving = true;
      try {
        await this.upsertHarvests(mappedHarvests);
      } catch (err) {
        // reopen the entry dialog so the quantities survive a rejected harvest type id
        this.saveErrorMessage = harvestUtils.upsertErrorMessage(err, 'error saving harvests');
        this.goBackToHarvestDialog();
        return;
      } finally {
        this.saving = false;
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
      await this.fetchHarvestTypes();
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
.harvest-row {
  align-items: center;
}

.smaller-text {
  font-size: 0.8rem;
  color: gray;
}
</style>
