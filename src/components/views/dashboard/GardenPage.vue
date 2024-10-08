<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Garden Overview"/>
        <v-spacer></v-spacer>
        <planting-year-select-card
            :available-years="availableYears"
            :on-select-year-change="onSelectYearChange"
            :on-select-year-clear="onSelectYearClear"
            :selected-year="plantingYear" />
        <br />
        <span v-if="isPlantingYearSelected">
          <strong>Harvest Date:</strong> {{ this.selectedHarvestDateString }}
        </span>
        <v-spacer></v-spacer>
        <v-btn v-if="isPlantingYearSelected" class="mt-3 mr-3" color="orange darken-1" @click="openHarvestDateOverrideDialog">Override Date</v-btn>
        <v-btn v-if="isPlantingYearSelected" class="mt-3" color="blue darken-1" @click="openDialog">Add Harvests</v-btn>
      </v-col>
    </v-row>

    <v-row v-if="isPlantingYearSelected">
      <v-col cols="12">
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
                    <v-chip class="ml-2 mr-2"
                            color="green">
                      {{ planting.numPlants }} &nbsp;
                      <v-icon>mdi-leaf</v-icon>
                    </v-chip>
                    <span>{{ planting.plant.friendlyName }}</span>
                    &nbsp;
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

    <v-dialog v-model="overrideHarvestDateDialog" max-width="500px" persistent v-if="!loading">
      <v-card>
        <v-card-title>
          <span class="headline">Override Harvest Date</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="addHarvestsForm">
            <v-date-picker
                v-model="selectedHarvestDate"
                label="Select Date"
                required
                locale="en"
                full-width
            ></v-date-picker>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="closeHarvestDateOverrideDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="confirmHarvestDateOverrideDialog">Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
                @update:model-value="onDialogSelectPlotChange"
            ></v-select>
            <div v-if="selectedPlot"
                 v-for="harvestFormRecord in Object.values(harvestsForm).filter(isRecordInSelectedPlot)"
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
          <v-btn color="red darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="confirmHarvests">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="harvestsConfirmDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">Confirm Harvests [{{ this.selectedHarvestDate.toDateString() }}]</span>
        </v-card-title>
        <v-card-text>
          <div v-for="harvestFormRecord in Object.values(harvestsForm).filter(harvest => harvest.quantity > 0)"
               :key="harvestFormRecord.plantingId">
            <span class="headline">{{ harvestFormRecord.plotName }}: {{ harvestFormRecord.plantName }}</span>
            &nbsp;
            <v-chip color="yellow">+{{ harvestFormRecord.quantity }}</v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="closeConfirmDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="goBackToHarvestDialog">Back</v-btn>
          <v-btn color="blue darken-1" text @click="saveHarvests">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import sorting from "@/utils/sorting";
import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'GardenPage',

  components: { PageTitle, PlantingYearSelectCard },

  data: () => ({
    loading: false,

    overrideHarvestDateDialog: false,
    selectedHarvestDate: new Date(),

    dialog: false,
    selectedPlot: null,
    harvestsForm: {},

    harvestsConfirmDialog: false,
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

    isPlantingYearSelected() {
      return this.plantingYear != null;
    },

    selectedHarvestDateString() {
      return this.selectedHarvestDate.toDateString();
    }
  },

  methods: {
    ...mapActions(useCommonStore, [
      'selectPlantingYear',
      'clearPlantingYear',
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

    onDialogSelectPlotChange(plotId) {
      this.selectedPlot = plotId;
    },

    isRecordInSelectedPlot(harvestFormRecord) {
      return this.selectedPlot === harvestFormRecord.plotId;
    },

    openHarvestDateOverrideDialog() {
      this.overrideHarvestDateDialog = true;
    },

    confirmHarvestDateOverrideDialog() {
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
        await this.insertHarvests(mappedHarvests);
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
      if (this.plantingYear) {
        await this.fetchPlots();
        await this.fetchPlants();
        await this.fetchPlantingsByYear(this.plantingYear);
        await this.fetchHarvestSummariesByYear(this.plantingYear);
      }
    },
  },
}
</script>
