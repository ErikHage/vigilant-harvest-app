<template>
  <v-table>
    <tbody>
    <tr>
      <th class="details-header shrink-column">Indoors</th>
      <td>{{ plant.sowing.indoor }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Direct</th>
      <td>{{ plant.sowing.direct}}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Germination Time</th>
      <td>{{ plant.sowing.germinationDaysRange }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Germination Temperature</th>
      <td>{{ plant.sowing.germinationTempRange }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantSowingTab",

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