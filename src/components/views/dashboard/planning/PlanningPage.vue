<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Planning"/>
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

        <v-card class="mt-4">
          <v-tabs
              v-model="tab"
              align-tabs="start"
              fixed-tabs>
            <v-tab value="created">Starting Schedule</v-tab>
            <v-tab value="started">Seedlings</v-tab>
          </v-tabs>

          <v-card-text>
            <v-tabs-window v-model="tab">

              <v-tabs-window-item value="created">
                <planning-created-tab
                    :plantings="createdPlantings"
                    :plants-map="plantsById"
                    :planting-year-config="plantingYearConfig"/>
              </v-tabs-window-item>

              <v-tabs-window-item value="started">
                <planning-started-tab
                    :plantings="startedPlantings"
                    :plants-map="plantsById"/>
              </v-tabs-window-item>

            </v-tabs-window>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { useCommonStore, usePlantingsStore, usePlantsStore } from "@/store";
import plantingUtils from '@/utils/plantings';

import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlanningCreatedTab from "@/components/planning/PlanningCreatedTab.vue";
import PlanningStartedTab from "@/components/planning/PlanningStartedTab.vue";

const { plantingStatuses } = plantingUtils;

export default {
  name: "PlanningPage",

  components: {
    PlanningStartedTab,
    PlanningCreatedTab,
    PageTitle,
    FadeOutAlert,
  },

  data() {
    return {
      tab: null,
    };
  },

  computed: {
    ...mapState(useCommonStore, {
      plantingYearsByYear: 'plantingYearsByYear',
      plantingYear: 'plantingYear',
    }),

    ...mapState(usePlantsStore, {
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

    createdPlantings() {
      return this.plantings.filter(planting => planting.currentStatus === plantingStatuses.created);
    },

    startedPlantings() {
      return this.plantings.filter(planting => planting.currentStatus === plantingStatuses.started);
    },

    plantingYearConfig() {
      return this.plantingYearsByYear[this.plantingYear];
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
      ];
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
    ]),
  },

  mounted() {
    this.fetchPlants();
    this.fetchPlantingsByYear();
  }
}
</script>

<style scoped>

</style>