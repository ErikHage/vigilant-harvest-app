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

            <v-card density="compact">
              <v-card-text class="d-flex justify-space-between">
                <div class="d-flex align-center">
                  <comment-planting-action-dialog
                      :planting="planting"
                      :on-submit="performAction"/>

                  <start-planting-action-dialog
                      v-if="planting && showAction('Start')"
                      :planting="planting"
                      :on-submit="performAction"/>

                  <plant-planting-action-dialog
                      v-if="planting && showAction('Plant')"
                      :planting="planting"
                      :plots="plots"
                      :on-submit="performAction"/>

                  <delete-planting-action-dialog
                      v-if="planting && showAction('Delete')"
                      :planting="planting"
                      :on-submit="performAction"/>

                  <retire-planting-action-dialog
                      v-if="planting && showAction('Retire')"
                      :planting="planting"
                      :on-submit="performAction"/>
                </div>

                <div class="d-flex align-center">
                  <v-switch
                      v-model="enableEdit"
                      color="#00C000"
                      density="compact"
                      base-color="#C00000">
                    <template v-slot:label>
                      <v-icon>{{ enableEdit ? 'mdi-lock-open' : 'mdi-lock' }}</v-icon>
                    </template>
                  </v-switch>

                  <v-btn
                      class="mx-1"
                      text="Update"
                      color="warning"
                      :disabled="!enableEdit"
                      @click="handleUpdatePlanting"
                  ></v-btn>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-tabs
                  v-model="tab"
                  align-tabs="start"
                  fixed-tabs>
                <v-tab value="details">Details</v-tab>
                <v-tab value="history">History</v-tab>
              </v-tabs>

              <v-card-text>
                <v-tabs-window v-model="tab">

                  <v-tabs-window-item value="details">
                    <planting-details-tab
                        :planting="plantingCopy"
                        :plants="plants"
                        :plots="plots"
                        :enable-edit="enableEdit"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="history">
                    <planting-history-tab
                        :history="sortedHistory"/>
                  </v-tabs-window-item>

                </v-tabs-window>
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
import sorting from '@/utils/sorting';

import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import StartPlantingActionDialog from "@/components/plantings/StartPlantingActionDialog.vue";
import PlantPlantingActionDialog from "@/components/plantings/PlantPlantingActionDialog.vue";
import RetirePlantingActionDialog from "@/components/plantings/RetirePlantingActionDialog.vue";
import DeletePlantingActionDialog from "@/components/plantings/DeletePlantingActionDialog.vue";
import CommentPlantingActionDialog from "@/components/plantings/CommentPlantingActionDialog.vue";
import PlantDetailsTab from "@/components/plants/PlantDetailsTab.vue";
import PlantingDetailsTab from "@/components/plantings/PlantingDetailsTab.vue";
import PlantingHistoryTab from "@/components/plantings/PlantingHistoryTab.vue";

const { plantingActions, plantingStatuses } = plantingUtils;

export default {
  name: "PlantingDetailsPage",

  components: {
    PlantingHistoryTab,
    PlantingDetailsTab,
    PlantDetailsTab,
    CommentPlantingActionDialog,
    DeletePlantingActionDialog,
    RetirePlantingActionDialog,
    PlantPlantingActionDialog,
    StartPlantingActionDialog,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      tab: null,
      enableEdit: false,
      actionMapping: {
        'CREATED': ['Start', 'Plant', 'Delete'],
        'STARTED': ['Plant'],
        'PLANTED': ['Retire'],
        'RETIRED': [],
      },
      plantingCopy: {
        plantingId: null,
        plotId: null,
        plantId: null,
        plantingYear: null,
        name: null,
        seedSource: null,
        lotNumber: null,
        leadTimeWeeks: null,
        sowDate: null,
        sowType: null,
        numberSown: null,
        transplantDate: null,
        numberTransplanted: null,
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
      plants: 'plants',
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
      return this.plantingCopy?.name ?? 'Planting Details';
    },

    plot() {
      return this.plotsById[this.plantingCopy?.plotId];
    },

    plant() {
      return this.plantsById[this.plantingCopy?.plantId];
    },

    statusColor() {
      return plantingUtils.mapPlantingStatusToColor(this.plantingCopy?.currentStatus);
    },

    sortedHistory() {
      return this.plantingCopy?.statusHistory.sort(sorting.sortPlantingHistoryByDateCreated);
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
      'updatePlanting',
    ]),

    async refreshData() {
      await this.fetchPlots();
      await this.fetchPlantingById(this.plantingId);

      const planting = this.plantingsById[this.plantingId];
      this.plantingCopy = {
        plantingId: planting.plantingId ?? undefined,
        plotId: planting.plotId ?? undefined,
        plantId: planting.plantId ?? undefined,
        plantingYear: planting.plantingYear ?? undefined,
        name: planting.name ?? undefined,
        seedSource: planting.seedSource ?? undefined,
        lotNumber: planting.lotNumber ?? undefined,
        leadTimeWeeks: planting.leadTimeWeeks ?? undefined,
        sowDate: planting.sowDate ?? undefined,
        sowType: planting.sowType ?? undefined,
        numberSown: planting.numberSown ?? undefined,
        transplantDate: planting.transplantDate ?? undefined,
        numberTransplanted: planting.numberTransplanted ?? undefined,
        statusHistory: planting.statusHistory ?? [],
        currentStatus: planting.currentStatus,
        dateCreated: planting.dateCreated,
        dateModified: planting.dateModified,
      };
    },

    showAction(actionName) {
      return this.actionMapping[this.plantingCopy.currentStatus]?.includes(actionName) ?? false;
    },

    async performAction(action, actionData) {
      await this.performPlantingAction(this.plantingId, action, actionData);

      if (action === plantingActions.delete) {
        this.$router.push({
          name: 'PlantingsPage',
        });
      } else {
        await this.refreshData();
      }
    },

    async handleUpdatePlanting() {
      let requestBody = {};

      switch (this.plantingCopy.currentStatus) {
        case plantingStatuses.created:
          requestBody = {
            seedSource: this.plantingCopy.seedSource,
            lotNumber: this.plantingCopy.lotNumber,
            plantId: this.plantingCopy.plantId,
            leadTimeWeeks: this.plantingCopy.leadTimeWeeks,
          };
          break;
        case plantingStatuses.started:
          requestBody = {
            seedSource: this.plantingCopy.seedSource,
            lotNumber: this.plantingCopy.lotNumber,
            sowDate: this.plantingCopy.sowDate,
            numberSown: this.plantingCopy.numberSown,
          };
          break;
        case plantingStatuses.planted:
          requestBody = {
            seedSource: this.plantingCopy.seedSource,
            lotNumber: this.plantingCopy.lotNumber,
            plotId: this.plantingCopy.plotId,
            transplantDate: this.plantingCopy.transplantDate,
            numberTransplanted: this.plantingCopy.numberTransplanted,
          };
          break;
        case plantingStatuses.retired:
          requestBody = {
            seedSource: this.plantingCopy.seedSource,
            lotNumber: this.plantingCopy.lotNumber,
          };
          break;
      }

      await this.updatePlanting(this.plantingId, requestBody);
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>
