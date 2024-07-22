<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Manage Plantings</span>
            <v-spacer></v-spacer>
            <v-select>
<!--              TODO dropdown of year choice -->
            </v-select>
            <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
            <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="plantings"
                item-key="plantingId"
                class="elevation-1"
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
<!--            plant dropdown -->
            <v-text-field v-model.number="form.numPlants" type="number" label="Number of Plants" required></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isEditMode" color="blue darken-1" text @click="savePlant">Update</v-btn>
          <v-btn v-else color="blue darken-1" text @click="savePlant">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";

export default {
  name: 'PlantsPage',

  components: {},

  data: () => ({
    dialog: false,
    isEditMode: false,
    headers: [
      // { title: 'Id', key: 'plantingId' }, // don't need to show this on table
      { title: 'PlantId', key: 'plantId' },
      { title: 'Number of Plants', key: 'numPlants' },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
    form: {
      plantId: '',
      numPlants: 0,
    },
  }),

  computed: {
    ...mapState(usePlantsStore, [
      'plants',
    ]),

    ...mapState(usePlantingsStore, [
      'plantings', 'alertType', 'alertMessage', 'alertVisible',
    ]),
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'upsertPlanting',
      'fetchPlantings',
      'selectPlantingYear',
    ]),

    async refreshData() {
      if (this.selectedYear) {
        await this.fetchPlantings(this.selectedYear);
      }
    },

    resetForm() {
      this.form = {
        plantId: '',
        numPlants: 0,
      };
    },

    openDialog(planting) {
      console.log("planting", planting);
      if (planting !== undefined) {
        console.log('in edit mode if block');
        this.form = {
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
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
