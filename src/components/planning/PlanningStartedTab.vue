<template>
  <v-row dense>
    <v-col cols="12">
      <div class="d-flex justify-space-between">
        <p>Progress To Planting Day</p>
        <p>{{ daysUntilPlantingDay }} days to go!</p>
      </div>
      <v-progress-linear
          :model-value="progressToPlantingDay"
          :height="20"
          :color="progressToPlantingDayColor"
      ></v-progress-linear>
    </v-col>

  </v-row>
  {{ plantings }}
</template>

<script>
import dayjs from 'dayjs';

import { heatMap } from '@/utils/display'

export default {
  name: "PlanningStartedTab",

  props: {
    plantings: Array,
    plantsMap: Object,
    plantingYearConfig: Object,
  },

  computed: {
    startOfYear() {
      return dayjs().startOf('year');
    },

    targetPlantingDate() {
      return dayjs(this.plantingYearConfig.targetPlantingDate);
    },

    progressToPlantingDay() {
      return dayjs().diff(this.startOfYear, 'days');
    },

    daysUntilPlantingDay() {
      return this.targetPlantingDate.diff(dayjs(), 'days');
    },

    progressToPlantingDayColor() {
      return heatMap[Math.floor(this.progressToPlantingDay / 10)];
    }
  }
}
</script>
