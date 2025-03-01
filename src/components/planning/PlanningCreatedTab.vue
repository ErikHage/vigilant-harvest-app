<template>
  <v-row dense>
    <v-col
        v-for="planting in sortedPlantings"
        cols="6">
      <v-card
          class="ma-1"
          elevation="3"
          density="compact"
          @click="onClickCard(planting)"
      >
        <v-card-title>
          <div class="d-flex justify-space-between">
            <p>{{ planting.name }}</p>
            <p>{{ getPlantName(planting.plantId) }}</p>
          </div>
        </v-card-title>
        <v-card-text>
          <div class="d-flex justify-space-between">
            <p>Start: {{ getStartDate(planting).format('dddd, MMM D') }}</p>
            <p>{{ getDaysUntilStart(planting) }} days to go!</p>
          </div>
          <v-progress-linear
              :model-value="getPlantingProgress(planting)"
              :height="10"
              :color="getProgressColor(planting)"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import dayjs from 'dayjs';

import { heatMap } from '@/utils/display'

export default {
  name: "PlanningCreatedTab",

  props: {
    plantings: Array,
    plantsMap: Object,
    plantingYearConfig: Object,
  },

  computed: {
    sortedPlantings() {
      return this.plantings.sort((a, b) => {
        const daysA = this.getDaysUntilStart(a);
        const daysB = this.getDaysUntilStart(b);

        if (daysA < daysB) return -1;
        if (daysA > daysB) return 1;
        return 0;
      });
    },

    plantingDate() {
      return dayjs(this.plantingYearConfig.targetPlantingDate);
    },

    startOfYear() {
      return dayjs().startOf('year');
    }
  },

  methods: {
    getPlantName(plantId) {
      return this.plantsMap[plantId]?.friendlyName ?? '---';
    },

    getStartDate(planting) {
      return this.plantingDate.subtract(planting.leadTimeWeeks, 'weeks');
    },

    getDaysUntilStart(planting) {
      const startDate = this.plantingDate.subtract(planting.leadTimeWeeks, 'weeks');
      return startDate.diff(dayjs(),'days');
    },

    getPlantingProgress(planting) {
      const startDate = this.getStartDate(planting);
      const totalDays = startDate.diff(this.startOfYear, 'days');
      const progressDays = dayjs().diff(this.startOfYear, 'days');

      return progressDays / totalDays * 100;
    },

    getProgressColor(planting) {
      const progress = this.getPlantingProgress(planting);

      return heatMap[Math.floor(progress / 10)];
    },

    onClickCard(planting) {
      this.$router.push({
        name: 'PlantingDetailsPage',
        params: {
          plantingId: planting.plantingId,
        },
      });
    }
  },
}
</script>
