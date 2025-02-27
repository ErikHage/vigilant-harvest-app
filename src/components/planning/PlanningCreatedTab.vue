<template>
  <v-table>
    <thead>
    <tr>
      <th>Plant</th>
      <th>Name</th>
      <th>Lead Time (weeks)</th>
      <th>Target Start Date</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="planting in plantings">
      <td>{{ getPlantName(planting.plantId) }}</td>
      <td>{{ planting.name }}</td>
      <td>{{ planting.leadTimeWeeks }}</td>
      <td>{{ getStartDate(planting) }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlanningCreatedTab",

  props: {
    plantings: Array,
    plantsMap: Object,
  },

  methods: {
    getPlantName(plantId) {
      return this.plantsMap[plantId]?.friendlyName ?? '---';
    },

    getStartDate(planting) {
      return '---';
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