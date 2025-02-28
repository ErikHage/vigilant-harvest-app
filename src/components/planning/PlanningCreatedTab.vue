<template>
  <v-row>
    <v-col
        v-for="planting in plantings"
        cols="6">
      <v-card
          class="ma-1"
          elevation="3"
          density="compact"
      >
        <v-card-title>{{ planting.name }} [{{ getPlantName(planting.plantId) }}]</v-card-title>
        <v-card-text>
          Start: {{ getStartDate(planting).format('dddd, MMM D') }}
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

const progressColorMap = {
  [0]: '#FF0000', // red
  [1]: '#FF8000', // orange
  [2]: '#FFFF00', // yellow
  [3]: '#80FF00', // light green
  [4]: '#00FF00', // green
};

export default {
  name: "PlanningCreatedTab",

  props: {
    plantings: Array,
    plantsMap: Object,
    plantingYearConfig: Object,
  },

  computed: {
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

      return progressColorMap[Math.floor(progress / 20)];
    }
  },
}
</script>

<style scoped>
.shrink-column {
  white-space: nowrap;
  width: 1%;
}
.multiline-cell {
  white-space: pre-wrap;
}
</style>