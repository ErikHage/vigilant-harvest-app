<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <v-row>
          <v-col cols="12" class="text-center">
            <page-title :title="title"/>
            <v-spacer></v-spacer>
            <v-chip size="large" :color="statusColor">{{ planting.currentStatus }}</v-chip>
            <v-spacer></v-spacer>
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

            <v-card>
              <v-card-text class="text-center">
                <v-btn class="mx-1" color="primary">Comment</v-btn>

                <start-planting-action-dialog
                    v-if="planting && showAction('Start')"
                    :planting="planting"
                    :on-submit="performAction"/>

                <plant-planting-action-dialog
                    v-if="planting && showAction('Plant')"
                    :planting="planting"
                    :plots="plots"
                    :on-submit="performAction"/>

                <v-btn v-if="showAction('Delete')" class="mx-1" color="error">Delete</v-btn>
                <v-btn v-if="showAction('Retire')" class="mx-1" color="warning">Retire</v-btn>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-text>
                <v-text-field v-model="plantingId" label="Id" variant="solo" density="compact" disabled/>

                <div class="d-flex">
                  <v-text-field v-model="createdAt" label="Created At" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="lastModifiedAt" label="Last Updated" variant="solo" density="compact" disabled/>
                </div>

                <div class="d-flex">
                  <v-text-field v-model="planting.seedSource" label="source" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="planting.lotNumber" label="Lot#" variant="solo" density="compact" disabled/>
                </div>

                <div class="d-flex">
                  <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlantDetails(planting.plantId)">
                    <v-icon>mdi-sprout-outline</v-icon>
                  </v-btn>
                  <v-text-field v-model="plant.friendlyName" class="ml-1" label="Plant" variant="solo" density="compact" disabled/>
                  <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlotDetails(planting.plotId)">
                    <v-icon>mdi-vector-square</v-icon>
                  </v-btn>
                  <v-text-field v-model="plotName" class="ml-1" label="Plot" variant="solo" density="compact" disabled/>
                </div>

                <div class="d-flex">
                  <v-text-field v-model="sowDate" label="Sow Date" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="sowType" label="Sow Type" variant="solo" density="compact" disabled/>
                </div>

                <div class="d-flex">
                  <v-text-field v-model="leadTime" label="Transplant Lead Time" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="transplantDate" label="Transplant Date" variant="solo" density="compact" disabled/>
                </div>

                <v-text-field v-model="numberOfPlants" label="Number of Plants" variant="solo" density="compact" disabled/>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Notes</v-card-title>
              <v-card-text>
                <v-card
                    v-for="note in notes"
                    class="mt-2">
                  <v-card-text>
                    {{ note }}
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>

          </v-col>
        </v-row>
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import plantingUtils from '@/utils/plantings';

import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import StartPlantingActionDialog from "@/components/plantings/StartPlantingActionDialog.vue";
import PlantPlantingActionDialog from "@/components/plantings/PlantPlantingActionDialog.vue";

export default {
  name: "PlantingDetailsPage",

  components: {
    PlantPlantingActionDialog,
    StartPlantingActionDialog,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      unassignedPlot: '---',
      actionMapping: {
        'CREATED': ['Start', 'Plant', 'Delete'],
        'STARTED': ['Plant'],
        'PLANTED': ['Retire'],
        'RETIRED': [],
      },
    };
  },

  computed: {
    ...mapState(usePlotsStore, {
      plots: 'plots',
      plotsById: 'plotsById',
      plotsAlertType: 'alertType',
      plotsAlertMessage: 'alertMessage',
      plotsAlertVisible: 'alertVisible',
    }),

    ...mapState(usePlantsStore, {
      plantsById: 'plantsById',
      plantsAlertType: 'alertType',
      plantsAlertMessage: 'alertMessage',
      plantsAlertVisible: 'alertVisible',
    }),

    ...mapState(usePlantingsStore, {
      plantingsById: 'plantingsById',
      plantingsAlertType: 'alertType',
      plantingsAlertMessage: 'alertMessage',
      plantingsAlertVisible: 'alertVisible',
    }),

    plantingId() {
      return this.$route.params.plantingId;
    },

    planting() {
      return this.plantingsById ? this.plantingsById[this.plantingId] : null;
    },

    title() {
      return this.planting?.name ?? 'Planting Details';
    },

    createdAt() {
      return this.planting ? new Date(this.planting.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.planting ? new Date(this.planting.dateModified).toLocaleString() : '--';
    },

    notes() {
      return this.planting ? this.planting.notes : [];
    },

    plotName() {
      const plot = this.plotsById[this.planting.plotId];
      return plot ? plot.friendlyName : '---';
    },

    plant() {
      return this.plantsById[this.planting.plantId];
    },

    sowDate() {
      return this.planting.sowDate
          ? new Date(this.planting.sowDate).toLocaleDateString()
          : '---';
    },

    sowType() {
      return this.planting.sowType || '---';
    },

    transplantDate() {
      return this.planting.transplantDate
          ? new Date(this.planting.transplantDate).toLocaleDateString()
          : '---';
    },

    numberOfPlants() {
      return this.planting.numberTransplanted || this.planting.numberSown || '---';
    },

    leadTime() {
      return this.planting.leadTimeWeeks
          ? this.planting.leadTimeWeeks + ' weeks'
          : '---';
    },

    statusColor() {
      return plantingUtils.mapPlantingStatusToColor(this.planting?.currentStatus);
    },

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

    ...mapActions(usePlantingsStore, [
      'fetchPlantingById',
      'performPlantingAction',
    ]),

    async refreshData() {
      await this.fetchPlots();
      await this.fetchPlantingById(this.plantingId);
    },

    navigateToPlotDetails(plotId) {
      console.log('plot clicked, do something in the future');
    },

    navigateToPlantDetails(plantId) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId,
        },
      });
    },

    showAction(actionName) {
      return this.actionMapping[this.planting.currentStatus]?.includes(actionName) ?? false;
    },

    async performAction(action, actionData) {
      await this.performPlantingAction(this.plantingId, action, actionData);
      await this.refreshData();
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>

<style scoped>

</style>