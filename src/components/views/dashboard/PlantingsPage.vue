<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Manage Plantings"/>
        <v-spacer></v-spacer>
        <planting-year-select-card
            :available-years="availableYears"
            :on-select-year-change="onSelectYearChange"
            :on-select-year-clear="onSelectYearClear"
            :selected-year="plantingYear" />
        <v-spacer></v-spacer>
        <v-btn v-if="plantingYear != null" class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
        <v-btn v-if="plantingYear != null" class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="12">
        <v-card v-if="plantingYear != null">
          <v-card-text>
            <v-data-table
                class="elevation-1 align-left"
                :headers="headers"
                :items="hydratedPlantings"
                item-key="plantingId"
            >
              <template #item.actions="{ item }">
                <v-icon small @click="openDialog(item)">mdi-pencil</v-icon>
                <!-- TODO add delete button, with confirm dialog. only admin can see/use it -->
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ isEditMode ? 'Edit Planting' : 'Add Planting' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="applicationForm">
            <v-text-field
                v-model.number="form.plantingId"
                type="text"
                label="Planting Id"
                readonly
            ></v-text-field>
            <v-select
                v-model="form.plantId"
                :items="plants"
                :item-title="(plant) => plant.friendlyName"
                :item-value="(plant) => plant.plantId"
                label="Select Plant"
                variant="solo"
            ></v-select>
            <v-select
                v-model="form.plotId"
                :items="plots"
                :item-title="(plot) => plot.friendlyName"
                :item-value="(plot) => plot.plotId"
                label="Select Plot"
                variant="solo"
            ></v-select>
            <v-text-field
                v-model.number="form.numPlants"
                type="number"
                label="Number of Plants"
                required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isEditMode" color="blue darken-1" text @click="savePlanting">Update</v-btn>
          <v-btn v-else color="blue darken-1" text @click="savePlanting">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'PlantingsPage',

  components: {
    PageTitle,
    PlantingYearSelectCard,
  },

  data: () => ({
    dialog: false,
    isEditMode: false,
    headers: [
      // { title: 'Id', key: 'plantingId', align: 'left', }, // probably don't need to show this on table
      { title: 'Plant', key: 'plantName', align: 'start', },
      { title: 'Plot', key: 'plotName', align: 'start', },
      { title: 'Count', key: 'numPlants', align: 'start', },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
    form: {
      plantingId: null,
      plotId: '',
      plantId: '',
      numPlants: 0,
    },
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
      'plantings', 'alertType', 'alertMessage', 'alertVisible',
    ]),

    hydratedPlantings() {
      return this.plantings.map(planting => {
        const plant = this.plantsById[planting.plantId];
        const plot = this.plotsById[planting.plotId];
        return {
          ...planting,
          plantName: plant.friendlyName,
          plotName: plot.friendlyName,
        };
      });
    },
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
      'upsertPlanting',
      'fetchPlantingsByYear',
    ]),

    resetForm() {
      this.form = {
        plantingId: null,
        plotId: '',
        plantId: '',
        numPlants: 0,
      };
    },

    openDialog(planting) {
      if (planting !== undefined) {
        console.log('in edit mode if block');
        this.form = {
          plantingId: planting.plantingId,
          plotId: planting.plotId,
          plantId: planting.plantId,
          numPlants: planting.numPlants,
        };
        this.isEditMode = true;
      } else {
        console.log('in non-edit mode if block');
        this.resetForm();
        this.isEditMode = false;
      }
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
    },

    async savePlanting() {
      await this.upsertPlanting({
        plantingYear: this.plantingYear,
        ...this.form,
      });
      this.closeDialog();
      await this.refreshData();
    },

    async onSelectYearChange(year) {
      this.selectPlantingYear(year);
      await this.refreshData();
    },

    async onSelectYearClear() {
      this.clearPlantingYear();
      await this.refreshData();
    },

    async refreshData() {
      await this.fetchPlants();
      await this.fetchPlots();
      if (this.plantingYear) {
        await this.fetchPlantingsByYear(this.plantingYear);
      }
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
<style scoped>
.align-left {
  text-align: left !important;
}
</style>