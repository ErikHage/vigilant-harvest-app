<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Manage Plantings</span>
            <v-spacer></v-spacer>
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
      <v-col cols="12">
        <v-card v-if="selectedYear != null">
          <v-card-title>
            <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
            <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
          </v-card-title>
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
import { usePlantingsStore, usePlantsStore } from "@/store";

export default {
  name: 'PlantsPage',

  components: {},

  data: () => ({
    availableYears: [2024, 2025], // TODO source from backend
    selectedYear: null,
    dialog: false,
    isEditMode: false,
    headers: [
      // { title: 'Id', key: 'plantingId', align: 'left', }, // probably don't need to show this on table
      { title: 'Plant', key: 'plantName', align: 'start', },
      { title: 'Count', key: 'numPlants', align: 'start', },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
    form: {
      plantingId: null,
      plantId: '',
      numPlants: 0,
    },
  }),

  computed: {
    ...mapState(usePlantsStore, [
      'plants', 'plantsById',
    ]),

    ...mapState(usePlantingsStore, [
      'plantings', 'alertType', 'alertMessage', 'alertVisible',
    ]),

    hydratedPlantings() {
      return this.plantings.map(planting => {
        const plant = this.plantsById[planting.plantId];
        return {
          ...planting,
          plantName: plant.friendlyName,
        };
      });
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'upsertPlanting',
      'fetchPlantingsByYear',
      'selectPlantingYear',
    ]),

    resetForm() {
      this.form = {
        plantingId: null,
        plantId: '',
        numPlants: 0,
      };
    },

    openDialog(planting) {
      console.log("planting", planting);
      if (planting !== undefined) {
        console.log('in edit mode if block');
        this.form = {
          plantingId: planting.plantingId,
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
      await this.upsertPlanting(this.form);
      this.closeDialog();
      await this.refreshData();
    },

    async onSelectYearChange(year) {
      await this.selectPlantingYear(year);
    },

    async refreshData() {
      await this.fetchPlants();
      if (this.selectedYear) {
        await this.fetchPlantingsByYear(this.selectedYear);
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