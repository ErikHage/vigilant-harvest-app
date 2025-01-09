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
          :on-view-clicked="navigateToPlantDetails"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <upsert-plant-dialog
        :show="dialog"
        :plant="selectedPlant"
        :on-submit="savePlant"
        :on-cancel="closeDialog"
    />
  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantsTable from "@/components/plants/PlantsTable.vue";
import UpsertPlantDialog from "@/components/plants/UpsertPlantDialog.vue";

export default {
  name: 'PlantsPage',

  components: {
    UpsertPlantDialog,
    PageTitle,
    PlantsTable,
  },

  data: () => ({
    dialog: false,
    selectedPlant: null,
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

    navigateToPlantDetails(plant) {
      this.$router.push({ name: 'PlantDetailsPage', params: { plantId: plant.plantId } })
    },

    openDialog(plant) {
      if (plant !== undefined) {
        this.selectedPlant = plant;
      } else {
        this.selectedPlant = null;
      }
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
      this.selectedPlant = null;
    },

    async savePlant(plant) {
      await this.upsertPlant(plant);
      this.closeDialog();
      await this.refreshData();
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
