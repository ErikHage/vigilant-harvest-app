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
                        :planting="planting"
                        :plant="plant"
                        :plot="plot"/>
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

const { plantingActions } = plantingUtils;

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

    plot() {
      return this.plotsById[this.planting.plotId];
    },

    plant() {
      return this.plantsById[this.planting.plantId];
    },

    statusColor() {
      return plantingUtils.mapPlantingStatusToColor(this.planting?.currentStatus);
    },

    sortedHistory() {
      return this.planting.statusHistory.sort(sorting.sortPlantingHistoryByDateCreated);
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

    showAction(actionName) {
      return this.actionMapping[this.planting.currentStatus]?.includes(actionName) ?? false;
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
  },

  mounted() {
    this.refreshData();
  },
}
</script>
