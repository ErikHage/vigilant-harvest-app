<template>
  <v-table>
    <tbody>
    <tr>
      <th class="details-header shrink-column">Sun</th>
      <td>{{ plant.growing.requiredSun }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Days to Maturity</th>
      <td>{{ plant.growing.daysToMaturity}}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Climbing</th>
      <td>{{ plant.growing.isClimbing }}</td>
    </tr>
    <tr v-if="plant.growing.isClimbing">
      <th class="details-header shrink-column">Climbing Height</th>
      <td>{{ plant.growing.climbingHeightFeet }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Mature Size</th>
      <td>{{ plant.growing.plantSize }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantGrowingTab",

  props: {
    plant: Object,
  },
}
</script>

<style scoped>
.details-header {
  font-weight: bold;
}
.shrink-column {
  white-space: nowrap;
  width: 1%;
}
.multiline-cell {
  white-space: pre-wrap;
}
</style>