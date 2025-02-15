<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Plantings"/>
        <v-spacer></v-spacer>
        <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
        <v-btn class="mt-3" color="warning" @click="refreshData">Refresh</v-btn>
        <v-spacer></v-spacer>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message" />
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <plantings-table
          :plots-map="plotsById"
          :plants-map="plantsById"
          :plantings="plantings"
          :on-edit-clicked="openDialog"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <upsert-planting-dialog
      :show="dialog"
      :planting="selectedPlanting"
      :plants="plants"
      :plots="plots"
      :on-submit="savePlanting"
      :on-cancel="closeDialog"
    />

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantingsTable from "@/components/plantings/PlantingsTable.vue";
import UpsertPlantingDialog from "@/components/plantings/UpsertPlantingDialog.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: 'PlantingsPage',

  components: {
    FadeOutAlert,
    UpsertPlantingDialog,
    PlantingsTable,
    PageTitle,
    PlantingYearSelectCard,
  },

  data: () => ({
    dialog: false,
    selectedPlanting: null,
  }),

  computed: {
    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    ...mapState(usePlotsStore, {
      plots: 'plots',
      plotsById: 'plotsById',
      plotsAlertType: 'alertType',
      plotsAlertMessage: 'alertMessage',
      plotsAlertVisible: 'alertVisible',
    }),

    ...mapState(usePlantsStore, {
      plants: 'plants',
      plantsById: 'plantsById',
      plantsAlertType: 'alertType',
      plantsAlertMessage: 'alertMessage',
      plantsAlertVisible: 'alertVisible',
    }),

    ...mapState(usePlantingsStore, {
      plantings: 'plantings',
      plantingsAlertType: 'alertType',
      plantingsAlertMessage: 'alertMessage',
      plantingsAlertVisible: 'alertVisible',
    }),

    alert() {
      return {
        isVisible: this.plantingsAlertVisible || this.plantsAlertVisible || this.plotsAlertVisible,
        type: [this.plantingsAlertType, this.plantsAlertType, this.plotsAlertType]
            .includes('error') ? 'error' : 'success',
        message: [this.plantingsAlertMessage, this.plantsAlertMessage, this.plotsAlertMessage]
            .filter(message => message != null)
            .join("\n"),
      };
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
      'upsertPlanting',
      'fetchPlantingsByYear',
    ]),

    openDialog(planting) {
      if (planting !== undefined) {
        this.selectedPlanting = planting;
      } else {
        this.selectedPlanting = null;
      }
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
      this.selectedPlanting = null;
    },

    async savePlanting(planting) {
      await this.upsertPlanting({
        ...planting,
        plantingYear: this.plantingYear,
      });
      this.closeDialog();
      await this.refreshData();
    },

    async refreshData() {
      await this.fetchPlants();
      await this.fetchPlots();
      await this.fetchPlantingsByYear(this.plantingYear);
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
<style scoped>
</style>