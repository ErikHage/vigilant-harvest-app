<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Plantings"/>
        <v-spacer></v-spacer>
        <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
        <v-btn class="mt-3" color="warning" @click="refreshData">Refresh</v-btn>
        <v-spacer></v-spacer>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <plantings-table
          :plots-map="plotsById"
          :plants-map="plantsById"
          :plantings="plantings"
          :on-view-clicked="navigateToPlantingDetails"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <add-planting-dialog
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
import AddPlantingDialog from "@/components/plantings/AddPlantingDialog.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: 'PlantingsPage',

  components: {
    FadeOutAlert,
    AddPlantingDialog,
    PlantingsTable,
    PageTitle,
    PlantingYearSelectCard,
  },

  data: () => ({
    dialog: false,
    selectedPlanting: null,
  }),

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

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

    alerts() {
      return [
        {
          isVisible: this.plantingsAlertVisible,
          type: this.plantingsAlertType,
          message: this.plantingsAlertMessage,
        },
        {
          isVisible: this.plantsAlertVisible,
          type: this.plantsAlertType,
          message: this.plantsAlertMessage,
        },
        {
          isVisible: this.plotsAlertVisible,
          type: this.plotsAlertType,
          message: this.plotsAlertMessage,
        }
      ];
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

    navigateToPlantingDetails(planting) {
      this.$router.push({
        name: 'PlantingDetailsPage',
        params: {
          plantingId: planting.plantingId,
        },
      });
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