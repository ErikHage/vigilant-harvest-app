<template>
  <v-row dense>
    <v-col cols="12" class="mb-4">
      <v-card density="compact">
        <v-card-text>
          <div class="d-flex justify-space-between">
            <p>Progress To Planting Day</p>
            <p>{{ daysUntilPlantingDay }} days to go!</p>
          </div>
          <v-progress-linear
              :model-value="progressToPlantingDay"
              :height="20"
              :color="progressToPlantingDayColor"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col
        v-for="planting in sortedPlantings"
        cols="12">
      <v-card
          class="ma-1"
          elevation="3"
          density="compact"
          @click="onClickCard(planting)">
        <div class="d-flex justify-start align-center">
          <v-progress-circular
              class="mx-4"
              :color="getProgressColor(planting)"
              :model-value="getProgress(planting)"
              :size="80"
              :width="40"
          ></v-progress-circular>
              <div>
                <v-card-title class="overflow-text">{{ planting.name }}</v-card-title>
                <v-card-subtitle>{{ getPlantName(planting.plantId) }}</v-card-subtitle>
                <v-card-text>
                  <p>Sown On: {{ planting.sowDate }}</p>
                </v-card-text>
              </div>
        </div>
      </v-card>
    </v-col>

  </v-row>
</template>

<script>
import dayjs from 'dayjs';

import {heatMap} from '@/utils/display'
import sorting from "@/utils/sorting";

export default {
  name: "PlanningStartedTab",

  props: {
    plantings: Array,
    plantsMap: Object,
    plantingYearConfig: Object,
  },

  computed: {
    sortedPlantings() {
      return this.plantings.sort(sorting.sortByPlantingName);
    },

    startOfYear() {
      return dayjs().startOf('year');
    },

    targetPlantingDate() {
      return dayjs(this.plantingYearConfig.targetPlantingDate);
    },

    progressToPlantingDay() {
      return dayjs().diff(this.startOfYear, 'days') / this.targetPlantingDate.diff(this.startOfYear, 'days') * 100;
    },

    daysUntilPlantingDay() {
      return this.targetPlantingDate.diff(dayjs(), 'days');
    },

    progressToPlantingDayColor() {
      return heatMap[Math.floor(this.daysUntilPlantingDay / 10)];
    }
  },

  methods: {
    getPlantName(plantId) {
      return this.plantsMap[plantId]?.friendlyName ?? '---';
    },

    getProgress(planting) {
      const dateSown = dayjs(planting.sowDate);
      const daysElapsed = dayjs().diff(dateSown, 'days');
      const totalDays = this.targetPlantingDate.diff(dateSown, 'days');

      return daysElapsed / totalDays * 100;
    },

    getProgressColor(planting) {
      const progress = this.getProgress(planting);

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

<style scoped>
.overflow-text {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
