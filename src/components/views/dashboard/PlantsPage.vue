<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Plants"/>
        <v-spacer></v-spacer>
        <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <plants-table
          :plants="plants"
          :on-edit-clicked="openDialog"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ isEditMode ? 'Edit Plant' : 'Add Plant' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="applicationForm">
            <v-text-field v-model="form.friendlyName" label="Name" required></v-text-field>
            <v-text-field v-model="form.family" label="Family" required></v-text-field>
            <v-text-field v-model="form.genus" label="Genus" required></v-text-field>
            <v-text-field v-model="form.species" label="Species" required></v-text-field>
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
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantsTable from "@/components/plants/PlantsTable.vue";

export default {
  name: 'PlantsPage',

  components: {
    PageTitle,
    PlantsTable,
  },

  data: () => ({
    dialog: false,
    isEditMode: false,
    form: {
      plantId: '',
      friendlyName: '',
      family: '',
      genus: '',
      species: '',
    },
  }),

  computed: {
    ...mapState(usePlantsStore, [
      'plants', 'alertType', 'alertMessage', 'alertVisible',
    ]),
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'upsertPlant',
      'fetchPlants',
      'selectPlant',
      'deletePlantById',
    ]),

    async refreshData() {
      await this.fetchPlants();
    },

    resetForm() {
      this.form = {
        plantId: '',
        friendlyName: '',
        family: '',
        genus: '',
        species: '',
      };
    },

    openDialog(plant) {
      console.log("plant", plant);
      if (plant !== undefined) {
        console.log('in edit mode if block');
        this.form = {
          plantId: plant.plantId,
          friendlyName: plant.friendlyName,
          family: plant.family,
          genus: plant.genus,
          species: plant.species,
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

    async savePlant() {
      await this.upsertPlant(this.form);
      this.closeDialog();
      await this.refreshData();
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
