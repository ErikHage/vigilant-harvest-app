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
                Today: {{ today.format('MMM D') }}
              </v-chip>

              <v-chip
                  size="x-large"
                  variant="outlined"
                  color="primary"
              >
                Planting Day: {{ formatDayOfYear(planningDetails.targetPlantingDay) }}
              </v-chip>

              <v-chip
                  v-if="planningDetails.targetPlantingDay"
                  size="x-large"
                  variant="outlined"
                  :color="currentVsTargetColor"
              >
                {{ countdown }}
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
import { dayOfYearIn, daysFromToday } from "@/utils/dates";

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
      // the user's own day, as the plan was asked for it; the service's
      // currentDay is today's number in this year, so not today in another
      today: dayjs(),
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
      if (!this.planningDetails?.targetPlantingDay) {
        return 0;
      }
      return daysFromToday(dayOfYearIn(this.plantingYear, this.planningDetails.targetPlantingDay));
    },

    // It counted down below zero: "-3 days until planting!"
    countdown() {
      const days = this.dayDifference;
      const daysWord = count => (count === 1 ? '1 day' : `${count} days`);

      if (days > 0) {
        return `${daysWord(days)} until planting!`;
      }
      if (days === 0) {
        return 'Planting day is today!';
      }
      return `Planting day was ${daysWord(-days)} ago`;
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

    formatDayOfYear(dayOfYear) {
      if (!dayOfYear) return '—';

      return dayOfYearIn(this.plantingYear, dayOfYear).format('MMM D');
    },
  },

  mounted() {
    this.fetchPlanningDetailsByYear(this.plantingYear);
  }
}
</script>
