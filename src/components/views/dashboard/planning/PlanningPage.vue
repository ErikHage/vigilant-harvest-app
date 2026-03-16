<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title :title="'Planting Plan - ' + plantingYear"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>

      <v-col v-if="planningDetails !== null" cols="12">
        <v-card>
          <v-card-title class="d-flex justify-center py-6">
            <div class="d-flex align-center ga-6">

              <v-chip
                  size="x-large"
                  variant="outlined"
                  color="primary"
              >
                Today: {{ formatDayOfMonthToDate(planningDetails.currentDay) }}
              </v-chip>

              <v-chip
                  size="x-large"
                  variant="outlined"
                  color="primary"
              >
                Planting Day: {{ formatDayOfMonthToDate(planningDetails.targetPlantingDay) }}
              </v-chip>

              <v-chip
                  size="x-large"
                  variant="outlined"
                  :color="currentVsTargetColor"
              >
                {{ dayDifference }} days until planting!
              </v-chip>

            </div>
          </v-card-title>

          <v-tabs v-model="activeTab" color="primary" grow>
            <v-tab value="planning">To Start</v-tab>
            <v-tab value="propagation">To Plant</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <v-tabs-window-item value="planning">
              <planning-table
                  :items="planningDetails.toStart.plantings"
                  :year="plantingYear"
                  action-day-title="Sowing Day"
              />
            </v-tabs-window-item>

            <v-tabs-window-item value="propagation">
              <planning-table
                  :items="planningDetails.toPlant.plantings"
                  :year="plantingYear"
                  action-day-title="Planting Day"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {useCommonStore, usePlanningStore} from "@/store";

import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlanningTable from "@/components/planning/PlanningTable.vue";
import dayjs from "dayjs";

export default {
  name: "PlanningPage",

  components: {
    PageTitle,
    FadeOutAlert,
    PlanningTable
  },

  data() {
    return {
      activeTab: 'planning',
    };
  },

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(usePlanningStore, {
      planningDetails: 'planningDetails',
      planningAlertType: 'alertType',
      planningAlertMessage: 'alertMessage',
      planningAlertVisible: 'alertVisible',
    }),

    alerts() {
      return [
        {
          isVisible: this.planningAlertVisible,
          type: this.planningAlertType,
          message: this.planningAlertMessage,
        },
      ];
    },

    dayDifference() {
      if (!this.planningDetails) {
        return 0;
      }
      return this.planningDetails.targetPlantingDay
          - this.planningDetails.currentDay;
    },

    currentVsTargetColor() {
      const diff = this.dayDifference

      if (diff <= 0) {
        return 'error';
      }
      if (diff <= 7) {
        return 'warning';
      }
      if (diff <= 30) {
        return 'primary';
      }
      return 'success';
    },
  },

  methods: {
    ...mapActions(usePlanningStore, [
      'fetchPlanningDetailsByYear',
    ]),

    formatDayOfMonthToDate(dayOfMonth) {
      if (!dayOfMonth) return '—';

      return dayjs(`${this.plantingYear}-01-01`)
          .add(dayOfMonth - 1, 'day')
          .format('MMM D');
    },
  },

  mounted() {
    this.fetchPlanningDetailsByYear(this.plantingYear);
  }
}
</script>
