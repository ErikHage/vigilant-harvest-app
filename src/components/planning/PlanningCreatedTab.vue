<template>
  <v-table>
    <thead>
    <tr>
      <th>Plant</th>
      <th>Name</th>
      <th>Lead Time (weeks)</th>
      <th>Target Start Date</th>
      <th>Days Till Start</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="planting in plantings">
      <td>{{ getPlantName(planting.plantId) }}</td>
      <td>{{ planting.name }}</td>
      <td>{{ planting.leadTimeWeeks }}</td>
      <td>{{ getStartDate(planting) }}</td>
      <td>{{ getDaysUntilStart(planting) }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
import dayjs from 'dayjs';

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
  },

  methods: {
    getPlantName(plantId) {
      return this.plantsMap[plantId]?.friendlyName ?? '---';
    },

    getStartDate(planting) {
      return this.plantingDate.subtract(planting.leadTimeWeeks, 'weeks').format('YYYY-MM-DD');
    },

    getDaysUntilStart(planting) {
      const startDate = this.plantingDate.subtract(planting.leadTimeWeeks, 'weeks');
      return startDate.diff(dayjs(),'days');
    },
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