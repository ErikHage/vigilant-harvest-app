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
            :on-edit-clicked="navigateToPlantEdit"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <add-plant-dialog
        :show="dialog"
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
import AddPlantDialog from "@/components/plants/AddPlantDialog.vue";

export default {
  name: 'PlantsPage',

  components: {
    AddPlantDialog,
    PageTitle,
    PlantsTable,
  },

  data: () => ({
    dialog: false,
  }),

  computed: {
    ...mapState(usePlantsStore, [
      'plants',
      'alertType',
      'alertMessage',
      'alertVisible',
    ]),
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'upsertPlant',
      'fetchPlants',
    ]),

    async refreshData() {
      await this.fetchPlants();
    },

    navigateToPlantDetails(plant) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId: plant.plantId,
        },
      });
    },

    navigateToPlantEdit(plant) {
      this.$router.push({
        name: 'PlantEditPage',
        params: {
          plantId: plant.plantId,
        },
      });
    },

    openDialog() {
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
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
